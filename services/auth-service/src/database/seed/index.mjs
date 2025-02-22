import { PrismaClient } from '@prisma/client';
import chalk from 'chalk';

const prisma = new PrismaClient();

import seedTenants from './tenant_seed.mjs';
import seedPermissions from './permission_seed.mjs';
import seedRoles from './role_seed.mjs';
import seedDepartments from './department_seed.mjs';
import seedDepartmentRoles from './department_role_seed.mjs';
import seedUsers from './user_seed.mjs';
import seedUserPermissions from './user_permission_seed.mjs';
import seedRolePermissions from './role_permission_seed.mjs';
import seedSessions from './session_seed.mjs';

async function main() {
    console.log(chalk.blue('🚀 Starting database seeding...'));

    try {
        await seedTenants();
        await seedPermissions();
        await seedRoles();
        await seedDepartments();
        await seedDepartmentRoles();
        await seedUsers();
        await seedUserPermissions();
        await seedRolePermissions();
        await seedSessions();

        console.log(chalk.green('✅ Database seeding completed successfully!'));
    } catch (error) {
        console.error(chalk.red('❌ Seeding failed:', error.message));
    } finally {
        await prisma.$disconnect();
    }
}

main();
