const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const romcal = require('romcal');
const usccbService = require('./usccbService'); // Import the USCCB service

class CalendarService {
  constructor() {
    this.romcal = romcal;
  }

  async generateLiturgicalData(date) {
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    
    try {
      console.log(`🔍 Generating for: ${year}-${month}-${day}`);
      
      // Get calendar for the year
      const calendar = await this.romcal.calendarFor({
        year: year,
        country: 'general',
        locale: 'en'
      });
      
      // Find the specific day by comparing the moment date
      const targetDate = new Date(year, month-1, day);
      targetDate.setHours(0, 0, 0, 0);
      
      const dayData = calendar.find(item => {
        const itemDate = new Date(item.moment);
        itemDate.setHours(0, 0, 0, 0);
        return itemDate.getTime() === targetDate.getTime();
      });
      
      if (!dayData) {
        throw new Error(`No data for ${year}-${month}-${day}`);
      }
      
      console.log('✅ Found data for:', dayData.name);
      
      // Transform the data first
      const transformedData = this.transformData(dayData, date);
      
      // Try to fetch readings from USCCB
      try {
        console.log(`📖 Fetching readings from USCCB for ${year}-${month}-${day}`);
        const readings = await usccbService.getSimplifiedReadings(date);
        if (readings) {
          transformedData.readings = readings; // This will be stored as JSON
          console.log('✅ Readings fetched successfully');
        }
      } catch (readingsError) {
        console.error('⚠️ Failed to fetch readings:', readingsError.message);
        // Continue without readings - they can be fetched later
      }
      
      return transformedData;
      
    } catch (error) {
      console.error('Romcal error:', error);
      throw error;
    }
  }

  transformData(romcalData, date) {
    // Check if there are multiple celebrations
    const celebrations = romcalData.celebrations || [romcalData];
    
    // Find the highest ranking celebration (SOLEMNITY > FEAST > MEMORIAL > COMMEMORATION > FERIA)
    let primaryCelebration = celebrations[0]; // Default to first
    
    // Define rank order
    const rankOrder = {
      'SOLEMNITY': 4,
      'FEAST': 3,
      'MEMORIAL': 2,
      'COMMEMORATION': 1,
      'WEEKDAY': 0
    };
    
    // Find the highest ranked celebration
    for (const celebration of celebrations) {
      if (rankOrder[celebration.type] > rankOrder[primaryCelebration.type]) {
        primaryCelebration = celebration;
      }
    }
    
    const name = primaryCelebration.name || 'Weekday';
    const type = primaryCelebration.type || 'WEEKDAY';
    const season = romcalData.data?.season?.value || 'Ordinary Time';
    const color = primaryCelebration.colour || romcalData.data?.meta?.liturgicalColor?.value || '#008000';
    const cycle = romcalData.data?.meta?.cycle?.value || this.getLiturgicalYear(date);
    
    // Map type to celebration type
    let celebrationType = 'weekday';
    if (type === 'SOLEMNITY') celebrationType = 'solemnity';
    else if (type === 'FEAST') celebrationType = 'feast';
    else if (type === 'MEMORIAL') celebrationType = 'memorial';
    else if (type === 'COMMEMORATION') celebrationType = 'optional memorial';
    
    // Map season to our format
    let seasonKey = 'ordinary';
    let seasonName = 'Ordinary Time';
    let liturgicalColor = 'green';
    
    if (season.toLowerCase().includes('advent')) {
      seasonKey = 'advent';
      seasonName = 'Advent';
      liturgicalColor = 'purple';
    } else if (season.toLowerCase().includes('christmas')) {
      seasonKey = 'christmas';
      seasonName = 'Christmas';
      liturgicalColor = 'white';
    } else if (season.toLowerCase().includes('lent')) {
      seasonKey = 'lent';
      seasonName = 'Lent';
      liturgicalColor = 'purple';
    } else if (season.toLowerCase().includes('easter')) {
      seasonKey = 'easter';
      seasonName = 'Easter';
      liturgicalColor = 'white';
    }
    
    // Override color based on celebration type and actual color from Romcal
    if (celebrationType === 'solemnity') {
      liturgicalColor = 'white';
    } else if (color === '#FFFFFF') {
      liturgicalColor = 'white';
    } else if (color === '#800080') {
      liturgicalColor = 'purple';
    } else if (color === '#FF0000') {
      liturgicalColor = 'red';
    } else if (color === '#008000') {
      liturgicalColor = 'green';
    }
    
    // Format celebration name for special solemnities
    let celebrationName = name;
    if (name.includes('Joseph') && type === 'SOLEMNITY') {
      celebrationName = 'Solemnity of St. Joseph';
    } else if (name.includes('Annunciation')) {
      celebrationName = 'The Annunciation of the Lord';
    } else if (name.includes('Patrick') && type === 'SOLEMNITY') {
      celebrationName = 'St. Patrick';
    }
    
    return {
      date: date,
      season: seasonKey,
      seasonName: seasonName,
      celebration: celebrationName,
      celebrationType: celebrationType,
      liturgicalColor: liturgicalColor,
      rank: type,
      yearCycle: cycle,
      weekdayCycle: this.getWeekdayCycle(date),
      weekNumber: romcalData.data?.calendar?.week || null,
      holyDayOfObligation: this.isHolyDayOfObligation(celebrationName),
      readings: null // Will be filled by USCCB service
    };
  }

