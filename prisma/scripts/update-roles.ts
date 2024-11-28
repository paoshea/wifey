import { PrismaClient } from '@prisma/client';

export enum UserRole {
    USER = 'USER',
    MODERATOR = 'MODERATOR',
    ADMIN = 'ADMIN',
}

const prisma = new PrismaClient();

async function updateRoles() {
    try {
        // Update roles from 'USER' to 'USER'
        await prisma.user.updateMany({
            where: { role: UserRole.USER }, // Use the manually defined enum
            data: { role: UserRole.USER },
        });

        // Update roles from 'MODERATOR' to 'MODERATOR'
        await prisma.user.updateMany({
            where: { role: UserRole.MODERATOR }, // Use the manually defined enum
            data: { role: UserRole.MODERATOR },
        });

        // Update roles from 'ADMIN' to 'ADMIN'
        await prisma.user.updateMany({
            where: { role: UserRole.ADMIN }, // Use the manually defined enum
            data: { role: UserRole.ADMIN },
        });

        console.log('Roles updated successfully');
    } catch (error) {
        console.error('Error updating roles:', error);
    } finally {
        await prisma.$disconnect();
    }
}

updateRoles();
