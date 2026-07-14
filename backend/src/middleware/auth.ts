import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";

if (!JWT_SECRET) {
    throw new Error("Please provide a JWT_SECRET in the .env file");
}

export interface JwtPayload {
    userId: string;
    email: string;
}

/**
 * Signs a JWT token for the given user payload.
 */
export const signToken = (payload: JwtPayload): string => {
    return jwt.sign(payload, JWT_SECRET as string, {
        expiresIn: JWT_EXPIRES_IN as jwt.SignOptions["expiresIn"],
    });
};

/**
 * Verifies and decodes a JWT token.
 * Throws a JsonWebTokenError if invalid or expired.
 */
export const verifyToken = (token: string): JwtPayload => {
    return jwt.verify(token, JWT_SECRET as string) as JwtPayload;
};
