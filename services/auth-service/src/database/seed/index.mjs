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
    console.log(chalk.blue("🚀 Starting database seeding..."));
  
    try {
      await seedTenants();
      console.log(chalk.green("✅ Tenants seeded!"));
  
      await seedRoles(); // ✅ Roles before users
      console.log(chalk.green("✅ Roles seeded!"));
  
      await seedPermissions(); // ✅ Permissions before assigning
      console.log(chalk.green("✅ Permissions seeded!"));
  
      await seedDepartments();
      console.log(chalk.green("✅ Departments seeded!"));
  
      await seedDepartmentRoles();
      console.log(chalk.green("✅ Department roles seeded!"));
  
      await seedUsers(); // ✅ Users AFTER roles exist
      console.log(chalk.green("✅ Users seeded!"));
  
      await seedRolePermissions(); // ✅ Assign permissions to roles
      console.log(chalk.green("✅ Role-Permission mappings seeded!"));
  
      await seedUserPermissions(); // ✅ Assign permissions to users
      console.log(chalk.green("✅ User-Permission mappings seeded!"));
  
      await seedSessions();
      console.log(chalk.green("✅ Sessions seeded!"));
  
      console.log(chalk.green("🎉 Database seeding completed successfully!"));
    } catch (error) {
      console.error(chalk.red("❌ Seeding failed:", error.message));
    } finally {
      await prisma.$disconnect();
    }
  }
  
  main();
  
