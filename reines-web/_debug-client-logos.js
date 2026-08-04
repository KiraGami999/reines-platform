require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

(async () => {
  try {
    const settings = await prisma.clientLogoSetting.findUnique({ where: { id: 'global' } });
    const logos = await prisma.clientLogo.findMany({ orderBy: [{ sortOrder: 'asc' }] });
    console.log('SETTINGS:', JSON.stringify(settings));
    console.log('LOGOS COUNT:', logos.length);
    console.log('LOGOS:', JSON.stringify(logos, null, 2));
  } catch (e) {
    console.error('ERROR:', e);
  } finally {
    await prisma.$disconnect();
  }
})();
