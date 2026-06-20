import { prisma } from "../lib/prisma";
import { hashPassword, verifyPassword } from "../utils/passwordHashing";


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


    return {
        id: pushUser.id,
        name: pushUser.name,
        email: pushUser.auth!.email,
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

    return {
        id: existingAuth.user.id,
        name: existingAuth.user.name,
        email: existingAuth.email,
    };
}
