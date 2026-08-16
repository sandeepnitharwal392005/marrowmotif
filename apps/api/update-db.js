const { PrismaClient } = require('@prisma/client'); 
const prisma = new PrismaClient(); 
async function run() { 
  const users = await prisma.user.findMany(); 
  for (let user of users) { 
    if (user.email.includes('morrowotif.com') || user.email.includes('morrowotif.internal')) { 
      await prisma.user.update({ 
        where: { id: user.id }, 
        data: { email: user.email.replace('morrowotif', 'marrowotif') }
      }); 
    } 
  } 
  console.log('DB Updated'); 
} 
run().finally(() => prisma.$disconnect());
