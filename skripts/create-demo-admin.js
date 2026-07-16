#!/usr/bin/env node
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

const emailArg = process.argv[2] || process.env.ADMIN_EMAIL || "admin@buildmarket.demo";
const passwordArg = process.argv[3] || process.env.ADMIN_PASSWORD || "Admin123!";
const nameArg = process.argv[4] || process.env.ADMIN_NAME || "Demo Admin";

async function main() {
  if (!emailArg) {
    throw new Error("Email is required for admin creation");
  }

  if (!passwordArg || passwordArg.length < 6) {
    throw new Error("Password must be at least 6 characters");
  }

  const email = String(emailArg).toLowerCase();
  const passwordHash = await bcrypt.hash(String(passwordArg), 10);
  const name = nameArg ? String(nameArg) : null;

  const user = await prisma.user.upsert({
    where: { email },
    update: {
      name,
      role: "ADMIN",
      passwordHash,
    },
    create: {
      name,
      email,
      role: "ADMIN",
      passwordHash,
    },
  });

  console.log(`Admin account ready: ${user.email}`);
}

main()
  .catch((error) => {
    console.error("Failed to create admin:", error.message || error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
