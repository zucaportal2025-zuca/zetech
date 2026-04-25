// backend/services/infiniteCalendar.js
class InfiniteCalendarService {
  constructor() {
    // Your populated base years (the ones you have complete data for)
    this.baseYears = {
      sunday: {
        A: 2026,  // Year A data from 2026
        B: 2027,  // Year B data from 2027
        C: 2025   // Year C data from 2025
      },
      weekday: {
        I: 2027,  // Year I data from 2027 (odd)
        II: 2026  // Year II data from 2026 (even)
      }
    };

    // Fixed feasts (same date every year, same readings)
    this.fixedFeasts = [
      { month: 1, day: 1, name: "Mary, Mother of God" },
      { month: 1, day: 6, name: "Saint Raymond of Penyafort" },
      { month: 1, day: 7, name: "Saint Raymond of Penyafort" },
      { month: 1, day: 25, name: "Conversion of St. Paul" },
      { month: 2, day: 2, name: "Presentation" },
      { month: 2, day: 22, name: "Chair of St. Peter" },
      { month: 3, day: 17, name: "St. Patrick" },
      { month: 3, day: 19, name: "St. Joseph" },
      { month: 3, day: 25, name: "Annunciation" },
      { month: 5, day: 1, name: "St. Joseph the Worker" },
      { month: 5, day: 3, name: "Sts. Philip and James" },
      { month: 5, day: 14, name: "St. Matthias" },
      { month: 6, day: 11, name: "St. Barnabas" },
      { month: 6, day: 13, name: "St. Anthony of Padua" },
      { month: 6, day: 24, name: "Nativity of St. John the Baptist" },
      { month: 6, day: 29, name: "Sts. Peter and Paul" },
      { month: 7, day: 3, name: "St. Thomas" },
      { month: 7, day: 11, name: "St. Benedict" },
      { month: 7, day: 22, name: "St. Mary Magdalene" },
      { month: 7, day: 25, name: "St. James" },
      { month: 8, day: 6, name: "Transfiguration" },
      { month: 8, day: 10, name: "St. Lawrence" },
      { month: 8, day: 15, name: "Assumption" },
      { month: 8, day: 24, name: "St. Bartholomew" },
      { month: 9, day: 8, name: "Birth of Mary" },
      { month: 9, day: 14, name: "Exaltation of the Holy Cross" },
      { month: 9, day: 21, name: "St. Matthew" },
      { month: 9, day: 29, name: "Sts. Michael, Gabriel, Raphael" },
      { month: 10, day: 1, name: "St. Thérèse of Lisieux" },
      { month: 10, day: 4, name: "St. Francis of Assisi" },
      { month: 10, day: 18, name: "St. Luke" },
      { month: 10, day: 28, name: "Sts. Simon and Jude" },
      { month: 11, day: 1, name: "All Saints" },
      { month: 11, day: 2, name: "All Souls" },
      { month: 11, day: 9, name: "Dedication of Lateran" },
      { month: 11, day: 14, name: "St. Albert the Great" },
      { month: 11, day: 30, name: "St. Andrew" },
      { month: 12, day: 6, name: "St. Nicholas" },
      { month: 12, day: 8, name: "Immaculate Conception" },
      { month: 12, day: 12, name: "Our Lady of Guadalupe" },
      { month: 12, day: 25, name: "Christmas" },
      { month: 12, day: 26, name: "St. Stephen" },
      { month: 12, day: 27, name: "St. John" },
      { month: 12, day: 28, name: "Holy Innocents" }
    ];
  }

  getOrdinalSuffix(num) {
    if (num === 1) return 'st';
    if (num === 2) return 'nd';
    if (num === 3) return 'rd';
    return 'th';
  }

  getDayOfWeekName(date) {
    const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return daysOfWeek[date.getDay()];
  }

