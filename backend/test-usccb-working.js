// backend/test-usccb-working.js
const usccbService = require('./services/usccbService');

async function test() {
  console.log('🧪 Testing USCCB Service\n');
  
  const testDates = [
    new Date(2024, 2, 17), // March 17
    new Date(2024, 2, 19), // March 19 (St. Joseph)
    new Date(2024, 2, 25), // March 25 (Annunciation)
  ];
  
  for (const date of testDates) {
    console.log(`\n📅 Testing ${date.toDateString()}`);
    const readings = await usccbService.getReadingsForDate(date);
    console.log('Readings:', JSON.stringify(readings, null, 2));
  }
}

test();