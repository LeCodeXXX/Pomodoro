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

export const getUserStats = async (userId: string) => {
    const [pomodoroSessions, documentsCount, quizAttempts] = await Promise.all([
        prisma.pomodoroSession.findMany({ where: { userId } }),
        prisma.document.count({ where: { userId } }),
        prisma.quizAttempt.findMany({ where: { userId } }),
    ]);

    const completedSessions = pomodoroSessions.filter(s => s.completed);

    // Total focus time: only from completed focus sessions
    const totalFocusTime = completedSessions.reduce((acc, curr) => acc + curr.duration, 0);

    // Total break time: sum of breakDuration on completed sessions
    const totalBreakTime = completedSessions.reduce((acc, curr) => acc + curr.breakDuration, 0);

    const totalPomodoroSessions = completedSessions.length;

    // Current streak: consecutive calendar days (local time) with >= 1 completed session
    const sessionDays = new Set<string>(
        completedSessions.map(s => {
            const d = new Date(s.createdAt);
            return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
        })
    );

    let currentStreak = 0;
    const today = new Date();
    for (let i = 0; i < 365; i++) {
        const check = new Date(today.getFullYear(), today.getMonth(), today.getDate() - i);
        const key = `${check.getFullYear()}-${check.getMonth()}-${check.getDate()}`;
        if (sessionDays.has(key)) {
            currentStreak++;
        } else {
            break;
        }
    }

    const totalQuizzesTaken = quizAttempts.length;
    const averageQuizScore = totalQuizzesTaken > 0
        ? Math.round(quizAttempts.reduce((acc, curr) => acc + (curr.score / curr.totalQuestions), 0) / totalQuizzesTaken * 100)
        : 0;

    return {
        totalPomodoroSessions,
        totalFocusTime,
        totalBreakTime,
        currentStreak,
        documentsCount,
        totalQuizzesTaken,
        averageQuizScore
    };
};

export const recordPomodoroSession = async (
    userId: string,
    duration: number,
    completed: boolean,
    breakDuration: number = 0
) => {
    const session = await prisma.pomodoroSession.create({
        data: {
            duration,
            breakDuration,
            completed,
            userId
        }
    });
    return session;
};

type ChartFilter = 'daily' | 'weekly' | 'monthly';

export const getChartData = async (userId: string, filter: ChartFilter) => {
    const now = new Date();
    let startDate: Date;

    if (filter === 'daily') {
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
    } else if (filter === 'weekly') {
        const day = now.getDay(); // 0=Sun, 1=Mon...
        const diff = (day === 0 ? -6 : 1 - day); // offset to Monday
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + diff, 0, 0, 0);
    } else {
        startDate = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
    }

    const sessions = await prisma.pomodoroSession.findMany({
        where: {
            userId,
            completed: true,
            createdAt: { gte: startDate },
        },
        orderBy: { createdAt: 'asc' },
    });

    // ---- Weekly Productivity (always Mon-Sun buckets for the selected period) ----
    const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const weeklyMap: Record<string, { focusTime: number; sessions: number }> = {};
    DAYS.forEach(d => { weeklyMap[d] = { focusTime: 0, sessions: 0 }; });

    sessions.forEach(s => {
        const jsDay = new Date(s.createdAt).getDay(); // 0=Sun
        const dayIdx = jsDay === 0 ? 6 : jsDay - 1;   // remap to Mon=0
        const key = DAYS[dayIdx];
        weeklyMap[key].focusTime += s.duration;
        weeklyMap[key].sessions += 1;
    });

    const weeklyProductivity = DAYS.map(d => ({ day: d, ...weeklyMap[d] }));

    // ---- Study Time Trend ----
    let studyTimeTrend: { label: string; focusTime: number }[] = [];

    if (filter === 'daily') {
        const hourMap: Record<number, number> = {};
        for (let h = 0; h < 24; h++) hourMap[h] = 0;
        sessions.forEach(s => {
            const h = new Date(s.createdAt).getHours();
            hourMap[h] += s.duration;
        });
        studyTimeTrend = Object.entries(hourMap).map(([h, t]) => ({
            label: `${h.toString().padStart(2, '0')}:00`,
            focusTime: t,
        }));
    } else if (filter === 'weekly') {
        const dayMap: Record<string, number> = {};
        DAYS.forEach(d => { dayMap[d] = 0; });
        sessions.forEach(s => {
            const jsDay = new Date(s.createdAt).getDay();
            const dayIdx = jsDay === 0 ? 6 : jsDay - 1;
            dayMap[DAYS[dayIdx]] += s.duration;
        });
        studyTimeTrend = DAYS.map(d => ({ label: d, focusTime: dayMap[d] }));
    } else {
        // Monthly: bucket into weeks of the month
        const weekMap: Record<string, number> = {};
        for (let w = 1; w <= 5; w++) weekMap[`Week ${w}`] = 0;
        sessions.forEach(s => {
            const dayOfMonth = new Date(s.createdAt).getDate();
            const weekNum = Math.ceil(dayOfMonth / 7);
            weekMap[`Week ${weekNum}`] += s.duration;
        });
        studyTimeTrend = Object.entries(weekMap).map(([label, focusTime]) => ({ label, focusTime }));
    }

    return { weeklyProductivity, studyTimeTrend };
};
