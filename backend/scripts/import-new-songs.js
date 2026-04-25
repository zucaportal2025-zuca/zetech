// scripts/import-new-songs.js
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

// Helper function to clean HTML/XML tags
function stripTags(str) {
  if (!str) return '';
  return str.replace(/<[^>]*>/g, '').trim();
}

// Helper function to extract reference from text
function extractReference(text) {
  if (!text) return null;
  const matches = text.match(/\(([^)]+)\)/g);
  if (matches) {
    const references = matches.filter(m => 
      m.includes('AGJ') || m.includes('NAGJ') || m.includes('AGI') || m.includes('NAGI') || 
      m.includes('AG') || m.includes('NAG') || m.includes('/') || /\d+/.test(m)
    );
    if (references.length > 0) {
      return references.join(' ').replace(/[()]/g, '');
    }
  }
  return null;
}

// Helper function to parse VideoPsalm file
async function parseVideoPsalmFile(filePath, filename) {
  console.log(`📖 Reading: ${filename}...`);
  
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const songsMatch = content.match(/Songs:\[(.*)\]/s);
    if (!songsMatch) {
      console.log(`⚠️  No Songs array found in ${filename}`);
      return [];
    }
    
    // Parse song blocks (same as before)
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
        
        // Extract title
        const textMatch = block.match(/Text:"([^"]*)"/);
        let text = textMatch ? textMatch[1] : '';
        let title = text.replace(/\([^)]+\)/g, '').trim();
        
        if (!title || title.length < 3) {
          const firstVerseMatch = block.match(/Text:"<[^>]*>([^<]+)/);
          title = firstVerseMatch ? firstVerseMatch[1].trim() : `Song from ${filename}`;
        }
        
        if (title.length < 3) continue;
        
        // Extract reference
        const reference = extractReference(text) || extractReference(block);
        
        // Extract verses
        const verseMatches = block.matchAll(/Text:"([^"]*)"/g);
        const verses = [];
        let fullLyrics = '';
        
        for (const match of verseMatches) {
          if (match[1] === text) continue;
          const verseText = stripTags(match[1]);
          if (verseText && verseText.length > 10) {
            verses.push(verseText);
          }
        }
        
        if (verses.length > 0) {
          fullLyrics = verses.join('\n\n');
        } else {
          fullLyrics = stripTags(block);
        }
        
        if (!fullLyrics || fullLyrics.length < 20) continue;
        
        songs.push({
          title: title.substring(0, 255),
          lyrics: fullLyrics.substring(0, 10000),
          reference: reference ? reference.substring(0, 255) : null
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

async function importNewSongs() {
  console.log('🎵 ========================================');
  console.log('🎵 IMPORTING NEW SONGS ONLY');
  console.log('🎵 ========================================\n');
  
  // Get all existing songs from database for quick lookup
  console.log('📚 Fetching existing songs from database...');
  const existingSongs = await prisma.song.findMany({
    select: { 
      title: true,
      lyrics: true 
    }
  });
  
  // Create a Set of existing song titles (lowercase for comparison)
  const existingTitles = new Set(
    existingSongs.map(s => s.title.toLowerCase().trim())
  );
  
  // Also store lyrics for content-based matching
  const existingLyrics = new Map();
  existingSongs.forEach(s => {
    if (s.lyrics) {
      // Store first 100 chars as signature
      const signature = s.lyrics.substring(0, 100).replace(/\s+/g, ' ').trim();
      existingLyrics.set(signature, true);
    }
  });
  
  console.log(`📊 Found ${existingTitles.size} existing songs in database\n`);
  
  // Get all JSON files from songbooks folder
  const songbooksDir = path.join(__dirname, '../songbooks');
  const files = fs.readdirSync(songbooksDir)
    .filter(file => file.endsWith('.json'));
  
  console.log(`📚 Found ${files.length} songbook files to check:\n`);
  files.forEach(f => console.log(`   - ${f}`));
  console.log('\n');
  
  let totalNew = 0;
  let totalDuplicates = 0;
  let totalErrors = 0;
  
  for (const file of files) {
    try {
      const filePath = path.join(songbooksDir, file);
      const songs = await parseVideoPsalmFile(filePath, file);
      
      console.log(`\n📥 Checking ${file} for new songs...`);
      
      let newFromThisFile = 0;
      let duplicatesFromThisFile = 0;
      
      for (const song of songs) {
        try {
          // Check by title (case insensitive)
          const titleExists = existingTitles.has(song.title.toLowerCase().trim());
          
          // If title exists, check if it's really the same song by content
          if (titleExists) {
            // Create signature of new song's lyrics
            const newSignature = song.lyrics?.substring(0, 100).replace(/\s+/g, ' ').trim();
            
            // If lyrics signature matches, it's a duplicate
            if (newSignature && existingLyrics.has(newSignature)) {
              duplicatesFromThisFile++;
              totalDuplicates++;
              continue;
            }
          }
          
          // If we get here, it's a new song
          await prisma.song.create({
            data: song
          });
          
          // Add to our lookup sets
          existingTitles.add(song.title.toLowerCase().trim());
          if (song.lyrics) {
            const signature = song.lyrics.substring(0, 100).replace(/\s+/g, ' ').trim();
            existingLyrics.set(signature, true);
          }
          
          newFromThisFile++;
          totalNew++;
          console.log(`   ✅ New: ${song.title}`);
          
        } catch (err) {
          totalErrors++;
        }
      }
      
      console.log(`   📊 Results from ${file}:`);
      console.log(`      ✅ New: ${newFromThisFile} songs`);
      console.log(`      ⏭️  Duplicates: ${duplicatesFromThisFile} songs`);
      
    } catch (err) {
      console.log(`   ❌ Error processing ${file}: ${err.message}`);
      totalErrors++;
    }
  }
  
  console.log('\n' + '='.repeat(50));
  console.log('📊 FINAL IMPORT SUMMARY');
  console.log('='.repeat(50));
  console.log(`✅ New songs imported: ${totalNew}`);
  console.log(`⏭️  Duplicates skipped: ${totalDuplicates}`);
  console.log(`❌ Errors: ${totalErrors}`);
  console.log('='.repeat(50));
  
  await prisma.$disconnect();
}

// Run the import
importNewSongs().catch(console.error);