  calculateEaster(year) {
    const a = year % 19;
    const b = Math.floor(year / 100);
    const c = year % 100;
    const d = Math.floor(b / 4);
    const e = b % 4;
    const f = Math.floor((b + 8) / 25);
    const g = Math.floor((b - f + 1) / 3);
    const h = (19 * a + b - d - g + 15) % 30;
    const i = Math.floor(c / 4);
    const k = c % 4;
    const l = (32 + 2 * e + 2 * i - h - k) % 7;
    const m = Math.floor((a + 11 * h + 22 * l) / 451);
    const month = Math.floor((h + l - 7 * m + 114) / 31);
    const day = ((h + l - 7 * m + 114) % 31) + 1;
    
    return new Date(year, month - 1, day);
  }

  getAdventStart(year) {
    const christmasDate = new Date(year, 11, 25);
    const adventStart = new Date(christmasDate);
    const dayOfWeek = christmasDate.getDay();
    adventStart.setDate(christmasDate.getDate() - (dayOfWeek + 21));
    return adventStart;
  }

  // ========== NEW: Movable Feast Detection ==========
  /**
   * Detect if a date is a movable feast and return its type
   */
  getMovableFeastType(date) {
    const year = date.getFullYear();
    const easterDate = this.calculateEaster(year);
    
    // Calculate all movable feast dates for this year
    const ashWednesday = new Date(easterDate);
    ashWednesday.setDate(easterDate.getDate() - 46);
    
    const palmSunday = new Date(easterDate);
    palmSunday.setDate(easterDate.getDate() - 7);
    
    const ascension = new Date(easterDate);
    ascension.setDate(easterDate.getDate() + 39);
    
    const pentecost = new Date(easterDate);
    pentecost.setDate(easterDate.getDate() + 49);
    
    const trinitySunday = new Date(pentecost);
    trinitySunday.setDate(pentecost.getDate() + 1);
    while (trinitySunday.getDay() !== 0) {
      trinitySunday.setDate(trinitySunday.getDate() + 1);
    }
    
    const corpusChristi = new Date(trinitySunday);
    corpusChristi.setDate(trinitySunday.getDate() + 4);
    
    const sacredHeart = new Date(corpusChristi);
    sacredHeart.setDate(corpusChristi.getDate() + 7);
    
    // Check which feast this date is
    if (date.toDateString() === ashWednesday.toDateString()) return 'ash_wednesday';
    if (date.toDateString() === palmSunday.toDateString()) return 'palm_sunday';
    if (date.toDateString() === ascension.toDateString()) return 'ascension';
    if (date.toDateString() === pentecost.toDateString()) return 'pentecost';
    if (date.toDateString() === trinitySunday.toDateString()) return 'trinity_sunday';
    if (date.toDateString() === corpusChristi.toDateString()) return 'corpus_christi';
    if (date.toDateString() === sacredHeart.toDateString()) return 'sacred_heart';
    
    return null;
  }

