import rateLimit, { ipKeyGenerator } from "express-rate-limit";
import Redis from "ioredis";
import { RedisStore } from "rate-limit-redis";

let store: any = undefined;

if (process.env.REDIS_URL) {
    try {
        const redisClient = new Redis(process.env.REDIS_URL);
        redisClient.on("error", (err) => {
            console.error("Redis error in rate limiter:", err);
        });

        store = new RedisStore({
            sendCommand: (...args: string[]) => redisClient.call(args[0], ...args.slice(1)) as Promise<any>,
        });
        console.log("Rate limiter initialized with Redis store.");
    } catch (error) {
        console.error("Failed to initialize Redis rate limit store, falling back to memory:", error);
    }
}

const keyGenerator = (req: any): string => {
    return req.userId ?? ipKeyGenerator(req);
};

const makeLimiter = (options: { windowMs: number; max: number; message: any }) => {
    return rateLimit({
        ...options,
        standardHeaders: true,
        legacyHeaders: false,
        store,
        keyGenerator,
    });
};

export const loginLimiter = makeLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5,
    message: {
        success: false,
        message: "Too many login attempts. Please try again later."
    }
});

export const registerLimiter = makeLimiter({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3,
    message: {
        success: false,
        message: "Too many registration attempts."
    }
});

export const readLimiter = makeLimiter({
    windowMs: 60 * 1000, // 1 minute
    max: 100,
    message: {
        success: false,
        message: "Too many requests. Please try again later."
    }
});

export const writeLimiter = makeLimiter({
    windowMs: 60 * 1000, // 1 minute
    max: 20,
    message: {
        success: false,
        message: "Too many requests. Please try again later."
    }
});

export const generateQuizLimiter = makeLimiter({
    windowMs: 60 * 1000, // 1 minute
    max: 3,
    message: {
        success: false,
        message: "Too many generate quiz attempts."
    }
});

export const appLimiter = makeLimiter({
    windowMs: 60 * 1000, // 1 minute
    max: 100,
    message: {
        success: false,
        message: "Too many requests. Please try again later."
    }
});