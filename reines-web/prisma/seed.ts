/**
 * Prisma seed script.
 *
 * Run once to populate the database with an admin account and demo data:
 *   npx prisma db seed
 *
 * Safe to re-run — uses upsert so existing records are updated, not duplicated.
 */

import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma  = new PrismaClient({ adapter });

const SALT_ROUNDS = 12;

async function hash(plain: string) {
  return bcrypt.hash(plain, SALT_ROUNDS);
}

async function main() {
  console.log("🌱  Seeding database…\n");

  // ─── Admin ──────────────────────────────────────────────────────────────────

  const adminPassword = await hash("superadmin123");

  const admin = await prisma.user.upsert({
    where:  { email: "reines.admin1@gmail.com" },
    update: { name: "Reines Admin", password: adminPassword, role: "ADMIN" },
    create: {
      name:     "Reines Admin",
      email:    "reines.admin1@gmail.com",
      password: adminPassword,
      role:     "ADMIN",
    },
  });

  console.log(`✅  Admin     → ${admin.email}`);

  // ─── Demo Project Manager ───────────────────────────────────────────────────

  const managerPassword = await hash("Manager123!");

  const manager = await prisma.user.upsert({
    where:  { email: "samuel.phiri@reines.co.mw" },
    update: { name: "Samuel Phiri", password: managerPassword, role: "PROJECT_MANAGER" },
    create: {
      name:     "Samuel Phiri",
      email:    "samuel.phiri@reines.co.mw",
      password: managerPassword,
      role:     "PROJECT_MANAGER",
    },
  });

  console.log(`✅  Manager   → ${manager.email}  (password: Manager123!)`);

  // ─── Demo Client ────────────────────────────────────────────────────────────

  const clientPassword = await hash("Client123!");

  const client = await prisma.user.upsert({
    where:  { email: "demo.client@example.com" },
    update: { name: "Demo Client", password: clientPassword, role: "CLIENT" },
    create: {
      name:     "Demo Client",
      email:    "demo.client@example.com",
      password: clientPassword,
      role:     "CLIENT",
    },
  });

  console.log(`✅  Client    → ${client.email}  (password: Client123!)`);

  // ─── Demo Project ────────────────────────────────────────────────────────────

  const project = await prisma.project.upsert({
    where:  { id: "seed-project-001" },
    update: {
      title:       "Chichiri Residential Complex",
      description: "Construction of a 4-bedroom residential home with double garage, covered veranda, and landscaped gardens.",
      status:      "IN_PROGRESS",
      budget:      2_600_000,
      clientId:    client.id,
      managerId:   manager.id,
      startDate:   new Date("2026-03-01"),
      endDate:     new Date("2026-09-30"),
    },
    create: {
      id:          "seed-project-001",
      title:       "Chichiri Residential Complex",
      description: "Construction of a 4-bedroom residential home with double garage, covered veranda, and landscaped gardens.",
      status:      "IN_PROGRESS",
      budget:      2_600_000,
      clientId:    client.id,
      managerId:   manager.id,
      startDate:   new Date("2026-03-01"),
      endDate:     new Date("2026-09-30"),
    },
  });

  console.log(`✅  Project   → "${project.title}"`);

  // ─── Demo Gallery Updates ───────────────────────────────────────────────────

  const updates = [
    {
      id:        "seed-update-001",
      note:      "Foundation work completed. All footings poured and cured ahead of schedule. Structural inspection passed.",
      imageUrl:  null,
      createdAt: new Date("2026-03-20"),
    },
    {
      id:        "seed-update-002",
      note:      "Brick-laying on ground floor walls is 60% complete. Working through the garage and main bedroom wing.",
      imageUrl:  null,
      createdAt: new Date("2026-04-15"),
    },
    {
      id:        "seed-update-003",
      note:      "Roof trusses delivered and installation started. Estimated completion of roofing in 2 weeks.",
      imageUrl:  null,
      createdAt: new Date("2026-05-10"),
    },
  ];

  for (const u of updates) {
    await prisma.projectUpdate.upsert({
      where:  { id: u.id },
      update: { note: u.note, imageUrl: u.imageUrl },
      create: { ...u, projectId: project.id },
    });
  }

  console.log(`✅  Updates   → ${updates.length} demo progress updates added`);

  // ─── Demo Messages ───────────────────────────────────────────────────────────

  const messages = [
    {
      id:        "seed-msg-001",
      message:   "Hello! I can see the foundation is complete — it looks great. When do you expect the walls to be finished?",
      senderId:  client.id,
      createdAt: new Date("2026-04-16T09:00:00Z"),
    },
    {
      id:        "seed-msg-002",
      message:   "Good morning! We expect ground floor walls to be done by end of April. We're making excellent progress. I'll post photos this week.",
      senderId:  manager.id,
      createdAt: new Date("2026-04-16T10:30:00Z"),
    },
  ];

  for (const m of messages) {
    await prisma.message.upsert({
      where:  { id: m.id },
      update: { message: m.message },
      create: { ...m, projectId: project.id },
    });
  }

  console.log(`✅  Messages  → ${messages.length} demo chat messages added`);

  // ─── Summary ─────────────────────────────────────────────────────────────────

  console.log(`
─────────────────────────────────────────────
  Seed complete. Login credentials:

  ADMIN
    Email    : reines.admin1@gmail.com
    Password : superadmin123

  PROJECT MANAGER
    Email    : samuel.phiri@reines.co.mw
    Password : Manager123!

  CLIENT
    Email    : demo.client@example.com
    Password : Client123!
─────────────────────────────────────────────
  `);
}

main()
  .catch((e) => {
    console.error("❌  Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