  /**
   * Get readings for a movable feast by finding a source year with the SAME feast
   */
  async getMovableFeastReadings(feastType, targetDate, prisma) {
    console.log(`   🔍 Searching for ${feastType} readings in source years...`);
    
    // Try to find a year (2024-2028) where this feast falls on a date that has readings
    for (let sourceYear = 2024; sourceYear <= 2028; sourceYear++) {
      const sourceEaster = this.calculateEaster(sourceYear);
      
      let sourceDate = null;
      
      // Calculate the same feast date in the source year
      switch (feastType) {
        case 'ash_wednesday':
          sourceDate = new Date(sourceEaster);
          sourceDate.setDate(sourceEaster.getDate() - 46);
          break;
        case 'palm_sunday':
          sourceDate = new Date(sourceEaster);
          sourceDate.setDate(sourceEaster.getDate() - 7);
          break;
        case 'ascension':
          sourceDate = new Date(sourceEaster);
          sourceDate.setDate(sourceEaster.getDate() + 39);
          break;
        case 'pentecost':
          sourceDate = new Date(sourceEaster);
          sourceDate.setDate(sourceEaster.getDate() + 49);
          break;
        case 'trinity_sunday':
          const sourcePentecost = new Date(sourceEaster);
          sourcePentecost.setDate(sourceEaster.getDate() + 49);
          sourceDate = new Date(sourcePentecost);
          sourceDate.setDate(sourcePentecost.getDate() + 1);
          while (sourceDate.getDay() !== 0) {
            sourceDate.setDate(sourceDate.getDate() + 1);
          }
          break;
        case 'corpus_christi':
          const sourcePentecost2 = new Date(sourceEaster);
          sourcePentecost2.setDate(sourceEaster.getDate() + 49);
          const sourceTrinity = new Date(sourcePentecost2);
          sourceTrinity.setDate(sourcePentecost2.getDate() + 1);
          while (sourceTrinity.getDay() !== 0) {
            sourceTrinity.setDate(sourceTrinity.getDate() + 1);
          }
          sourceDate = new Date(sourceTrinity);
          sourceDate.setDate(sourceTrinity.getDate() + 4);
          break;
        case 'sacred_heart':
          const sourcePentecost3 = new Date(sourceEaster);
          sourcePentecost3.setDate(sourceEaster.getDate() + 49);
          const sourceTrinity2 = new Date(sourcePentecost3);
          sourceTrinity2.setDate(sourcePentecost3.getDate() + 1);
          while (sourceTrinity2.getDay() !== 0) {
            sourceTrinity2.setDate(sourceTrinity2.getDate() + 1);
          }
          const sourceCorpus = new Date(sourceTrinity2);
          sourceCorpus.setDate(sourceTrinity2.getDate() + 4);
          sourceDate = new Date(sourceCorpus);
          sourceDate.setDate(sourceCorpus.getDate() + 7);
          break;
      }
      
      if (sourceDate) {
        const reading = await this.getDirectReadings(sourceDate, prisma);
        if (reading && reading.readings && reading.readings.gospel) {
          console.log(`   ✅ Found ${feastType} readings from ${sourceYear} (${sourceDate.toDateString()})`);
          return reading.readings;
        }
      }
    }
    
    console.log(`   ⚠️ No ${feastType} readings found in any source year`);
    return null;
  }
  // ========== END NEW CODE ==========

  calculateWeekNumber(date) {
    const year = date.getFullYear();
    const easterDate = this.calculateEaster(year);
    const adventStart = this.getAdventStart(year);
    const christmasDate = new Date(year, 11, 25);
    const epiphanyDate = new Date(year, 0, 6);
    const lentStart = new Date(easterDate);
    lentStart.setDate(easterDate.getDate() - 46);
    const pentecostDate = new Date(easterDate);
    pentecostDate.setDate(easterDate.getDate() + 49);
    
    if (date >= adventStart && date < christmasDate) {
      const daysSinceAdvent = Math.floor((date - adventStart) / (1000 * 60 * 60 * 24));
      return { season: 'advent', seasonName: 'Advent', weekNumber: Math.floor(daysSinceAdvent / 7) + 1 };
    }
    
    if (date >= christmasDate && date <= epiphanyDate) {
      return { season: 'christmas', seasonName: 'Christmas', weekNumber: null };
    }
    
    if (date >= lentStart && date < easterDate) {
      const daysSinceLent = Math.floor((date - lentStart) / (1000 * 60 * 60 * 24));
      return { season: 'lent', seasonName: 'Lent', weekNumber: Math.floor(daysSinceLent / 7) + 1 };
    }
    
    if (date >= easterDate && date <= pentecostDate) {
      const daysSinceEaster = Math.floor((date - easterDate) / (1000 * 60 * 60 * 24));
      return { season: 'easter', seasonName: 'Easter', weekNumber: Math.floor(daysSinceEaster / 7) + 1 };
    }
    
    let firstSundayAfterPentecost = new Date(pentecostDate);
    firstSundayAfterPentecost.setDate(pentecostDate.getDate() + 1);
    while (firstSundayAfterPentecost.getDay() !== 0) {
      firstSundayAfterPentecost.setDate(firstSundayAfterPentecost.getDate() + 1);
    }
    
    if (date < firstSundayAfterPentecost) {
      return { season: 'ordinary', seasonName: 'Ordinary Time', weekNumber: null };
    }
    
    const daysAfterFirstSunday = Math.floor((date - firstSundayAfterPentecost) / (1000 * 60 * 60 * 24));
    const weekNumber = Math.floor(daysAfterFirstSunday / 7) + 1;
    
    return { season: 'ordinary', seasonName: 'Ordinary Time', weekNumber };
  }