  // REMOVED: getReadingsForDate function (now using USCCB service)

  getLiturgicalYear(date) {
    const year = date.getFullYear();
    // Liturgical year cycles (simplified)
    const cycles = {
      2022: 'A', 2023: 'B', 2024: 'C',
      2025: 'A', 2026: 'B', 2027: 'C',
      2028: 'A', 2029: 'B', 2030: 'C'
    };
    return cycles[year] || 'C';
  }

  getWeekdayCycle(date) {
    // Weekday readings follow Year I and Year II
    // Year I: Odd years, Year II: Even years
    const year = date.getFullYear();
    return year % 2 === 0 ? 'II' : 'I';
  }

  isHolyDayOfObligation(celebrationName) {
    const holyDays = [
      'Mary, Mother of God',
      'Epiphany',
      'Ascension',
      'Corpus Christi',
      'Assumption',
      'All Saints',
      'Immaculate Conception',
      'Christmas',
      'St. Joseph',
      'Sts. Peter and Paul'
    ];
    
    return holyDays.some(day => 
      celebrationName.includes(day)
    );
  }

  async getOrCreateLiturgicalDay(date) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    console.log(`🔍 Getting liturgical day for ${startOfDay.toISOString().split('T')[0]}`);
    
    try {
      // Check database first - use findUnique since date is unique
      let liturgicalDay = await prisma.liturgicalDay.findUnique({
        where: { date: startOfDay }
      });
      
      if (liturgicalDay) {
        console.log('✅ Found in database');
        return liturgicalDay;
      }
      
      // Generate using Romcal
      console.log(`📅 Generating data for ${startOfDay.toISOString().split('T')[0]} using Romcal`);
      
      const generatedData = await this.generateLiturgicalData(startOfDay);
      
      // Create in database
      liturgicalDay = await prisma.liturgicalDay.create({
        data: generatedData
      });
      
      console.log(`✅ Created liturgical day for ${startOfDay.toISOString().split('T')[0]}`);
      return liturgicalDay;
      
    } catch (error) {
      console.error('Error in getOrCreateLiturgicalDay:', error);
      
      // Return fallback instead of throwing
      console.log('⚠️ Using fallback data');
      const fallback = this.getFallbackDay(date);
      
      // Try to save fallback to database
      try {
        return await prisma.liturgicalDay.create({
          data: fallback
        });
      } catch (saveError) {
        console.error('Failed to save fallback:', saveError);
        return fallback; // Return fallback even if save fails
      }
    }
  }

  getFallbackDay(date) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    // Simple fallback that determines season based on date
    const month = date.getMonth() + 1;
    const day = date.getDate();
    
    let season = 'ordinary';
    let seasonName = 'Ordinary Time';
    let color = 'green';
    
    // Very basic season detection
    if ((month === 12 && day >= 25) || (month === 1 && day <= 5)) {
      season = 'christmas';
      seasonName = 'Christmas';
      color = 'white';
    } else if ((month === 3 || month === 4) && day <= 20) {
      season = 'lent';
      seasonName = 'Lent';
      color = 'purple';
    } else if (month === 4 && day > 20) {
      season = 'easter';
      seasonName = 'Easter';
      color = 'white';
    }
    
    return {
      date: startOfDay,
      season: season,
      seasonName: seasonName,
      celebration: 'Weekday',
      celebrationType: 'weekday',
      liturgicalColor: color,
      rank: 'Weekday',
      yearCycle: this.getLiturgicalYear(date),
      weekdayCycle: this.getWeekdayCycle(date),
      weekNumber: null,
      holyDayOfObligation: false,
      readings: null
    };
  }

  async getLiturgicalMonth(year, month) {
    const startDate = new Date(year, month, 1);
    const endDate = new Date(year, month + 1, 0);
    
    console.log(`📅 Getting liturgical month: ${year}-${month + 1}`);
    
    // Get existing days
    const existingDays = await prisma.liturgicalDay.findMany({
      where: {
        date: {
          gte: startDate,
          lte: endDate
        }
      }
    });
    
    // Create map of existing days
    const daysMap = {};
    existingDays.forEach(day => {
      const dayDate = new Date(day.date);
      daysMap[dayDate.getDate()] = day;
    });
    
    // Generate missing days
    const daysInMonth = endDate.getDate();
    const generatedDays = [];
    
    for (let d = 1; d <= daysInMonth; d++) {
      if (!daysMap[d]) {
        const fetchDate = new Date(year, month, d);
        console.log(`🔄 Generating missing day: ${year}-${month + 1}-${d}`);
        const day = await this.getOrCreateLiturgicalDay(fetchDate);
        generatedDays.push(day);
        
        // Add a small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
    
    // Return all days
    return await prisma.liturgicalDay.findMany({
      where: {
        date: {
          gte: startDate,
          lte: endDate
        }
      },
      orderBy: {
        date: 'asc'
      }
    });
  }

  // NEW: Method to refresh readings for a specific date
  async refreshReadings(date) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    try {
      console.log(`🔄 Refreshing readings for ${startOfDay.toISOString().split('T')[0]}`);
      
      const readings = await usccbService.getSimplifiedReadings(startOfDay);
      
      if (readings) {
        const updated = await prisma.liturgicalDay.update({
          where: { date: startOfDay },
          data: { readings: readings }
        });
        console.log('✅ Readings refreshed');
        return updated;
      }
    } catch (error) {
      console.error('Failed to refresh readings:', error);
    }
    return null;
  }

  // NEW: Method to preload a range of dates
  async preloadDateRange(startDate, endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    console.log(`🔄 Preloading from ${start.toISOString().split('T')[0]} to ${end.toISOString().split('T')[0]}`);
    
    const results = {
      total: 0,
      success: 0,
      failed: 0
    };
    
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      try {
        results.total++;
        await this.getOrCreateLiturgicalDay(new Date(d));
        results.success++;
        
        // Log progress every 10 days
        if (results.success % 10 === 0) {
          console.log(`📊 Progress: ${results.success}/${results.total}`);
        }
        
        // Add delay to be respectful
        await new Promise(resolve => setTimeout(resolve, 300));
        
      } catch (error) {
        results.failed++;
        console.error(`❌ Failed for ${d.toISOString().split('T')[0]}:`, error.message);
      }
    }
    
    console.log(`✅ Preload complete: ${results.success} success, ${results.failed} failed`);
    return results;
  }
}

module.exports = new CalendarService();