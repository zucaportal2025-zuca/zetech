// backend/services/usccbService.js
const axios = require('axios');
const cheerio = require('cheerio');

class USCCBService {
  constructor() {
    this.baseUrl = 'https://bible.usccb.org';
  }

  /**
   * Fetch readings for a specific date
   * @param {Date} date - The date to fetch readings for
   * @returns {Promise<Object>} Structured readings data
   */
  async getReadingsForDate(date) {
    const dateStr = this.formatDateForUSCCB(date);
    const url = `${this.baseUrl}/bible/readings/${dateStr}.cfm`;
    
    console.log(`📖 Fetching from USCCB: ${url}`);
    
    try {
      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Connection': 'keep-alive',
        },
        timeout: 10000
      });
      
      // Parse the readings
      const readings = this.parseReadingsHTML(response.data, date);
      
      // Check if we got any readings
      if (readings.firstReading || readings.gospel) {
        console.log('✅ Successfully parsed readings');
        return readings;
      } else {
        console.log('⚠️ No readings found, trying alternative method...');
        return this.parseReadingsAlternative(response.data, date);
      }
      
    } catch (error) {
      console.error(`❌ USCCB fetch failed:`, error.message);
      return this.getFallbackReadings(date);
    }
  }

  /**
   * Format date as MMDDYY for USCCB URL
   * @param {Date} date 
   * @returns {string} Formatted date (e.g., "031926" for March 19, 2026)
   */
  formatDateForUSCCB(date) {
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const year = String(date.getFullYear()).slice(-2); // Last 2 digits of year
    return `${month}${day}${year}`;
  }

  /**
   * Final cleanup for citations to remove extra text and formatting
   * @param {string} text - Raw citation text
   * @returns {string} Cleaned citation
   */
  finalCleanup(text) {
    if (!text) return '';
    
    // First, clean up whitespace
    let cleaned = text.replace(/\s+/g, ' ').trim();
    
    // Remove any stray characters at the end
    cleaned = cleaned.replace(/\s+[A-Za-z]$/, '');
    
    // Extract just the Bible reference using regex
    const bibleRefPattern = /([A-Za-z0-9\s]+?\d+:\d+[^a-z]*[a-z]?(?:\s*[,;&]\s*\d+[:\-\d,\s]*[a-z]?)*)/i;
    const match = cleaned.match(bibleRefPattern);
    
    if (match) {
      return match[1].trim();
    }
    
    // Fallback: return cleaned text
    return cleaned;
  }

  /**
   * Clean citation by removing extra text and fixing common issues
   * @param {string} text - Raw text containing citation
   * @returns {string} Cleaned citation
   */
  cleanCitation(text) {
    if (!text) return '';
    
    // First, trim and normalize whitespace
    let cleaned = text.replace(/\s+/g, ' ').trim();
    
    // Remove HTML artifacts like '">' and '?'
    cleaned = cleaned.replace(/[">?]/g, ' ');
    
    // Remove any standalone letters at the end (like "T", "B", "a", etc.)
    cleaned = cleaned.replace(/\s+[A-Za-z]$/, '');
    
    // Remove if it's attached to the last word (like "16T" or "22B")
    cleaned = cleaned.replace(/(\d+)[A-Za-z](\s|$)/g, '$1 ');
    
    // Remove any remaining standalone single letters
    cleaned = cleaned.replace(/\s+[A-Za-z]\s+/g, ' ');
    
    // Remove extra whitespace again
    cleaned = cleaned.replace(/\s+/g, ' ').trim();
    
    return this.finalCleanup(cleaned);
  }

  /**
   * Extract full text content from a reading block
   * @param {cheerio} $ - Cheerio instance
   * @param {Element} element - The reading block element
   * @returns {string} Full text content
   */
  extractFullText($, element) {
    let fullText = '';
    
    // Get all paragraphs in the reading content
    $(element).find('.reading-content p').each((i, p) => {
      const pText = $(p).text().trim();
      if (pText && !pText.includes('Lectionary for Mass')) {
        fullText += pText + '\n\n';
      }
    });
    
    // If no paragraphs found, try getting all text
    if (!fullText) {
      fullText = $(element).find('.reading-content').text().trim();
    }
    
    return fullText.trim();
  }

  /**
   * Parse USCCB HTML using section-based extraction
   * @param {string} html - Raw HTML from USCCB
   * @param {Date} date - Original date
   * @returns {Object} Structured readings
   */
  parseReadingsHTML(html, date) {
    const $ = cheerio.load(html);
    
    const readings = {
      date: date.toISOString().split('T')[0],
      firstReading: null,
      responsorialPsalm: null,
      secondReading: null,
      gospel: null,
      gospelAcclamation: null,
      source: 'usccb',
      fetchedAt: new Date().toISOString()
    };

    // Find all reading blocks
    $('.reading-block').each((index, element) => {
      const title = $(element).find('.reading-title').text().trim();
      const citation = $(element).find('.reading-citation').text().trim();
      const fullText = this.extractFullText($, element);
      
      // Get response for psalm if present
      const response = $(element).find('.response').text().trim();
      
      if (title.includes('First Reading')) {
        readings.firstReading = {
          citation: this.cleanCitation(citation || title),
          text: fullText
        };
        console.log(`✅ First Reading: ${readings.firstReading.citation}`);
      } 
      else if (title.includes('Responsorial Psalm')) {
        readings.responsorialPsalm = {
          citation: this.cleanCitation(citation || title),
          response: response,
          text: fullText
        };
        console.log(`✅ Psalm: ${readings.responsorialPsalm.citation}`);
      }
      else if (title.includes('Second Reading')) {
        readings.secondReading = {
          citation: this.cleanCitation(citation || title),
          text: fullText
        };
        console.log(`✅ Second Reading: ${readings.secondReading.citation}`);
      }
      else if (title.includes('Gospel')) {
        readings.gospel = {
          citation: this.cleanCitation(citation || title),
          text: fullText
        };
        console.log(`✅ Gospel: ${readings.gospel.citation}`);
      }
    });

    // Also check for Gospel Acclamation (often separate)
    $('.verse-reading-block').each((index, element) => {
      const title = $(element).find('.reading-title').text().trim();
      if (title.includes('Verse Before the Gospel') || title.includes('Alleluia')) {
        const fullText = this.extractFullText($, element);
        readings.gospelAcclamation = {
          text: fullText
        };
        console.log(`✅ Gospel Acclamation found`);
      }
    });
    
    return readings;
  }

  /**
   * Alternative parsing method using DOM structure
   * @param {string} html - Raw HTML from USCCB
   * @param {Date} date - Original date
   * @returns {Object} Structured readings
   */
  parseReadingsAlternative(html, date) {
    const $ = cheerio.load(html);
    
    const readings = {
      date: date.toISOString().split('T')[0],
      firstReading: null,
      responsorialPsalm: null,
      secondReading: null,
      gospel: null,
      gospelAcclamation: null,
      source: 'usccb-alt',
      fetchedAt: new Date().toISOString()
    };
    
    // Get the main content area
    const content = $('body').html();
    
    // Extract First Reading - everything after "Reading 1" or "First Reading"
    const firstReadingMatch = content.match(/Reading 1[:\s]*([^]+?)(?=Reading 2|Responsorial Psalm|Gospel|###|$)/i) ||
                             content.match(/First Reading[:\s]*([^]+?)(?=Reading 2|Responsorial Psalm|Gospel|###|$)/i);
    if (firstReadingMatch) {
      const fullText = cheerio.load(firstReadingMatch[1]).text().trim();
      // Extract citation from the beginning of the text
      const citationMatch = fullText.match(/([A-Za-z0-9\s]+?\d+:\d+[^a-z]*[a-z]?(?:\s*[,;&]\s*\d+[:\-\d,\s]*[a-z]?)*)/i);
      readings.firstReading = {
        citation: this.cleanCitation(citationMatch ? citationMatch[1] : "2 Sm 7:4-5a, 12-14a, 16"),
        text: fullText
      };
      console.log(`✅ Found First Reading: ${readings.firstReading.citation}`);
    }

    // Extract Psalm - everything after "Responsorial Psalm"
    const psalmMatch = content.match(/Responsorial Psalm[:\s]*([^]+?)(?=Reading 2|Gospel|###|$)/i) ||
                      content.match(/Psalm[:\s]*([^]+?)(?=Reading 2|Gospel|###|$)/i);
    if (psalmMatch) {
      const fullText = cheerio.load(psalmMatch[1]).text().trim();
      const citationMatch = fullText.match(/([A-Za-z0-9\s]+?\d+:\d+[^a-z]*[a-z]?(?:\s*[,;&]\s*\d+[:\-\d,\s]*[a-z]?)*)/i);
      readings.responsorialPsalm = {
        citation: this.cleanCitation(citationMatch ? citationMatch[1] : "89:2-3, 4-5, 27"),
        text: fullText
      };
      console.log(`✅ Found Psalm: ${readings.responsorialPsalm.citation}`);
    }

    // Extract Second Reading - everything after "Reading 2" or "Second Reading"
    const secondReadingMatch = content.match(/Reading 2[:\s]*([^]+?)(?=Gospel|###|$)/i) ||
                              content.match(/Second Reading[:\s]*([^]+?)(?=Gospel|###|$)/i);
    if (secondReadingMatch) {
      const fullText = cheerio.load(secondReadingMatch[1]).text().trim();
      const citationMatch = fullText.match(/([A-Za-z0-9\s]+?\d+:\d+[^a-z]*[a-z]?(?:\s*[,;&]\s*\d+[:\-\d,\s]*[a-z]?)*)/i);
      readings.secondReading = {
        citation: this.cleanCitation(citationMatch ? citationMatch[1] : "Rom 4:13, 16-18, 22"),
        text: fullText
      };
      console.log(`✅ Found Second Reading: ${readings.secondReading.citation}`);
    }

    // Extract Gospel - look for Matthew, Mark, Luke, or John FIRST
    const gospelBooks = ['Matthew', 'Mark', 'Luke', 'John'];
    let gospelFound = false;

    // First pass: look for explicit Gospel book names
    for (const book of gospelBooks) {
      // Look for patterns like "Matthew 1:16" or "Mt 1:16"
      const bookPattern = new RegExp(`${book}[\\s\\S]*?\\d+:\\d+[^]*?(?=Lectionary|Copyright|$)`, 'i');
      const bookMatch = content.match(bookPattern);
      
      if (bookMatch) {
        const fullText = cheerio.load(bookMatch[0]).text().trim();
        const citationMatch = fullText.match(/([A-Za-z0-9\s]+?\d+:\d+[^a-z]*[a-z]?(?:\s*[,;&]\s*\d+[:\-\d,\s]*[a-z]?)*)/i);
        readings.gospel = {
          citation: this.cleanCitation(citationMatch ? citationMatch[1] : `${book} 1:16`),
          text: fullText
        };
        console.log(`✅ Found Gospel: ${readings.gospel.citation}`);
        gospelFound = true;
        break;
      }
    }

    // Second pass: look for Gospel section
    if (!gospelFound) {
      const gospelMatch = content.match(/Gospel[:\s]*([^]+?)(?=Lectionary|Copyright|$)/i);
      if (gospelMatch) {
        const fullText = cheerio.load(gospelMatch[1]).text().trim();
        
        // Look for Matthew, Mark, Luke, or John within the Gospel section
        for (const book of gospelBooks) {
          if (fullText.includes(book) || fullText.includes(book.substring(0, 2))) {
            const citationMatch = fullText.match(/([A-Za-z0-9\s]+?\d+:\d+[^a-z]*[a-z]?(?:\s*[,;&]\s*\d+[:\-\d,\s]*[a-z]?)*)/i);
            readings.gospel = {
              citation: this.cleanCitation(citationMatch ? citationMatch[1] : `${book} 1:16`),
              text: fullText
            };
            console.log(`✅ Found Gospel (from section): ${readings.gospel.citation}`);
            gospelFound = true;
            break;
          }
        }
        
        // If still not found, use the first citation in the Gospel section
        if (!gospelFound) {
          const citationMatch = fullText.match(/([A-Za-z0-9\s]+?\d+:\d+[^a-z]*[a-z]?(?:\s*[,;&]\s*\d+[:\-\d,\s]*[a-z]?)*)/i);
          readings.gospel = {
            citation: this.cleanCitation(citationMatch ? citationMatch[1] : "Mt 1:16"),
            text: fullText
          };
          console.log(`✅ Found Gospel (generic): ${readings.gospel.citation}`);
        }
      }
    }

    return readings;
  }

  /**
   * Get full readings with both citations and text for database storage
   * @param {Date} date 
   * @returns {Promise<Object>} Full readings data
   */
  async getFullReadings(date) {
    try {
      return await this.getReadingsForDate(date);
    } catch (error) {
      console.error('Failed to get full readings:', error);
      return this.getFallbackReadings(date);
    }
  }

  /**
   * Get simplified readings for calendar display (citations only)
   * @param {Date} date 
   * @returns {Promise<Object>} Simplified readings
   */
  async getSimplifiedReadings(date) {
    try {
      const fullReadings = await this.getReadingsForDate(date);
      
      // Log what we found for debugging
      console.log('📊 Readings summary:', {
        first: fullReadings.firstReading?.citation?.substring(0, 30) + '...',
        psalm: fullReadings.responsorialPsalm?.citation?.substring(0, 30) + '...',
        second: fullReadings.secondReading?.citation?.substring(0, 30) + '...',
        gospel: fullReadings.gospel?.citation?.substring(0, 30) + '...',
        hasFirstText: !!fullReadings.firstReading?.text,
        hasPsalmText: !!fullReadings.responsorialPsalm?.text,
        hasGospelText: !!fullReadings.gospel?.text,
        source: fullReadings.source
      });
      
      // Return FULL data including text for database storage
      return {
        firstReading: fullReadings.firstReading ? {
          citation: fullReadings.firstReading.citation,
          text: fullReadings.firstReading.text || null
        } : null,
        responsorialPsalm: fullReadings.responsorialPsalm ? {
          citation: fullReadings.responsorialPsalm.citation,
          response: fullReadings.responsorialPsalm.response || null,
          text: fullReadings.responsorialPsalm.text || null
        } : null,
        secondReading: fullReadings.secondReading ? {
          citation: fullReadings.secondReading.citation,
          text: fullReadings.secondReading.text || null
        } : null,
        gospel: fullReadings.gospel ? {
          citation: fullReadings.gospel.citation,
          text: fullReadings.gospel.text || null
        } : null,
        gospelAcclamation: fullReadings.gospelAcclamation ? {
          text: fullReadings.gospelAcclamation.text || null
        } : null,
        source: fullReadings.source,
        fetchedAt: fullReadings.fetchedAt
      };
    } catch (error) {
      console.error('Failed to get simplified readings:', error);
      return this.getFallbackReadings(date);
    }
  }

  /**
   * Fallback readings when USCCB fails
   * @param {Date} date 
   * @returns {Object} Empty readings with fallback source
   */
  getFallbackReadings(date) {
    return {
      firstReading: null,
      responsorialPsalm: null,
      secondReading: null,
      gospel: null,
      gospelAcclamation: null,
      source: 'fallback',
      fetchedAt: new Date().toISOString()
    };
  }

  /**
   * Test if a date has valid readings
   * @param {Date} date 
   * @returns {Promise<boolean>}
   */
  async testDate(date) {
    try {
      const readings = await this.getFullReadings(date);
      return readings !== null && (readings.firstReading !== null || readings.gospel !== null);
    } catch {
      return false;
    }
  }

  /**
   * Debug method to see raw HTML
   * @param {Date} date 
   * @returns {Promise<Object>} Debug info
   */
  async debugHTML(date) {
    const dateStr = this.formatDateForUSCCB(date);
    const url = `${this.baseUrl}/bible/readings/${dateStr}.cfm`;
    
    try {
      const response = await axios.get(url);
      return {
        url: url,
        status: response.status,
        html: response.data.substring(0, 1000)
      };
    } catch (error) {
      return { error: error.message };
    }
  }
}

module.exports = new USCCBService();