  getCelebrationName(date) {
    const liturgicalInfo = this.calculateWeekNumber(date);
    const actualDay = this.getDayOfWeekName(date);
    const year = date.getFullYear();
    const easterDate = this.calculateEaster(year);
    const lentStart = new Date(easterDate);
    lentStart.setDate(easterDate.getDate() - 46);
    const palmSunday = new Date(easterDate);
    palmSunday.setDate(easterDate.getDate() - 7);
    const pentecostDate = new Date(easterDate);
    pentecostDate.setDate(easterDate.getDate() + 49);
    
    // ========== UPDATED: Check movable feasts FIRST ==========
    const movableFeastType = this.getMovableFeastType(date);
    if (movableFeastType) {
      switch (movableFeastType) {
        case 'ash_wednesday':
          return 'Ash Wednesday';
        case 'palm_sunday':
          return 'Palm Sunday';
        case 'ascension':
          return 'The Ascension of the Lord';
        case 'pentecost':
          return 'Pentecost Sunday';
        case 'trinity_sunday':
          return 'The Solemnity of the Most Holy Trinity';
        case 'corpus_christi':
          return 'The Solemnity of the Most Holy Body and Blood of Christ (Corpus Christi)';
        case 'sacred_heart':
          return 'The Solemnity of the Most Sacred Heart of Jesus';
        default:
          return `${actualDay} - ${movableFeastType.replace('_', ' ')}`;
      }
    }
    // ========== END UPDATE ==========
    
    // Check fixed feasts
    const isFixedFeast = this.fixedFeasts.some(f => 
      f.month === date.getMonth() + 1 && f.day === date.getDate()
    );
    
    if (isFixedFeast) {
      const feast = this.fixedFeasts.find(f => 
        f.month === date.getMonth() + 1 && f.day === date.getDate()
      );
      return `${actualDay} - ${feast.name}`;
    }
    
    switch (liturgicalInfo.season) {
      case 'advent':
        const adventWeek = liturgicalInfo.weekNumber;
        if (date.getDay() === 0) {
          if (adventWeek === 1) return 'First Sunday of Advent';
          if (adventWeek === 2) return 'Second Sunday of Advent';
          if (adventWeek === 3) return 'Third Sunday of Advent';
          if (adventWeek === 4) return 'Fourth Sunday of Advent';
          return `${adventWeek}${this.getOrdinalSuffix(adventWeek)} Sunday of Advent`;
        }
        return `${actualDay} of the ${adventWeek}${this.getOrdinalSuffix(adventWeek)} week of Advent`;
        
      case 'christmas':
        if (date.getDate() === 25 && date.getMonth() === 11) return 'The Nativity of the Lord (Christmas)';
        if (date.getDate() === 1 && date.getMonth() === 0) return 'Mary, Mother of God';
        if (date.getDate() === 6 && date.getMonth() === 0) return 'The Epiphany of the Lord';
        if (date.getDay() === 0) return `The Octave Day of Christmas`;
        return `${actualDay} within the Octave of Christmas`;
        
      case 'lent':
        const lentWeek = liturgicalInfo.weekNumber;
        
        if (date.toDateString() === lentStart.toDateString()) return 'Ash Wednesday';
        
        if (date >= palmSunday && date < easterDate) {
          if (date.getDay() === 0) return 'Palm Sunday';
          if (date.getDay() === 5) return 'Holy Thursday';
          if (date.getDay() === 6) return 'Good Friday';
          return `${actualDay} of Holy Week`;
        }
        
        if (date.getDay() === 0) {
          if (lentWeek === 1) return 'First Sunday of Lent';
          if (lentWeek === 2) return 'Second Sunday of Lent';
          if (lentWeek === 3) return 'Third Sunday of Lent';
          if (lentWeek === 4) return 'Fourth Sunday of Lent';
          if (lentWeek === 5) return 'Fifth Sunday of Lent';
          return `${lentWeek}${this.getOrdinalSuffix(lentWeek)} Sunday of Lent`;
        }
        
        return `${actualDay} of the ${lentWeek}${this.getOrdinalSuffix(lentWeek)} week of Lent`;
        
      case 'easter':
        const easterWeek = liturgicalInfo.weekNumber;
        const ascensionDate = new Date(easterDate);
        ascensionDate.setDate(easterDate.getDate() + 39);
        
        if (date.toDateString() === ascensionDate.toDateString()) return 'The Ascension of the Lord';
        if (date.toDateString() === pentecostDate.toDateString()) return 'Pentecost Sunday';
        if (easterWeek === 1 && date.getDay() === 0) return 'Easter Sunday';
        if (easterWeek === 2 && date.getDay() === 0) return 'Divine Mercy Sunday';
        
        if (date.getDay() === 0) {
          if (easterWeek === 3) return 'Third Sunday of Easter';
          if (easterWeek === 4) return 'Fourth Sunday of Easter';
          if (easterWeek === 5) return 'Fifth Sunday of Easter';
          if (easterWeek === 6) return 'Sixth Sunday of Easter';
          if (easterWeek === 7) return 'Seventh Sunday of Easter';
          return `${easterWeek}${this.getOrdinalSuffix(easterWeek)} Sunday of Easter`;
        }
        
        return `${actualDay} of the ${easterWeek}${this.getOrdinalSuffix(easterWeek)} week of Easter`;
        
      case 'ordinary':
        const weekNumber = liturgicalInfo.weekNumber;
        
        if (!weekNumber) {
          const trinitySunday = new Date(pentecostDate);
          trinitySunday.setDate(pentecostDate.getDate() + (7 - pentecostDate.getDay()) % 7);
          
          if (date.toDateString() === trinitySunday.toDateString()) {
            return 'The Solemnity of the Most Holy Trinity';
          }
          
          const corpusChristi = new Date(trinitySunday);
          corpusChristi.setDate(trinitySunday.getDate() + 4);
          if (date.toDateString() === corpusChristi.toDateString()) {
            return 'The Solemnity of the Most Holy Body and Blood of Christ (Corpus Christi)';
          }
          
          return `${actualDay} after Pentecost`;
        }
        
        if (date.getDay() === 0) {
          const sundayNames = [
            'First', 'Second', 'Third', 'Fourth', 'Fifth', 'Sixth', 'Seventh', 'Eighth',
            'Ninth', 'Tenth', 'Eleventh', 'Twelfth', 'Thirteenth', 'Fourteenth', 'Fifteenth',
            'Sixteenth', 'Seventeenth', 'Eighteenth', 'Nineteenth', 'Twentieth', 'Twenty-First',
            'Twenty-Second', 'Twenty-Third', 'Twenty-Fourth', 'Twenty-Fifth', 'Twenty-Sixth',
            'Twenty-Seventh', 'Twenty-Eighth', 'Twenty-Ninth', 'Thirtieth', 'Thirty-First',
            'Thirty-Second', 'Thirty-Third', 'Thirty-Fourth'
          ];
          
          if (weekNumber === 34) return `Thirty-Fourth Sunday of Ordinary Time (Christ the King)`;
          if (weekNumber <= sundayNames.length) {
            return `${sundayNames[weekNumber - 1]} Sunday of Ordinary Time`;
          }
          return `${weekNumber}${this.getOrdinalSuffix(weekNumber)} Sunday of Ordinary Time`;
        }
        
        return `${actualDay} of the ${weekNumber}${this.getOrdinalSuffix(weekNumber)} week of Ordinary Time`;
        
      default:
        return `${actualDay} - Liturgical Celebration`;
    }
  }

