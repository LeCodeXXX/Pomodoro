import axios from "axios";
import { prisma } from "../lib/prisma";
import { hashPassword, verifyPassword } from "../utils/passwordHashing";
import { signToken } from "../middleware/auth";

const buildUserPayload = (user: any, auth: any) => ({
    id: user.id,
    name: user.name,
    email: auth.email,
    relaxedWorkTime: user.relaxedWorkTime,
    relaxedBreakTime: user.relaxedBreakTime,
    standardWorkTime: user.standardWorkTime,
    standardBreakTime: user.standardBreakTime,
    focusedWorkTime: user.focusedWorkTime,
    focusedBreakTime: user.focusedBreakTime,
});

const getGoogleConfig = () => {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri = process.env.GOOGLE_REDIRECT_URI;

    if (!clientId || !clientSecret || !redirectUri) {
        throw new Error("Google OAuth is not configured. Please provide all required Google OAuth environment variables.");
    }

    return { clientId, clientSecret, redirectUri };
};

export const createAccount = async ({ name, email, password }: { name: string, email: string, password: string }) => {

    const existingUser = await prisma.auth.findUnique({ where: { email } })

    if (existingUser) {
        throw new Error("User already exists")
    }

    const pushUser = await prisma.user.create({
        data: {
            name,
            auth: {
                create: {
                    email,
                    passwordHash: await hashPassword(password),
                }
            }
        },
        include: {
            auth: true,
        }
    });


    const token = signToken({ userId: pushUser.id, email: pushUser.auth!.email });

    return {
        token,
        user: buildUserPayload(pushUser, pushUser.auth!),
    };
}


export const login = async ({ email, password }: { email: string, password: string }) => {

    const existingAuth = await prisma.auth.findUnique({
        where: { email },
        include: { user: true }
    });

    if (!existingAuth) {
        throw new Error("Invalid email or password");
    }

    if (!existingAuth.passwordHash) {
        throw new Error("This account uses OAuth and cannot sign in with a password.");
    }

    const isValidPassword = await verifyPassword(password, existingAuth.passwordHash);

    if (!isValidPassword) {
        throw new Error("Invalid email or password");
    }

    const token = signToken({ userId: existingAuth.user.id, email: existingAuth.email });

    return {
        token,
        user: buildUserPayload(existingAuth.user, existingAuth),
    };
}

export const getGoogleAuthUrl = async () => {
    const { clientId, redirectUri } = getGoogleConfig();
    const params = new URLSearchParams({
        client_id: clientId,
        redirect_uri: redirectUri,
        response_type: "code",
        scope: "openid email profile",
        access_type: "offline",
        prompt: "consent",
    });

    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
};

export const googleAuthCallback = async (code: string) => {
    const { clientId, clientSecret, redirectUri } = getGoogleConfig();

    const tokenResponse = await axios.post("https://oauth2.googleapis.com/token", {
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
    }, {
        headers: { "Content-Type": "application/json" },
    });

    const accessToken = tokenResponse.data.access_token;
    const profileResponse = await axios.get("https://www.googleapis.com/oauth2/v2/userinfo", {
        headers: { Authorization: `Bearer ${accessToken}` },
    });

    const profile = profileResponse.data;
    const googleId = profile.id as string;
    const email = profile.email as string;
    const name = profile.name || profile.given_name || email?.split("@")[0] || "User";

    if (!googleId || !email) {
        throw new Error("Google did not return enough profile information.");
    }

    const existingAuth = await prisma.auth.findFirst({
        where: {
            OR: [
                { provider: "google", providerId: googleId },
                { email },
            ],
        },
        include: { user: true },
    });

    if (existingAuth) {
        if (existingAuth.provider !== "google" || existingAuth.providerId !== googleId) {
            await prisma.auth.update({
                where: { id: existingAuth.id },
                data: {
                    provider: "google",
                    providerId: googleId,
                    emailVerified: true,
                },
            });
        }

        const token = signToken({ userId: existingAuth.user.id, email: existingAuth.email });

        return {
            token,
            user: buildUserPayload(existingAuth.user, existingAuth),
        };
    }

    const createdUser = await prisma.user.create({
        data: {
            name,
            auth: {
                create: {
                    email,
                    provider: "google",
                    providerId: googleId,
                    emailVerified: true,
                },
            },
        },
        include: { auth: true },
    });

    const token = signToken({ userId: createdUser.id, email: createdUser.auth!.email });

    return {
        token,
        user: buildUserPayload(createdUser, createdUser.auth!),
    };
};
