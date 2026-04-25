// scripts/clean-song-commas.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function cleanCommas() {
  console.log('🧹 Starting comma cleanup...\n');
  
  try {
    console.time('⏱️ Total time');
    
    // Get all songs
    console.log('📥 Fetching all songs...');
    const songs = await prisma.song.findMany({
      select: {
        id: true,
        title: true,
        lyrics: true
      }
    });
    
    console.log(`📊 Total songs: ${songs.length}\n`);
    
    let updated = 0;
    let titleUpdated = 0;
    let lyricsUpdated = 0;
    
    // Process in batches
    const batchSize = 100;
    for (let i = 0; i < songs.length; i += batchSize) {
      const batch = songs.slice(i, i + batchSize);
      const updates = [];
      
      for (const song of batch) {
        let changed = false;
        let newTitle = song.title;
        let newLyrics = song.lyrics;
        
        // Clean title
        if (newTitle) {
          const cleanTitle = newTitle
            .replace(/^,\s*/, '')                    // Remove comma at start
            .replace(/\s*,\s*$/, '')                  // Remove comma at end
            .replace(/,{2,}/g, ',')                    // Fix multiple commas
            .replace(/\s*,\s*/g, ', ')                 // Normalize comma spacing
            .replace(/,\s*,/g, ',')                     // Remove empty commas
            .trim();
          
          if (cleanTitle !== newTitle) {
            newTitle = cleanTitle;
            changed = true;
            titleUpdated++;
          }
        }
        
        // Clean lyrics
        if (newLyrics) {
          let cleanLyrics = newLyrics
            // Fix commas at beginning of lines
            .replace(/^,\s*/gm, '')
            // Fix commas at end of lines
            .replace(/\s*,\s*$/gm, '')
            // Fix multiple commas
            .replace(/,{2,}/g, ',')
            // Normalize comma spacing (comma then space)
            .replace(/\s*,\s*/g, ', ')
            // Fix spaces before commas
            .replace(/\s+,/g, ',')
            // Remove empty lines with just commas
            .replace(/^\s*,\s*$/gm, '')
            // Clean up multiple blank lines
            .replace(/\n\s*\n\s*\n/g, '\n\n')
            .trim();
          
          if (cleanLyrics !== newLyrics) {
            newLyrics = cleanLyrics;
            changed = true;
            lyricsUpdated++;
          }
        }
        
        if (changed) {
          updates.push(
            prisma.song.update({
              where: { id: song.id },
              data: {
                title: newTitle,
                lyrics: newLyrics
              }
            })
          );
          updated++;
        }
      }
      
      // Execute batch updates in parallel
      if (updates.length > 0) {
        await Promise.all(updates);
      }
      
      // Show progress
      const percent = Math.min(100, Math.round(((i + batch.length) / songs.length) * 100));
      console.log(`   Progress: ${percent}% (${i + batch.length}/${songs.length} songs processed)`);
    }
    
    console.log('\n' + '='.repeat(50));
    console.log('📊 COMMA CLEANUP SUMMARY');
    console.log('='.repeat(50));
    console.log(`✅ Updated: ${updated} songs`);
    console.log(`   ├─ Titles cleaned: ${titleUpdated}`);
    console.log(`   └─ Lyrics cleaned: ${lyricsUpdated}`);
    console.log('='.repeat(50));
    console.timeEnd('⏱️ Total time');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the cleanup
cleanCommas().catch(console.error);