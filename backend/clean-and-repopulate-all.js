// backend/clean-and-repopulate-all.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const calendarService = require('./services/calendarService');

async function cleanAndRepopulateAll() {
  console.log('🧹 CLEANING AND REPOPULATING ALL YEARS (2024-2028)');
  console.log('================================================\n');

  const years = [2024, 2025, 2026, 2027, 2028];
  const results = {};

  for (const year of years) {
    console.log(`\n📅 Processing Year ${year}...`);
    results[year] = { deleted: 0, populated: 0 };

    for (let month = 0; month < 12; month++) {
      const monthNum = month + 1;
      const monthName = new Date(year, month, 1).toLocaleString('default', { month: 'long' });
      
      console.log(`  📆 ${monthName} ${year}...`);
      
      // DELETE existing data
      const startDate = new Date(year, month, 1);
      const endDate = new Date(year, month + 1, 0);
      
      const deleted = await prisma.liturgicalDay.deleteMany({
        where: {
          date: {
            gte: startDate,
            lte: endDate
          }
        }
      });
      
      results[year].deleted += deleted.count;
      console.log(`     🗑️ Deleted ${deleted.count} days`);

      // REPOPULATE with new service
      const days = await calendarService.getLiturgicalMonth(year, month);
      results[year].populated += days.length;
      console.log(`     ✅ Repopulated ${days.length} days`);
      
      // Small delay to be nice to USCCB
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  // Print summary
  console.log('\n🎉 ========== COMPLETE ==========');
  console.log('\n📊 SUMMARY:');
  console.log('=================================');
  
  let totalDeleted = 0;
  let totalPopulated = 0;
  
  for (const year of years) {
    console.log(`\n📅 ${year}:`);
    console.log(`   🗑️ Deleted: ${results[year].deleted} days`);
    console.log(`   ✅ Populated: ${results[year].populated} days`);
    totalDeleted += results[year].deleted;
    totalPopulated += results[year].populated;
  }
  
  console.log('\n=================================');
  console.log(`📊 TOTAL: ${totalDeleted} days deleted, ${totalPopulated} days repopulated`);
  console.log('=================================');
  console.log('\n✅ All years cleaned and repopulated successfully!');
}

cleanAndRepopulateAll()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });