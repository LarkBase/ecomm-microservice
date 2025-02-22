import { PrismaClient } from '@prisma/client';
import chalk from 'chalk';

const prisma = new PrismaClient();

const rolePermissions = [
    { role: 'SUPER_ADMIN', permission: 'MANAGE_USERS' },
    { role: 'SUPER_ADMIN', permission: 'MANAGE_ORDERS' },
    { role: 'ADMIN', permission: 'VIEW_DASHBOARD' },
    { role: 'VENDOR', permission: 'MANAGE_PRODUCTS' },
];

async function seedRolePermissions() {
    console.log(chalk.blue('🛡️ Seeding role permissions...'));

    try {
        for (const rp of rolePermissions) {
            const role = await prisma.role.findUnique({ where: { name: rp.role } });
            const permission = await prisma.permission.findUnique({ where: { name: rp.permission } });

            if (!role || !permission) {
                console.log(chalk.yellow(`⚠️ Skipping: Role ${rp.role} or Permission ${rp.permission} not found.`));
                continue;
            }

            const existing = await prisma.rolePermission.findFirst({
                where: { roleId: role.id, permissionId: permission.id },
            });

            if (!existing) {
                await prisma.rolePermission.create({
                    data: { roleId: role.id, permissionId: permission.id },
                });
                console.log(chalk.green(`✅ Assigned Permission ${rp.permission} to Role ${rp.role}`));
            } else {
                console.log(chalk.yellow(`⚠️ Role ${rp.role} already has ${rp.permission}, skipping...`));
            }
        }
    } catch (error) {
        console.error(chalk.red('❌ Error seeding role permissions:', error.message));
    }
}

export default seedRolePermissions;
