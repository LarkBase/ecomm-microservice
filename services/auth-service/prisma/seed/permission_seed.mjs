import { PrismaClient } from '@prisma/client';
import chalk from 'chalk';

const prisma = new PrismaClient();

const permissions = [
    { name: 'MANAGE_USERS', description: 'Manage user accounts', module: 'USER_MANAGEMENT' },
    { name: 'MANAGE_ORDERS', description: 'Manage customer orders', module: 'ORDER_MANAGEMENT' },
    { name: 'MANAGE_PRODUCTS', description: 'Manage product catalog', module: 'PRODUCT_MANAGEMENT' },
    { name: 'VIEW_DASHBOARD', description: 'Access analytics dashboard', module: 'REPORTING' },
    { name: 'MANAGE_PAYMENTS', description: 'Handle transactions & refunds', module: 'PAYMENTS' },
];

async function seedPermissions() {
    console.log(chalk.blue('🔐 Seeding permissions...'));

    try {
        for (const perm of permissions) {
            const existingPermission = await prisma.permission.findUnique({
                where: { name: perm.name },
            });

            if (!existingPermission) {
                await prisma.permission.create({ data: perm });
                console.log(chalk.green(`✅ Permission created: ${perm.name}`));
            } else {
                console.log(chalk.yellow(`⚠️ Permission exists: ${perm.name}, skipping...`));
            }
        }
    } catch (error) {
        console.error(chalk.red('❌ Error seeding permissions:', error.message));
    }
}

export default seedPermissions;
