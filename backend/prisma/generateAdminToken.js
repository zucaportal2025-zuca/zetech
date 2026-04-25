// prisma/generateAdminToken.js
import jwt from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const SECRET = process.env.JWT_SECRET || "your_jwt_secret";

async function main() {
  const admin = await prisma.user.findUnique({
    where: { email: "admin2@zuca.com" },
  });

  if (!admin) {
    console.log("Admin not found");
    return;
  }

  const token = jwt.sign(
    { userId: admin.id, email: admin.email, role: admin.role },
    SECRET,
    { expiresIn: "365d" }
  );

  console.log("New Admin JWT:", token);
}

main().finally(() => prisma.$disconnect());