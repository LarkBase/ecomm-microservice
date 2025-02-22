import { PrismaClient } from '@prisma/client';
import chalk from 'chalk';

const prisma = new PrismaClient();

const userPermissions = [
    { userEmail: 'admin@vibe.com', permission: 'MANAGE_USERS' },
    { userEmail: 'support@vibe.com', permission: 'MANAGE_ORDERS' },
    { userEmail: 'vendor@vibe.com', permission: 'MANAGE_PRODUCTS' },
    { userEmail: 'customer@vibe.com', permission: 'VIEW_DASHBOARD' },
];

async function seedUserPermissions() {
    console.log(chalk.blue('🔑 Seeding user permissions...'));

    try {
        for (const up of userPermissions) {
            const user = await prisma.user.findUnique({ where: { email: up.userEmail } });
            const permission = await prisma.permission.findUnique({ where: { name: up.permission } });

            if (!user || !permission) {
                console.log(chalk.yellow(`⚠️ Skipping: User ${up.userEmail} or Permission ${up.permission} not found.`));
                continue;
            }

            const existing = await prisma.userPermission.findFirst({
                where: { userId: user.id, permissionId: permission.id },
            });

            if (!existing) {
                await prisma.userPermission.create({
                    data: { userId: user.id, permissionId: permission.id },
                });
                console.log(chalk.green(`✅ Assigned Permission ${up.permission} to User ${up.userEmail}`));
            } else {
                console.log(chalk.yellow(`⚠️ User ${up.userEmail} already has ${up.permission}, skipping...`));
            }
        }
    } catch (error) {
        console.error(chalk.red('❌ Error seeding user permissions:', error.message));
    }
}

export default seedUserPermissions;
