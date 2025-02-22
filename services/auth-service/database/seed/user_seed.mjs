import 'dotenv/config'
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import chalk from 'chalk';

const prisma = new PrismaClient();

const users = [
    { email: 'admin@vibe.com', password: 'Admin@123', role: 'SUPER_ADMIN' },
    { email: 'support@vibe.com', password: 'Support@123', role: 'CUSTOMER_SUPPORT' },
    { email: 'vendor@vibe.com', password: 'Vendor@123', role: 'VENDOR' },
    { email: 'customer@vibe.com', password: 'Customer@123', role: 'CUSTOMER' },
];

async function seedUsers() {
    console.log(chalk.blue('👥 Seeding users...'));

    try {
        for (const user of users) {
            const existingUser = await prisma.user.findUnique({
                where: { email: user.email },
            });

            if (!existingUser) {
                const hashedPassword = await bcrypt.hash(user.password, 10);
                const createdUser = await prisma.user.create({
                    data: {
                        email: user.email,
                        password: hashedPassword,
                        tenantId: 'tenant-001',
                    },
                });

                const role = await prisma.role.findUnique({ where: { name: user.role } });
                if (role) {
                    await prisma.userRole.create({
                        data: {
                            userId: createdUser.id,
                            roleId: role.id,
                        },
                    });
                    console.log(chalk.green(`✅ User created & assigned role: ${user.email} -> ${user.role}`));
                }
            } else {
                console.log(chalk.yellow(`⚠️ User exists: ${user.email}, skipping...`));
            }
        }
    } catch (error) {
        console.error(chalk.red('❌ Error seeding users:', error));
    }
}

export default seedUsers;
