const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function uploadSongs() {
  try {
    // Get all JSON files from the songbooks folder
    const songsDir = path.join(__dirname, '../songbooks');
    
    if (!fs.existsSync(songsDir)) {
      console.error('❌ songbooks folder not found!');
      console.log('Creating songbooks folder...');
      fs.mkdirSync(songsDir, { recursive: true });
      console.log('✅ Created songbooks folder. Add your JSON files there and run again.');
      return;
    }

    const files = fs.readdirSync(songsDir).filter(f => f.endsWith('.json'));
    
    if (files.length === 0) {
      console.log('📂 No JSON files found in songbooks folder');
      console.log('Please add your song files (e.g., KWIHOTA.json) to:');
      console.log(songsDir);
      return;
    }

    console.log(`📂 Found ${files.length} file(s) to process\n`);

    let totalUploaded = 0;
    let totalSkipped = 0;
    let totalErrors = 0;

    // Process each file
    for (const file of files) {
      const filePath = path.join(songsDir, file);
      console.log(`📖 Reading: ${file}`);
      
      try {
        const jsonData = fs.readFileSync(filePath, 'utf8');
        const songs = JSON.parse(jsonData);
        
        console.log(`   Found ${songs.length} songs in this file`);

        let uploaded = 0;
        let skipped = 0;
        let errors = 0;

        // Upload each song
        for (const song of songs) {
          try {
            // Check if song already exists
            const existing = await prisma.song.findFirst({
              where: {
                title: {
                  equals: song.title,
                  mode: 'insensitive'
                }
              }
            });

            if (existing) {
              skipped++;
              continue;
            }

            // Upload new song
            await prisma.song.create({
              data: {
                title: song.title,
                composer: song.composer || null,
                lyrics: song.lyrics || null,
                reference: song.reference || null
              }
            });

            uploaded++;
            
            // Show progress
            if (uploaded % 10 === 0) {
              process.stdout.write('.');
            }

          } catch (err) {
            errors++;
            console.error(`\n❌ Error uploading "${song.title}":`, err.message);
          }
        }

        console.log(`\n   ✅ Uploaded: ${uploaded} new songs`);
        console.log(`   ⏭️  Skipped: ${skipped} (already exist)`);
        console.log(`   ❌ Errors: ${errors}\n`);

        totalUploaded += uploaded;
        totalSkipped += skipped;
        totalErrors += errors;

      } catch (err) {
        console.error(`❌ Error reading file ${file}:`, err.message);
      }
    }

    // Summary
    console.log('='.repeat(50));
    console.log('📊 UPLOAD SUMMARY');
    console.log('='.repeat(50));
    console.log(`✅ Total new songs uploaded: ${totalUploaded}`);
    console.log(`⏭️  Total skipped (already exist): ${totalSkipped}`);
    console.log(`❌ Total errors: ${totalErrors}`);
    console.log('='.repeat(50));

  } catch (err) {
    console.error('❌ Fatal error:', err);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the upload
uploadSongs();