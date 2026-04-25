const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const email = "admin2@zuca.com"; // The admin email you created

  const updated = await prisma.user.update({
    where: { email },
    data: { role: "ADMIN" }, // Ensure the role is correct
  });

  console.log("Admin role fixed for user:", updated.email);
}

main()
  .catch((e) => console.error(e))
  .finally(() => prisma.$disconnect());