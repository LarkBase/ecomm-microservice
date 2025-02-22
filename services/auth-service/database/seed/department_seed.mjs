import { PrismaClient } from '@prisma/client';
import chalk from 'chalk';

const prisma = new PrismaClient();

const departments = [
    { name: 'Engineering', description: 'Software Development & DevOps' },
    { name: 'Sales', description: 'Handles customer acquisition' },
    { name: 'Support', description: 'Customer Support Team' },
    { name: 'HR', description: 'Human Resources' },
    { name: 'Finance', description: 'Finance & Accounting' },
];

async function seedDepartments() {
    console.log(chalk.blue('🏢 Seeding departments...'));

    try {
        const tenant = await prisma.tenant.findUnique({ where: { name: 'Vibe Corp' } });

        if (!tenant) {
            console.error(chalk.red('❌ Error: Tenant "Vibe Corp" not found. Departments cannot be seeded.'));
            return;
        }

        for (const dept of departments) {
            const existingDept = await prisma.department.findUnique({
                where: { name: dept.name },
            });

            if (!existingDept) {
                await prisma.department.create({
                    data: {
                        ...dept,
                        tenantId: tenant.id, // ✅ Assign tenantId
                    },
                });
                console.log(chalk.green(`✅ Department created: ${dept.name}`));
            } else {
                console.log(chalk.yellow(`⚠️ Department exists: ${dept.name}, skipping...`));
            }
        }
    } catch (error) {
        console.error(chalk.red('❌ Error seeding departments:', error.message));
    }
}

export default seedDepartments;
