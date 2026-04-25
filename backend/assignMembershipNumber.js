// backend/assignMembershipNumber.js
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Middleware to auto-assign membership_number
prisma.$use(async (params, next) => {
  // Only trigger for User creation
  if (params.model === "User" && params.action === "create") {
    // Find the last assigned membership number
    const lastUser = await prisma.user.findFirst({
      orderBy: { createdAt: "desc" },
      where: { membership_number: { not: null } },
    });

    let nextNumber = "Z#001"; // Default start
    if (lastUser && lastUser.membership_number) {
      const lastNum = parseInt(lastUser.membership_number.replace("Z#", ""), 10);
      const nextNum = (lastNum + 1).toString().padStart(3, "0");
      nextNumber = `Z#${nextNum}`;
    }

    // Assign the next membership number automatically
    params.args.data.membership_number = nextNumber;
  }

  return next(params);
});

export default prisma;