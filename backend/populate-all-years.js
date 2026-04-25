// backend/populate-all-years.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const calendarService = require('./services/calendarService');

async function populateAllYears() {
  console.log('🚀 ========================================');
  console.log('🚀 POPULATING ALL LITURGICAL YEARS');
  console.log('🚀 ========================================\n');

  const years = [2024, 2025, 2026, 2027, 2028];
  const results = {};

  for (const year of years) {
    console.log(`\n📅 ========== PROCESSING YEAR ${year} ==========`);
    console.log(`📅 Cycle: Sunday Year ${getSundayCycle(year)} | Weekday Cycle ${getWeekdayCycle(year)}\n`);
    
    results[year] = {
      total: 0,
      success: 0,
      failed: 0,
      months: {}
    };

    for (let month = 0; month < 12; month++) {
      const monthName = new Date(year, month, 1).toLocaleString('default', { month: 'long' });
      console.log(`\n📆 Processing ${monthName} ${year}...`);
      
      try {
        // Check if month already exists
        const startDate = new Date(year, month, 1);
        const endDate = new Date(year, month + 1, 0);
        
        const existingDays = await prisma.liturgicalDay.count({
          where: {
            date: {
              gte: startDate,
              lte: endDate
            }
          }
        });

        if (existingDays > 0) {
          console.log(`   ⚠️  ${monthName} already has ${existingDays} days. Skipping...`);
          results[year].months[monthName] = { status: 'skipped', count: existingDays };
          continue;
        }

        // Populate the month
        console.log(`   📥 Populating ${monthName}...`);
        const days = await calendarService.getLiturgicalMonth(year, month);
        
        results[year].total += days.length;
        results[year].success += days.length;
        results[year].months[monthName] = { 
          status: 'success', 
          count: days.length 
        };
        
        console.log(`   ✅ Added ${days.length} days for ${monthName}`);
        
        // Add delay to be respectful to USCCB
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        console.error(`   ❌ Failed to populate ${monthName}:`, error.message);
        results[year].failed++;
        results[year].months[monthName] = { status: 'failed', error: error.message };
      }
    }
    
    console.log(`\n📊 Year ${year} complete: ${results[year].success} days added`);
  }

  // Print summary
  console.log('\n🎉 ========== POPULATION COMPLETE ==========');
  console.log('\n📊 SUMMARY:');
  console.log('=====================================');
  
  let totalDays = 0;
  for (const year of years) {
    const yearResults = results[year];
    const yearCycle = `Year ${getSundayCycle(year)} (Sundays) / Year ${getWeekdayCycle(year)} (Weekdays)`;
    console.log(`\n📅 ${year} (${yearCycle}):`);
    console.log(`   ✅ Success: ${yearResults.success} days`);
    if (yearResults.failed > 0) console.log(`   ❌ Failed: ${yearResults.failed} months`);
    
    // Show month breakdown
    for (const [month, data] of Object.entries(yearResults.months)) {
      const emoji = data.status === 'success' ? '✅' : data.status === 'skipped' ? '⚠️' : '❌';
      console.log(`   ${emoji} ${month}: ${data.count || 0} days`);
    }
    
    totalDays += yearResults.success;
  }
  
  console.log('\n=====================================');
  console.log(`📆 TOTAL DAYS IN DATABASE: ${totalDays}`);
  console.log('=====================================');
  console.log('\n✅ All years populated successfully!');
}

function getSundayCycle(year) {
  const cycles = {
    2024: 'B', 2025: 'C', 2026: 'A',
    2027: 'B', 2028: 'C', 2029: 'A',
    2030: 'B'
  };
  return cycles[year] || 'A';
}

function getWeekdayCycle(year) {
  return year % 2 === 0 ? 'II' : 'I';
}

// Run the population
populateAllYears()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });