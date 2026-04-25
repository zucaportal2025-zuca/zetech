const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("adminpassword", 10);

  const admin = await prisma.user.upsert({
    where: { email: "admin@zuca.com" },
    update: { password: passwordHash, role: "admin" },
    create: {
      fullName: "Admin User",
      email: "admin@zuca.com",
      password: passwordHash,
      role: "admin",
    },
  });

  console.log("Admin created/updated:", admin);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());