// backend/populate-future-years.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const infiniteCalendar = require('./services/infiniteCalendar');

async function populateFutureYears() {
  console.log('🌍 Populating future years 2029-2035...');
  
  for (let year = 2029; year <= 2035; year++) {
    console.log(`\n📅 Processing year ${year}...`);
    let totalDays = 0;
    
    for (let month = 0; month < 12; month++) {
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      
      for (let day = 1; day <= daysInMonth; day++) {
        const targetDate = new Date(year, month, day);
        
        // Check if already exists
        const exists = await prisma.liturgicalDay.findFirst({
          where: {
            date: {
              gte: new Date(year, month, day, 0, 0, 0),
              lte: new Date(year, month, day, 23, 59, 59, 999)
            }
          }
        });
        
        if (!exists) {
          const sourceReadings = await infiniteCalendar.getReadingsForAnyDate(targetDate, prisma);
          
          if (sourceReadings) {
            await prisma.liturgicalDay.create({
              data: {
                date: targetDate,
                season: sourceReadings.season,
                seasonName: sourceReadings.seasonName,
                celebration: sourceReadings.celebration,
                celebrationType: sourceReadings.celebrationType,
                liturgicalColor: sourceReadings.liturgicalColor,
                rank: sourceReadings.rank,
                yearCycle: sourceReadings.yearCycle,
                weekdayCycle: year % 2 === 0 ? 'II' : 'I',
                weekNumber: sourceReadings.weekNumber,
                holyDayOfObligation: sourceReadings.holyDayOfObligation,
                readings: sourceReadings.readings
              }
            });
            totalDays++;
            process.stdout.write('.');
          }
        }
      }
    }
    console.log(` ✅ Year ${year} complete! (${totalDays} days added)`);
  }
  
  console.log('\n🎉 All future years populated successfully!');
}

populateFutureYears()
  .catch(console.error)
  .finally(() => prisma.$disconnect());