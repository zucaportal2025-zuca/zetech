const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding executive positions...');

  const positions = [
    // Leadership (Level 1-5)
    { title: "Chairperson", level: 1, category: "leadership", description: "Overall ZUCA leader - oversees all activities and represents ZUCA" },
    { title: "Vice Chairperson", level: 2, category: "leadership", description: "Deputy ZUCA leader - assists chairperson and leads in their absence" },
    { title: "Secretary", level: 3, category: "leadership", description: "Records and communications - manages documentation and correspondence" },
    { title: "Vice Secretary", level: 4, category: "leadership", description: "Assistant secretary - supports secretary in documentation duties" },
    { title: "Treasurer", level: 5, category: "leadership", description: "Financial management - handles budgets, collections, and expenses" },
    
    // Choir (Level 6-7)
    { title: "Choir Moderator", level: 6, category: "choir", description: "Choir coordinator - leads the St. Kizito Choir" },
    { title: "Vice Choir Moderator", level: 7, category: "choir", description: "Assistant choir coordinator - supports choir moderator" },
    
    // Jumuia Moderators (Level 8)
    { title: "St. Michael Moderator", level: 8, category: "jumuia", description: "St. Michael Jumuia leader - coordinates activities for St. Michael group" },
    { title: "St. Benedict Moderator", level: 8, category: "jumuia", description: "St. Benedict Jumuia leader - coordinates activities for St. Benedict group" },
    { title: "St. Peregrine Moderator", level: 8, category: "jumuia", description: "St. Peregrine Jumuia leader - coordinates activities for St. Peregrine group" },
    { title: "Christ the King Moderator", level: 8, category: "jumuia", description: "Christ the King Jumuia leader - coordinates activities for Christ the King group" },
    { title: "St. Gregory Moderator", level: 8, category: "jumuia", description: "St. Gregory Jumuia leader - coordinates activities for St. Gregory group" },
    { title: "St. Pacificus Moderator", level: 8, category: "jumuia", description: "St. Pacificus Jumuia leader - coordinates activities for St. Pacificus group" },
    
    // Media (Level 9)
    { title: "Media Moderator", level: 9, category: "media", description: "Graphics and media department - manages photos, videos, and social media" },
    
    // Voice Representatives (Level 10)
    { title: "BASS Voice Rep", level: 10, category: "voice", description: "BASS section leader - coordinates BASS voice section" },
    { title: "TENOR Voice Rep", level: 10, category: "voice", description: "TENOR section leader - coordinates TENOR voice section" },
    { title: "ALTO Voice Rep", level: 10, category: "voice", description: "ALTO section leader - coordinates ALTO voice section" },
    { title: "SOPRANO Voice Rep", level: 10, category: "voice", description: "SOPRANO section leader - coordinates SOPRANO voice section" }
  ];

  for (const position of positions) {
    await prisma.executivePosition.upsert({
      where: { title: position.title },
      update: {},
      create: position
    });
    console.log(`✅ Created/Updated: ${position.title}`);
  }

  console.log('🎉 Executive positions seeded successfully!');
}

main()
  .catch(e => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });