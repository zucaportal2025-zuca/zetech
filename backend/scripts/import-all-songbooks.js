// scripts/import-all-songbooks.js
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

// Helper function to clean HTML/XML tags
function stripTags(str) {
  if (!str) return '';
  return str.replace(/<[^>]*>/g, '').trim();
}

// Helper function to detect language from content
function detectLanguage(text, filename) {
  const lowerText = text.toLowerCase();
  const lowerFilename = filename.toLowerCase();
  
  // Check filename first
  if (lowerFilename.includes('kikuyu') || lowerFilename.includes('mugikuyu') || lowerFilename.includes('mitha') || lowerFilename.includes('gikuyu')) {
    return 'Kikuyu';
  }
  if (lowerFilename.includes('luo') || lowerFilename.includes('inyas') || lowerFilename.includes('mairo') || lowerFilename.includes('dholuo')) {
    return 'Luo';
  }
  if (lowerFilename.includes('english') || lowerFilename.includes('advent') || lowerFilename.includes('easter')) {
    // But content might be Swahili
  }
  if (lowerFilename.includes('swahili') || lowerFilename.includes('kiswahili')) {
    return 'Swahili';
  }
  
  // Common Luo words
  const luoWords = ['luo', 'nyasaye', 'wach', 'ng\'at', 'kanye', 'erokamano', 'joma', 'yie', 'chunya', 'ruoth', 'ok', 'ni', 'gi', 'kod', 'kende', 'nyaka', 'dwoko', 'wacho', 'tim', 'ngima', 'chuny', 'dhako', 'nyathi', 'wuoro', 'hero', 'hera', 'kwayo', 'lamo', 'pak', 'suno', 'rem', 'tho', 'ngima', 'chuny', 'roho', 'kindgi', 'mach', 'pi', 'koth', 'piny', ' polo', 'ngato', 'mor', 'bwogo', 'kwe', 'kuye', 'adiera', 'adiera', 'nyiso', 'nyisa', 'wachni', 'wachne'];
  for (const word of luoWords) {
    if (lowerText.includes(word)) return 'Luo';
  }
  
  // Common Kikuyu words
  const kikuyuWords = ['ngai', 'mwathani', 'kirira', 'wendi', 'noguo', 'wendo', 'thingira', 'mwene', 'mugikuyu', 'niakuhura', 'niguo', 'niakuo', 'ngumo', 'githima', 'mugo', 'kenia', 'kihooto', 'maguta', 'maundu', 'mwathani', 'athuri', 'aciari', 'ciana', 'mwendwa', 'mwendwa', 'ngai', 'ngoma', 'muka', 'muru', 'nyina', 'baba', 'maitu', 'itu', 'witu', 'kuria', 'kuuga', 'kwenda', 'kwenda', 'gweta', 'gwikio', 'gwikio', 'kuhura', 'kuona', 'kuigua', 'kuigua', 'wendo', 'wendo', 'wathani', 'athani', 'athani', 'muhaka', 'muhaka', 'ikundi', 'ikundi', 'cakwa', 'cakwa', 'mwaki', 'maki', 'mai', 'maai', 'mwea', 'mwea', 'ugima', 'ugima', 'muoyo', 'muoyo', 'ngatha', 'ngatha', 'ngatha'];
  for (const word of kikuyuWords) {
    if (lowerText.includes(word)) return 'Kikuyu';
  }
  
  // Common English words/phrases
  const englishWords = ['the', 'and', 'you', 'lord', 'jesus', 'holy', 'spirit', 'amen', 'glory', 'praise', 'hallelujah', 'alleluia', 'god', 'father', 'son', 'savior', 'christ', 'king', 'heaven', 'earth', 'love', 'peace', 'joy', 'grace', 'mercy', 'faith', 'hope', 'prayer', 'worship', 'sing', 'song', 'hymn', 'bless', 'blessing', 'saviour', 'redeemer', 'trinity', 'majesty', 'kingdom', 'power', 'honor', 'glory', 'forever', 'ever', 'always', 'never', 'come', 'go', 'walk', 'stand', 'sit', 'heart', 'soul', 'mind', 'body', 'blood', 'cross', 'died', 'rose', 'alive'];
  let englishCount = 0;
  for (const word of englishWords) {
    if (lowerText.includes(' ' + word + ' ') || lowerText.startsWith(word + ' ') || lowerText.endsWith(' ' + word) || lowerText === word) {
      englishCount++;
    }
  }
  if (englishCount > 5) return 'English';
  
  // Default to Swahili
  return 'Swahili';
}

