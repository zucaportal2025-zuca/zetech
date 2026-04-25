// backend/test-usccb-fixed.js
const usccbService = require('./services/usccbService');

async function test() {
  console.log('🧪 Testing Updated USCCB Service\n');
  
  const testDates = [
    new Date(2024, 2, 17), // March 17, 2024
    new Date(2024, 2, 19), // March 19, 2024 (St. Joseph)
    new Date(2024, 2, 25), // March 25, 2024 (Annunciation)
    new Date() // Today
  ];
  
  for (const date of testDates) {
    console.log(`\n🔍 Testing ${date.toDateString()}...`);
    const readings = await usccbService.getSimplifiedReadings(date);
    console.log('Result:', JSON.stringify(readings, null, 2));
  }
}

test();