  getYearCycle(targetDate) {
    const year = targetDate.getFullYear();
    const cycles = ['A', 'B', 'C'];
    const offset = (year - 2025) % 3;
    const adjustedOffset = ((offset % 3) + 3) % 3;
    return cycles[adjustedOffset];
  }

  /**
   * Find readings for a fixed feast by searching ALL years (2024-2028)
   */
  async findReadingsForFixedFeast(targetDate, prisma) {
    const month = targetDate.getMonth();
    const day = targetDate.getDate();
    
    console.log(`   🔍 Searching for fixed feast readings for ${targetDate.toDateString()}...`);
    
    // Try all years in your database range
    for (let testYear = 2024; testYear <= 2028; testYear++) {
      const testDate = new Date(testYear, month, day);
      const reading = await this.getDirectReadings(testDate, prisma);
      
      if (reading && reading.readings) {
        const hasGospel = reading.readings.gospel && reading.readings.gospel.text;
        const hasFirstReading = reading.readings.firstReading && reading.readings.firstReading.text;
        
        if (hasGospel && hasFirstReading) {
          console.log(`   ✅ Found complete readings in ${testYear}: ${testDate.toDateString()}`);
          return {
            readings: reading.readings,
            celebration: reading.celebration,
            sourceYear: testYear
          };
        }
      }
    }
    
    console.log(`   ⚠️ No complete readings found, trying to assemble...`);
    const assembled = await this.assembleReadingsForDate(targetDate, prisma);
    if (assembled) {
      return {
        readings: assembled,
        celebration: this.getCelebrationName(targetDate),
        sourceYear: 'assembled'
      };
    }
    
    console.log(`   ❌ No readings found for fixed feast`);
    return null;
  }