// Helper function to extract reference from text
function extractReference(text) {
  if (!text) return null;
  
  // Look for patterns like (AGJ 451/134), (NAGJ 188/52), (AGJ 295/85) etc.
  const matches = text.match(/\(([^)]+)\)/g);
  if (matches) {
    // Filter to only keep ones that look like references
    const references = matches.filter(m => 
      m.includes('AGJ') || m.includes('NAGJ') || m.includes('AGI') || m.includes('NAGI') || 
      m.includes('AG') || m.includes('NAG') ||
      m.includes('/') || /\d+/.test(m)
    );
    if (references.length > 0) {
      return references.join(' ').replace(/[()]/g, '');
    }
  }
  return null;
}

// Helper function to parse a VideoPsalm file
async function parseVideoPsalmFile(filePath, filename) {
  console.log(`📖 Reading: ${filename}...`);
  
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Extract the Songs array
    const songsMatch = content.match(/Songs:\[(.*)\]/s);
    if (!songsMatch) {
      console.log(`⚠️  No Songs array found in ${filename}`);
      return [];
    }
    
    // Split into individual song blocks
    const songBlocks = [];
    let depth = 0;
    let currentBlock = '';
    let inString = false;
    let escapeNext = false;
    
    for (let i = 0; i < songsMatch[1].length; i++) {
      const char = songsMatch[1][i];
      
      if (escapeNext) {
        currentBlock += char;
        escapeNext = false;
        continue;
      }
      
      if (char === '\\') {
        currentBlock += char;
        escapeNext = true;
        continue;
      }
      
      if (char === '"' && !escapeNext) {
        inString = !inString;
        currentBlock += char;
        continue;
      }
      
      if (!inString) {
        if (char === '{') {
          depth++;
          if (depth === 1 && currentBlock.trim()) {
            currentBlock = '';
          }
        } else if (char === '}') {
          depth--;
          if (depth === 0) {
            currentBlock += char;
            songBlocks.push(currentBlock);
            currentBlock = '';
            continue;
          }
        }
      }
      
      currentBlock += char;
    }
    
    console.log(`   Found ${songBlocks.length} songs in ${filename}`);
    
    const songs = [];
    
    for (let i = 0; i < songBlocks.length; i++) {
      try {
        const block = songBlocks[i];
        
        // Extract Text (title)
        const textMatch = block.match(/Text:"([^"]*)"/);
        let text = textMatch ? textMatch[1] : '';
        
        // Clean up the title
        let title = text.replace(/\([^)]+\)/g, '').trim();
        if (!title || title.length < 3) {
          // Try to get title from first verse
          const firstVerseMatch = block.match(/Text:"<[^>]*>([^<]+)/);
          title = firstVerseMatch ? firstVerseMatch[1].trim() : `Song from ${filename}`;
        }
        
        // Skip very short titles (likely garbage)
        if (title.length < 3) continue;
        
        // Extract reference
        const reference = extractReference(text) || extractReference(block);
        
        // Extract verses
        const verseMatches = block.matchAll(/Text:"([^"]*)"/g);
        const verses = [];
        let fullLyrics = '';
        
        for (const match of verseMatches) {
          // Skip the main Text field if it's just the title
          if (match[1] === text) continue;
          
          const verseText = stripTags(match[1]);
          if (verseText && verseText.length > 10) { // Ignore very short verses
            verses.push(verseText);
          }
        }
        
        // Build full lyrics with verse separation
        if (verses.length > 0) {
          fullLyrics = verses.join('\n\n');
        } else {
          // Fallback: use the whole block
          fullLyrics = stripTags(block);
        }
        
        // Skip if no real lyrics
        if (!fullLyrics || fullLyrics.length < 20) continue;
        
        // Detect language
        const language = detectLanguage(fullLyrics + ' ' + title, filename);
        
        songs.push({
          title: title.substring(0, 255),
          lyrics: fullLyrics.substring(0, 10000),
          reference: reference ? reference.substring(0, 255) : null,
          language: language
          // REMOVED: source field - not in schema
        });
        
      } catch (err) {
        // Skip problematic songs
      }
    }
    
    return songs;
    
  } catch (err) {
    console.log(`   ❌ Error reading ${filename}: ${err.message}`);
    return [];
  }
}

