// prisma-scripts/backfillMembershipNumbers.js

const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function backfillMembershipNumbers() {
  try {
    console.log("Fetching users without membership numbers...");

    // Get users without a membership_number, ordered by createdAt
    const users = await prisma.user.findMany({
      where: { membership_number: null },
      orderBy: { createdAt: "asc" },
    });

    if (users.length === 0) {
      console.log("All users already have membership numbers.");
      return;
    }

    // Find the last assigned number to continue sequence
    const lastUserWithNumber = await prisma.user.findFirst({
      where: { membership_number: { not: null } },
      orderBy: { createdAt: "desc" },
    });

    let nextNumber = 1;

    if (lastUserWithNumber && lastUserWithNumber.membership_number) {
      // Extract numeric part from something like Z#012
      const match = lastUserWithNumber.membership_number.match(/Z#(\d+)/);
      if (match) {
        nextNumber = parseInt(match[1], 10) + 1;
      }
    }

    console.log(`Starting sequence from Z#${String(nextNumber).padStart(3, "0")}`);

    for (const user of users) {
      const membershipNumber = `Z#${String(nextNumber).padStart(3, "0")}`;
      await prisma.user.update({
        where: { id: user.id },
        data: { membership_number: membershipNumber },
      });

      console.log(`Assigned ${membershipNumber} to ${user.fullName}`);
      nextNumber++;
    }

    console.log("Backfill complete!");
  } catch (error) {
    console.error("Error backfilling membership numbers:", error);
  } finally {
    await prisma.$disconnect();
  }
}

backfillMembershipNumbers();