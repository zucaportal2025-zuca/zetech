// scripts/merge-duplicate-songs.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Function to normalize titles for comparison
function normalizeTitle(title) {
  return title
    .toLowerCase()
    .replace(/<[^>]*>/g, '')
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

async function mergeDuplicates() {
  console.log('🔄 Starting duplicate merge (OPTIMIZED)...\n');
  
  try {
    console.time('⏱️ Total time');
    
    // Get ALL songs at once (more efficient)
    console.log('📥 Fetching all songs...');
    console.time('⏱️ Fetch time');
    const allSongs = await prisma.song.findMany({
      orderBy: { createdAt: 'asc' }
    });
    console.timeEnd('⏱️ Fetch time');
    
    console.log(`📊 Total songs: ${allSongs.length}\n`);
    
    // Group ALL songs by normalized title in memory
    console.log('🔄 Grouping songs...');
    console.time('⏱️ Grouping time');
    const groups = {};
    for (const song of allSongs) {
      const normTitle = normalizeTitle(song.title);
      if (!groups[normTitle]) {
        groups[normTitle] = [];
      }
      groups[normTitle].push(song);
    }
    console.timeEnd('⏱️ Grouping time');
    
    console.log(`📌 Found ${Object.keys(groups).length} unique titles\n`);
    
    // Find groups with duplicates
    const duplicateGroups = Object.entries(groups).filter(([_, list]) => list.length > 1);
    console.log(`🔍 Found ${duplicateGroups.length} titles with duplicates\n`);
    
    let kept = 0;
    let deleted = 0;
    let updated = 0;
    
    // Process duplicates in parallel batches
    console.log('🔄 Processing duplicates...');
    console.time('⏱️ Processing time');
    
    const batchSize = 100;
    for (let i = 0; i < duplicateGroups.length; i += batchSize) {
      const batch = duplicateGroups.slice(i, i + batchSize);
      
      // Process batch in parallel
      await Promise.all(batch.map(async ([normTitle, group]) => {
        // Sort by quality (prefer songs with lyrics, then newer)
        group.sort((a, b) => {
          if (a.lyrics && !b.lyrics) return -1;
          if (!a.lyrics && b.lyrics) return 1;
          return new Date(b.createdAt) - new Date(a.createdAt);
        });
        
        const keep = group[0];
        const toDelete = group.slice(1);
        
        // Merge best data
        let bestLyrics = keep.lyrics || '';
        let bestReference = keep.reference;
        let needsUpdate = false;
        
        for (const dup of toDelete) {
          if (dup.lyrics && (!bestLyrics || dup.lyrics.length > bestLyrics.length)) {
            bestLyrics = dup.lyrics;
            needsUpdate = true;
          }
          if (dup.reference && !bestReference) {
            bestReference = dup.reference;
            needsUpdate = true;
          }
        }
        
        // Update if needed
        if (needsUpdate) {
          await prisma.song.update({
            where: { id: keep.id },
            data: {
              lyrics: bestLyrics,
              reference: bestReference
            }
          });
          updated++;
        }
        
        // Delete duplicates
        if (toDelete.length > 0) {
          await prisma.song.deleteMany({
            where: {
              id: {
                in: toDelete.map(d => d.id)
              }
            }
          });
          deleted += toDelete.length;
        }
        
        kept++;
      }));
      
      // Show progress
      const percent = Math.min(100, Math.round(((i + batch.length) / duplicateGroups.length) * 100));
      console.log(`   Progress: ${percent}% (${i + batch.length}/${duplicateGroups.length} groups processed)`);
    }
    
    console.timeEnd('⏱️ Processing time');
    
    const finalTotal = await prisma.song.count();
    
    console.log('\n' + '='.repeat(50));
    console.log('📊 MERGE SUMMARY');
    console.log('='.repeat(50));
    console.log(`✅ Kept: ${kept} unique songs`);
    console.log(`🗑️  Deleted: ${deleted} duplicates`);
    console.log(`✏️  Updated: ${updated} songs with better data`);
    console.log(`📈 Original: ${allSongs.length} → Final: ${finalTotal}`);
    console.log('='.repeat(50));
    console.timeEnd('⏱️ Total time');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the merge
mergeDuplicates().catch(console.error);