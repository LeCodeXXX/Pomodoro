import { prisma } from "../lib/prisma";

export const getTimerSettings = async (userId: string) => {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
            relaxedWorkTime: true,
            relaxedBreakTime: true,
            standardWorkTime: true,
            standardBreakTime: true,
            focusedWorkTime: true,
            focusedBreakTime: true,
        }
    });

    if (!user) {
        throw new Error("User not found");
    }

    return user;
};

export const updateTimerSettings = async (
    userId: string,
    settings: {
        relaxedWorkTime: number;
        relaxedBreakTime: number;
        standardWorkTime: number;
        standardBreakTime: number;
        focusedWorkTime: number;
        focusedBreakTime: number;
    }
) => {
    const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: settings,
        select: {
            relaxedWorkTime: true,
            relaxedBreakTime: true,
            standardWorkTime: true,
            standardBreakTime: true,
            focusedWorkTime: true,
            focusedBreakTime: true,
        }
    });

    return updatedUser;
};
