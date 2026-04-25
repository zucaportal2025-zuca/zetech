// scripts/clean-song-titles.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Function to strip HTML tags
function stripHtmlTags(str) {
  if (!str) return '';
  return str.replace(/<[^>]*>/g, '').trim();
}

// Function to clean lyrics (remove tags but keep formatting)
function cleanLyrics(lyrics) {
  if (!lyrics) return '';
  
  // Remove all HTML tags but preserve line breaks
  let cleaned = lyrics.replace(/<[^>]*>/g, '');
  
  // Clean up multiple blank lines
  cleaned = cleaned.replace(/\n\s*\n\s*\n/g, '\n\n');
  
  return cleaned.trim();
}

async function cleanAllSongs() {
  console.log('🎵 Starting to clean all songs...');
  
  try {
    // Get all songs
    const songs = await prisma.song.findMany();
    console.log(`Found ${songs.length} songs to clean`);
    
    let updated = 0;
    let skipped = 0;
    
    for (const song of songs) {
      const originalTitle = song.title;
      const originalLyrics = song.lyrics;
      
      const cleanTitle = stripHtmlTags(originalTitle);
      const cleanLyricsText = cleanLyrics(originalLyrics);
      
      // Only update if something changed
      if (cleanTitle !== originalTitle || cleanLyricsText !== originalLyrics) {
        await prisma.song.update({
          where: { id: song.id },
          data: {
            title: cleanTitle,
            lyrics: cleanLyricsText
          }
        });
        updated++;
        console.log(`✅ Updated: ${originalTitle.substring(0, 30)}... → ${cleanTitle.substring(0, 30)}...`);
      } else {
        skipped++;
      }
    }
    
    console.log('\n🎉 Cleanup complete!');
    console.log(`📊 Results:`);
    console.log(`   - Updated: ${updated} songs`);
    console.log(`   - Skipped: ${skipped} songs (already clean)`);
    
  } catch (error) {
    console.error('❌ Error cleaning songs:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the cleanup
cleanAllSongs();