import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import chalk from 'chalk';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

const users = [
    { name: 'Admin User', email: 'admin@vibe.com', password: 'Admin@123', role: 'SUPER_ADMIN' },
    { name: 'Support Team', email: 'support@vibe.com', password: 'Support@123', role: 'CUSTOMER_SUPPORT' },
    { name: 'Vendor User', email: 'vendor@vibe.com', password: 'Vendor@123', role: 'VENDOR' },
    { name: 'Customer User', email: 'customer@vibe.com', password: 'Customer@123', role: 'CUSTOMER' },
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
                        name: user.name, // ✅ Added Name
                        email: user.email,
                        password: hashedPassword,
                        tenantId: 'tenant-001',
                        status: 'PENDING_VERIFICATION', // ✅ New users need email verification
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
