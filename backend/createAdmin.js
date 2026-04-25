const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash("root123", 10);

  await prisma.user.create({
    data: {
      fullName: "Super Admin",
      email: "admin@zuca.com",
      password: hashedPassword,
      role: "admin",
    },
  });

  console.log("✅ Admin created successfully!");
}

main()
  .catch((e) => console.error(e))
  .finally(() => prisma.$disconnect());