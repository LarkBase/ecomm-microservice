import 'dotenv/config'
import { PrismaClient } from '@prisma/client';
import chalk from 'chalk';

const prisma = new PrismaClient();

async function seedTenants() {
    console.log(chalk.blue('🌍 Seeding tenants...'));

    try {
        const existingTenant = await prisma.tenant.findUnique({
            where: { name: 'Vibe Corp' }
        });

        if (!existingTenant) {
            await prisma.tenant.create({
                data: {
                    id: 'tenant-001',
                    name: 'Vibe Corp',
                    description: 'Enterprise eCommerce Platform',
                    createdBy: 'system',
                },
            });
            console.log(chalk.green('✅ Tenant created: Vibe Corp'));
        } else {
            console.log(chalk.yellow('⚠️ Tenant already exists, skipping...'));
        }
    } catch (error) {
        console.error(chalk.red('❌ Error seeding tenants:', error));
    }
}

export default seedTenants;
