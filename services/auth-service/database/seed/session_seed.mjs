import { PrismaClient } from '@prisma/client';
import chalk from 'chalk';

const prisma = new PrismaClient();

async function seedSessions() {
    console.log(chalk.blue('🛠️ Seeding sessions...'));

    try {
        const user = await prisma.user.findUnique({ where: { email: 'admin@vibe.com' } });

        if (user) {
            await prisma.session.create({
                data: {
                    userId: user.id,
                    token: 'dummy-session-token',
                    expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
                },
            });
            console.log(chalk.green('✅ Session created for admin@vibe.com'));
        } else {
            console.log(chalk.yellow('⚠️ No admin found, skipping session creation.'));
        }
    } catch (error) {
        console.error(chalk.red('❌ Error seeding sessions:', error.message));
    }
}

export default seedSessions;
