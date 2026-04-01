// prisma/seed.js
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // 1. Seed Pricing Plans
  const plans = [
    {
      name: 'free',
      displayName: 'Free Tier',
      price: 0,
      interval: 'MONTHLY',
      features: { api_calls: 100, seats: 1 },
    },
    {
      name: 'pro',
      displayName: 'Pro Plan',
      price: 49900, // ₹499.00 in paise
      interval: 'MONTHLY',
      features: { api_calls: 10000, seats: 5 },
    },
    {
      name: 'enterprise',
      displayName: 'Enterprise Tier',
      price: 199900, // ₹1,999.00 in paise
      interval: 'MONTHLY',
      features: { api_calls: 1000000, seats: 50 },
    },
  ];

  for (const plan of plans) {
    await prisma.plan.upsert({
      where: { name: plan.name },
      update: {},
      create: plan,
    });
  }
  console.log('Plans seeded successfully!');

  // 2. Seed Admin User
  const adminEmail = 'admin@paymentsaas.com';
  const passwordHash = await bcrypt.hash('admin123', 12);

  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      passwordHash,
      role: 'ADMIN',
    },
  });
  console.log('Admin user seeded (admin@paymentsaas.com / admin123)');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
