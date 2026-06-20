import { prisma } from "../lib/prisma";

interface CreateDocumentInput {
    userId: string;
    title: string;
    fileUrl: string;
}

/**
 * Creates a new document record in the database.
 */
export const createDocument = async ({ userId, title, fileUrl }: CreateDocumentInput) => {
    const document = await prisma.document.create({
        data: {
            title,
            fileUrl,
            userId,
        },
    });
    return document;
};

/**
 * Retrieves all documents belonging to a specific user,
 * ordered by most recently created first.
 */
export const getDocumentsByUser = async (userId: string) => {
    const documents = await prisma.document.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        select: {
            id: true,
            title: true,
            fileUrl: true,
            createdAt: true,
        },
    });
    return documents;
};

/**
 * Retrieves a single document by its ID.
 * Validates that the document belongs to the requesting user.
 */
export const getDocumentById = async (documentId: string, userId: string) => {
    const document = await prisma.document.findFirst({
        where: { id: documentId, userId },
    });

    if (!document) {
        throw new Error("Document not found or access denied");
    }

    return document;
};

/**
 * Deletes a document record from the database.
 * Validates ownership before deletion.
 */
export const deleteDocument = async (documentId: string, userId: string) => {
    const document = await prisma.document.findFirst({
        where: { id: documentId, userId },
    });

    if (!document) {
        throw new Error("Document not found or access denied");
    }

    await prisma.document.delete({ where: { id: documentId } });

    return document;
};