  /**
   * Assemble readings for a date from multiple years
   */
  async assembleReadingsForDate(targetDate, prisma) {
    const month = targetDate.getMonth();
    const day = targetDate.getDate();
    
    let assembledReadings = {
      firstReading: null,
      responsorialPsalm: null,
      secondReading: null,
      gospel: null,
      source: 'assembled'
    };
    
    let foundAny = false;
    
    for (let testYear = 2024; testYear <= 2028; testYear++) {
      const testDate = new Date(testYear, month, day);
      const reading = await this.getDirectReadings(testDate, prisma);
      
      if (reading && reading.readings) {
        foundAny = true;
        
        if (!assembledReadings.firstReading && reading.readings.firstReading && reading.readings.firstReading.text) {
          assembledReadings.firstReading = reading.readings.firstReading;
          console.log(`   📖 First Reading from ${testYear}`);
        }
        
        if (!assembledReadings.responsorialPsalm && reading.readings.responsorialPsalm && reading.readings.responsorialPsalm.text) {
          assembledReadings.responsorialPsalm = reading.readings.responsorialPsalm;
          console.log(`   📜 Psalm from ${testYear}`);
        }
        
        if (!assembledReadings.secondReading && reading.readings.secondReading && reading.readings.secondReading.text) {
          assembledReadings.secondReading = reading.readings.secondReading;
          console.log(`   📖 Second Reading from ${testYear}`);
        }
        
        if (!assembledReadings.gospel && reading.readings.gospel && reading.readings.gospel.text) {
          assembledReadings.gospel = reading.readings.gospel;
          console.log(`   ✝️ Gospel from ${testYear}`);
        }
        
        if (assembledReadings.firstReading && assembledReadings.responsorialPsalm && assembledReadings.gospel) {
          console.log(`   ✅ Assembled complete readings!`);
          break;
        }
      }
    }
    
    if (!foundAny) {
      console.log(`   ❌ No readings found in any year`);
      return null;
    }
    
    return assembledReadings;
  }

