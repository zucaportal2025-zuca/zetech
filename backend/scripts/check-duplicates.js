const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkDuplicates() {
  // Get all songs
  const songs = await prisma.song.findMany({
    select: { title: true, id: true }
  });
  
  console.log(`Total songs: ${songs.length}\n`);
  
  // Group by title (case insensitive)
  const groups = {};
  songs.forEach(song => {
    const key = song.title.toLowerCase().trim();
    if (!groups[key]) groups[key] = [];
    groups[key].push(song);
  });
  
  // Show duplicates
  let duplicateCount = 0;
  Object.entries(groups).forEach(([title, list]) => {
    if (list.length > 1) {
      duplicateCount++;
      console.log(`\n📌 "${title.substring(0, 50)}..." has ${list.length} copies:`);
      list.forEach(s => console.log(`   - ${s.title.substring(0, 60)}`));
    }
  });
  
  console.log(`\n📊 Found ${duplicateCount} titles with duplicates`);
  
  await prisma.$disconnect();
}

checkDuplicates();