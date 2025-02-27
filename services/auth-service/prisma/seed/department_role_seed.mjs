import { PrismaClient } from '@prisma/client';
import chalk from 'chalk';

const prisma = new PrismaClient();

const departmentRoles = [
    { department: 'Engineering', role: 'ADMIN' },
    { department: 'Sales', role: 'VENDOR' },
    { department: 'Support', role: 'CUSTOMER_SUPPORT' },
];

async function seedDepartmentRoles() {
    console.log(chalk.blue('🏢 Seeding department roles...'));

    try {
        const tenant = await prisma.tenant.findUnique({ where: { name: 'Vibe Corp' } });

        if (!tenant) {
            console.error(chalk.red('❌ Error: Tenant "Vibe Corp" not found. Department roles cannot be seeded.'));
            return;
        }

        for (const dr of departmentRoles) {
            const department = await prisma.department.findUnique({ where: { name: dr.department } });
            const role = await prisma.role.findUnique({ where: { name: dr.role } });

            if (!department || !role) {
                console.log(chalk.yellow(`⚠️ Skipping: Department ${dr.department} or Role ${dr.role} not found.`));
                continue;
            }

            const existing = await prisma.departmentRole.findFirst({
                where: { departmentId: department.id, roleId: role.id },
            });

            if (!existing) {
                await prisma.departmentRole.create({
                    data: { departmentId: department.id, roleId: role.id },
                });
                console.log(chalk.green(`✅ Assigned Role ${dr.role} to Department ${dr.department}`));
            } else {
                console.log(chalk.yellow(`⚠️ Department ${dr.department} already has ${dr.role}, skipping...`));
            }
        }
    } catch (error) {
        console.error(chalk.red('❌ Error seeding department roles:', error.message));
    }
}

export default seedDepartmentRoles;