  async getDirectReadings(date, prisma) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    
    return await prisma.liturgicalDay.findFirst({
      where: {
        date: {
          gte: startOfDay,
          lte: endOfDay
        }
      }
    });
  }

  async findSourceYear(targetDate, isSunday, prisma) {
    const targetYear = targetDate.getFullYear();
    
    if (isSunday) {
      const cycleMap = { 0: 2026, 1: 2027, 2: 2025 };
      const offset = (targetYear - 2026) % 3;
      const adjustedOffset = ((offset % 3) + 3) % 3;
      return cycleMap[adjustedOffset];
    } else {
      const targetParity = targetYear % 2;
      return targetParity === 0 ? 2026 : 2027;
    }
  }

  /**
   * MAIN FUNCTION: Get readings for ANY date
   */
  async getReadingsForAnyDate(targetDate, prisma) {
    const year = targetDate.getFullYear();
    const month = targetDate.getMonth();
    const day = targetDate.getDate();
    const isSunday = targetDate.getDay() === 0;
    
    console.log(`\n${'='.repeat(60)}`);
    console.log(`📅 Getting readings for: ${targetDate.toDateString()} (${this.getDayOfWeekName(targetDate)})`);
    console.log(`${'='.repeat(60)}`);
    
    // ========== UPDATED: STEP 1 - Check movable feasts FIRST ==========
    const movableFeastType = this.getMovableFeastType(targetDate);
    
    if (movableFeastType) {
      console.log(`🎯 MOVABLE FEAST DETECTED: ${movableFeastType}`);
      
      const feastReadings = await this.getMovableFeastReadings(movableFeastType, targetDate, prisma);
      
      if (feastReadings) {
        const liturgicalInfo = this.calculateWeekNumber(targetDate);
        const celebrationName = this.getCelebrationName(targetDate);
        
        console.log(`   ✅ Using movable feast readings`);
        
        return {
          celebration: celebrationName,
          season: liturgicalInfo.season,
          seasonName: liturgicalInfo.seasonName,
          weekNumber: liturgicalInfo.weekNumber,
          yearCycle: this.getYearCycle(targetDate),
          readings: feastReadings,
          _movableFeast: movableFeastType
        };
      }
    }
    // ========== END UPDATE ==========
    
    // Check if it's a fixed feast
    const monthNum = targetDate.getMonth() + 1;
    const dayNum = targetDate.getDate();
    const isFixedFeast = this.fixedFeasts.some(f => f.month === monthNum && f.day === dayNum);
    
    // For years 2024-2028, use database directly
    if (year >= 2024 && year <= 2028) {
      const directReading = await this.getDirectReadings(targetDate, prisma);
      if (directReading) {
        const liturgicalInfo = this.calculateWeekNumber(targetDate);
        const celebrationName = this.getCelebrationName(targetDate);
        
        // If it's a fixed feast but no readings, search other years
        let finalReadings = directReading.readings;
        if (isFixedFeast && (!finalReadings || !finalReadings.gospel)) {
          console.log(`   🔍 Fixed feast: searching for readings...`);
          const feastData = await this.findReadingsForFixedFeast(targetDate, prisma);
          if (feastData && feastData.readings) {
            finalReadings = feastData.readings;
          }
        }
        
        return {
          ...directReading,
          celebration: celebrationName,
          season: liturgicalInfo.season,
          seasonName: liturgicalInfo.seasonName,
          weekNumber: liturgicalInfo.weekNumber,
          yearCycle: this.getYearCycle(targetDate),
          readings: finalReadings
        };
      }
      return directReading;
    }
    
    // For future years, map to source year
    const sourceYear = await this.findSourceYear(targetDate, isSunday, prisma);
    
    if (!sourceYear) {
      console.log(`   ❌ No source year found`);
      return null;
    }
    
    const sourceDate = new Date(sourceYear, month, day);
    console.log(`   📚 Using source year: ${sourceYear} (${sourceDate.toDateString()})`);
    
    let sourceReadings = await this.getDirectReadings(sourceDate, prisma);
    
    // CRITICAL: For fixed feasts, ALWAYS search all years for complete readings
    if (isFixedFeast) {
      console.log(`   🎯 Fixed feast detected! Searching all years for readings...`);
      const feastData = await this.findReadingsForFixedFeast(targetDate, prisma);
      
      if (feastData && feastData.readings) {
        // Create a synthetic reading object with the feast readings
        sourceReadings = {
          ...sourceReadings,
          readings: feastData.readings,
          celebration: this.getCelebrationName(targetDate)
        };
        console.log(`   ✅ Using fixed feast readings from year ${feastData.sourceYear || 'assembled'}`);
      }
    }
    
    // If still no readings, try to assemble
    if (!sourceReadings || !sourceReadings.readings || !sourceReadings.readings.gospel) {
      console.log(`   ⚠️ No readings found, attempting to assemble...`);
      const assembledReadings = await this.assembleReadingsForDate(targetDate, prisma);
      if (assembledReadings) {
        sourceReadings = {
          ...sourceReadings,
          readings: assembledReadings
        };
      }
    }
    
    if (sourceReadings) {
      const liturgicalInfo = this.calculateWeekNumber(targetDate);
      const celebrationName = this.getCelebrationName(targetDate);
      
      console.log(`   🎯 Celebration: ${celebrationName}`);
      console.log(`   📅 Season: ${liturgicalInfo.seasonName}, Week: ${liturgicalInfo.weekNumber || 'N/A'}`);
      
      return {
        ...sourceReadings,
        celebration: celebrationName,
        season: liturgicalInfo.season,
        seasonName: liturgicalInfo.seasonName,
        weekNumber: liturgicalInfo.weekNumber,
        yearCycle: this.getYearCycle(targetDate),
        readings: sourceReadings.readings,
        _mappedFrom: sourceDate.toISOString().split('T')[0]
      };
    }
    
    return null;
  }

  async prePopulateYears(startYear, endYear, prisma) {
    console.log(`🌍 Pre-populating years ${startYear} to ${endYear}...`);
    
    for (let year = startYear; year <= endYear; year++) {
      if (year >= 2024 && year <= 2028) continue;
      
      console.log(`📅 Processing year ${year}...`);
      
      for (let month = 0; month < 12; month++) {
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        
        for (let day = 1; day <= daysInMonth; day++) {
          const targetDate = new Date(year, month, day);
          
          const exists = await prisma.liturgicalDay.findFirst({
            where: {
              date: {
                gte: new Date(year, month, day, 0, 0, 0),
                lte: new Date(year, month, day, 23, 59, 59, 999)
              }
            }
          });
          
          if (!exists) {
            const sourceReadings = await this.getReadingsForAnyDate(targetDate, prisma);
            const liturgicalInfo = this.calculateWeekNumber(targetDate);
            
            if (sourceReadings) {
              await prisma.liturgicalDay.create({
                data: {
                  date: targetDate,
                  season: liturgicalInfo.season,
                  seasonName: liturgicalInfo.seasonName,
                  celebration: this.getCelebrationName(targetDate),
                  celebrationType: sourceReadings.celebrationType,
                  liturgicalColor: sourceReadings.liturgicalColor,
                  rank: sourceReadings.rank,
                  yearCycle: this.getYearCycle(targetDate),
                  weekdayCycle: year % 2 === 0 ? 'II' : 'I',
                  weekNumber: liturgicalInfo.weekNumber,
                  holyDayOfObligation: sourceReadings.holyDayOfObligation,
                  readings: sourceReadings.readings
                }
              });
            }
          }
        }
      }
    }
    
    console.log(`✅ Pre-population complete for years ${startYear}-${endYear}`);
  }
}

module.exports = new InfiniteCalendarService();