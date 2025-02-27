import { PrismaClient } from '@prisma/client';
import chalk from 'chalk';

const prisma = new PrismaClient();

const roles = [
    { name: 'SUPER_ADMIN', description: 'Full system control' },
    { name: 'ADMIN', description: 'Manage users, roles, and reports' },
    { name: 'VENDOR', description: 'Manage products and sales' },
    { name: 'CUSTOMER_SUPPORT', description: 'Handle customer inquiries' },
    { name: 'CUSTOMER', description: 'Regular buyer' },
];

async function seedRoles() {
    console.log(chalk.blue('👤 Seeding roles...'));

    try {
        const tenant = await prisma.tenant.findUnique({ where: { name: 'Vibe Corp' } });

        if (!tenant) {
            console.error(chalk.red('❌ Error: Tenant "Vibe Corp" not found. Roles cannot be seeded.'));
            return;
        }

        for (const role of roles) {
            const existingRole = await prisma.role.findUnique({
                where: { name: role.name },
            });

            if (!existingRole) {
                await prisma.role.create({
                    data: {
                        ...role,
                        tenantId: tenant.id, // ✅ Assign tenantId
                    },
                });
                console.log(chalk.green(`✅ Role created: ${role.name}`));
            } else {
                console.log(chalk.yellow(`⚠️ Role exists: ${role.name}, skipping...`));
            }
        }
    } catch (error) {
        console.error(chalk.red('❌ Error seeding roles:', error.message));
    }
}

export default seedRoles;
