import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import chalk from "chalk";

const prisma = new PrismaClient();

const users = [
  { name: "Admin User", email: "admin@vibe.com", password: "Admin@123", role: "SUPER_ADMIN" },
  { name: "Support Team", email: "support@vibe.com", password: "Support@123", role: "CUSTOMER_SUPPORT" },
  { name: "Vendor User", email: "vendor@vibe.com", password: "Vendor@123", role: "VENDOR" },
  { name: "Customer User", email: "customer@vibe.com", password: "Customer@123", role: "CUSTOMER" },
];

async function seedUsers() {
  console.log(chalk.blue("👥 Seeding users..."));

  try {
    for (const user of users) {
      const existingUser = await prisma.user.findUnique({ where: { email: user.email } });

      if (!existingUser) {
        // ✅ Hash Password
        const hashedPassword = await bcrypt.hash(user.password, 10);

        // ✅ Create User
        const createdUser = await prisma.user.create({
          data: {
            name: user.name,
            email: user.email,
            password: hashedPassword,
            tenantId: "tenant-001",
            status: "ACTIVE", // ✅ User is ACTIVE immediately
            emailVerified: true, // ✅ Mark email as verified
          },
        });

        // ✅ Assign Role
        const role = await prisma.role.findUnique({ where: { name: user.role } });

        if (role) {
          // Check if user already has this role to prevent duplicates
          const existingUserRole = await prisma.userRole.findFirst({
            where: { userId: createdUser.id, roleId: role.id },
          });

          if (!existingUserRole) {
            await prisma.userRole.create({
              data: {
                userId: createdUser.id,
                roleId: role.id,
              },
            });
            console.log(chalk.green(`✅ User created & assigned role: ${user.email} -> ${user.role}`));
          } else {
            console.log(chalk.yellow(`⚠️ Role already assigned: ${user.email} -> ${user.role}, skipping...`));
          }
        } else {
          console.log(chalk.red(`❌ Role not found: ${user.role}. Please check role seeding.`));
        }
      } else {
        console.log(chalk.yellow(`⚠️ User exists: ${user.email}, skipping...`));
      }
    }

    console.log(chalk.green("✅ User seeding complete!"));
  } catch (error) {
    console.error(chalk.red("❌ Error seeding users:", error.message));
  } finally {
    await prisma.$disconnect();
  }
}

// ✅ Run Seeding
seedUsers();

export default seedUsers;