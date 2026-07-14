import { prisma } from "../lib/prisma";
import { hashPassword, verifyPassword } from "../utils/passwordHashing";
import { signToken } from "../middleware/auth";


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
        user: {
            id: pushUser.id,
            name: pushUser.name,
            email: pushUser.auth!.email,
            relaxedWorkTime: pushUser.relaxedWorkTime,
            relaxedBreakTime: pushUser.relaxedBreakTime,
            standardWorkTime: pushUser.standardWorkTime,
            standardBreakTime: pushUser.standardBreakTime,
            focusedWorkTime: pushUser.focusedWorkTime,
            focusedBreakTime: pushUser.focusedBreakTime,
        },
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

    const isValidPassword = await verifyPassword(password, existingAuth.passwordHash);

    if (!isValidPassword) {
        throw new Error("Invalid email or password");
    }

    const token = signToken({ userId: existingAuth.user.id, email: existingAuth.email });

    return {
        token,
        user: {
            id: existingAuth.user.id,
            name: existingAuth.user.name,
            email: existingAuth.email,
            relaxedWorkTime: existingAuth.user.relaxedWorkTime,
            relaxedBreakTime: existingAuth.user.relaxedBreakTime,
            standardWorkTime: existingAuth.user.standardWorkTime,
            standardBreakTime: existingAuth.user.standardBreakTime,
            focusedWorkTime: existingAuth.user.focusedWorkTime,
            focusedBreakTime: existingAuth.user.focusedBreakTime,
        },
    };
}