async function importAllSongbooks() {
  console.log('🎵 ========================================');
  console.log('🎵 IMPORTING ALL SONG BOOKS');
  console.log('🎵 ========================================\n');
  
  const backendDir = path.join(__dirname, '..');
  const othersDir = path.join(backendDir, 'others');
  
  // Get files from main backend directory
  let files = fs.readdirSync(backendDir)
    .filter(file => file.endsWith('.json'))
    .filter(file => !file.includes('package') && !file.includes('EQUITY') && !file.includes('node_modules'));
  
  // Check if others directory exists and add those files
  if (fs.existsSync(othersDir)) {
    const othersFiles = fs.readdirSync(othersDir)
      .filter(file => file.endsWith('.json'));
    
    // Add full paths for others files
    othersFiles.forEach(file => {
      files.push(path.join('others', file));
    });
    
    console.log(`📂 Found others folder with ${othersFiles.length} additional songbooks\n`);
  }
  
  console.log(`📚 Found ${files.length} songbook files:\n`);
  files.forEach(f => console.log(`   - ${f}`));
  console.log('\n');
  
  let totalImported = 0;
  let totalSkipped = 0;
  let totalErrors = 0;
  
  for (const file of files) {
    try {
      const filePath = path.join(backendDir, 'songbooks', file);
      const songs = await parseVideoPsalmFile(filePath, file);
      
      console.log(`\n📥 Importing from ${file}...`);
      
      let importedFromThisFile = 0;
      let skippedFromThisFile = 0;
      
      for (const song of songs) {
        try {
          // Check if song already exists (by title - approximate match)
          const existing = await prisma.song.findFirst({
            where: { 
              title: {
                equals: song.title,
                mode: 'insensitive'
              }
            }
          });
          
          if (existing) {
            skippedFromThisFile++;
            totalSkipped++;
            continue;
          }
          
          await prisma.song.create({
            data: song
          });
          
          importedFromThisFile++;
          totalImported++;
          
        } catch (err) {
          totalErrors++;
        }
      }
      
      console.log(`   ✅ Imported: ${importedFromThisFile} songs`);
      console.log(`   ⏭️  Skipped: ${skippedFromThisFile} songs (already exist)`);
      
    } catch (err) {
      console.log(`   ❌ Error processing ${file}: ${err.message}`);
      totalErrors++;
    }
  }
  
  console.log('\n' + '='.repeat(50));
  console.log('📊 FINAL IMPORT SUMMARY');
  console.log('='.repeat(50));
  console.log(`✅ Total Imported: ${totalImported} songs`);
  console.log(`⏭️  Total Skipped: ${totalSkipped} songs (already exist)`);
  console.log(`❌ Total Errors: ${totalErrors}`);
  
  // Show what's in the database now - FIXED: removed 'source' field
  const allSongs = await prisma.song.findMany({
    select: { 
      title: true, 
      language: true,
      reference: true
    },
    orderBy: { title: 'asc' }
  });
  
  // Group by language
  const byLanguage = {};
  allSongs.forEach(song => {
    const lang = song.language || 'Unknown';
    byLanguage[lang] = (byLanguage[lang] || 0) + 1;
  });
  
  console.log('\n📚 SONGS BY LANGUAGE:');
  Object.entries(byLanguage).forEach(([lang, count]) => {
    console.log(`   ${lang}: ${count} songs`);
  });
  
  // Show sample songs
  console.log('\n🎵 SAMPLE SONGS (first 10):');
  allSongs.slice(0, 10).forEach((song, index) => {
    console.log(`   ${index + 1}. ${song.title} ${song.reference ? `(${song.reference})` : ''} [${song.language || 'Unknown'}]`);
  });
  
  console.log('\n🎵 Import completed successfully!');
  
  await prisma.$disconnect();
}

// Run the import
importAllSongbooks().catch(console.error);
