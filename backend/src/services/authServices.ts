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
        email: pushUser.auth.email,
    };
}


