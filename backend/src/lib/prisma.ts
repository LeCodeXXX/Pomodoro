import { PrismaClient } from '../generated/prisma/client';
import dotenv from 'dotenv';

dotenv.config();

//Function that creates a new instance of PrismaClient and returns it
const prismaClientSingleton = () => {
    return new PrismaClient({

    });
}

//Tells typescript to use this global variable to store the prisma client
const globalForPrisma = global as unknown as {
    prisma: PrismaClient
}

//If prisma is already defined, use it, otherwise create a new instance
export const prisma = globalForPrisma.prisma || prismaClientSingleton();

//This is only for Development where Hot Reloading causes the prisma client to be recreated 
//In production, it will not be recreated
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;