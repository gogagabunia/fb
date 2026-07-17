#!/usr/bin/env node
// Seed the local database with enough data to exercise the marketplace UI.
//   node .claude/skills/run-groupmarket/seed.mjs
// Idempotent: safe to re-run.

import { PrismaClient, PostStatus, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const CATEGORIES = [
  { name: 'Vehicles', slug: 'vehicles' },
  { name: 'Electronics', slug: 'electronics' },
  { name: 'Furniture', slug: 'furniture' },
];

const LISTINGS = [
  {
    title: '2016 Toyota Camry SE — 78k miles',
    price: 12500,
    category: 'vehicles',
    location: 'Tbilisi',
    description: 'One owner, clean title, new tires. Highway miles, no accidents.',
    specs: { make: 'Toyota', model: 'Camry', year: 2016, mileage: 78000 },
    author: 'Nino B.',
  },
  {
    title: 'MacBook Pro 14" M3 — 512GB',
    price: 1450,
    category: 'electronics',
    location: 'Batumi',
    description: 'AppleCare until 2027. Battery cycle count 82. Box included.',
    specs: { brand: 'Apple', ram: '18GB', storage: '512GB' },
    author: 'Giorgi K.',
  },
  {
    title: 'Oak dining table + 6 chairs',
    price: 320,
    category: 'furniture',
    location: 'Kutaisi',
    description: 'Solid oak, seats six. Minor scratch on one leg, otherwise great.',
    specs: { material: 'Oak', seats: 6 },
    author: 'Ana M.',
  },
];

const user = await prisma.user.upsert({
  where: { email: 'admin@groupmarket.local' },
  update: {},
  create: {
    email: 'admin@groupmarket.local',
    passwordHash: await bcrypt.hash('password123', 10),
    firstName: 'Local',
    lastName: 'Admin',
    role: Role.ADMIN,
  },
});

const group = await prisma.facebookGroup.upsert({
  where: { groupId: 'local-demo-group' },
  update: {},
  create: {
    groupId: 'local-demo-group',
    name: 'Demo Marketplace Group',
    url: 'https://facebook.com/groups/local-demo-group',
    isPublic: true,
    adminVerified: true,
    adminVerifiedAt: new Date(),
    keywords: ['car', 'laptop'],
    userId: user.id,
  },
});

for (const cat of CATEGORIES) {
  await prisma.category.upsert({
    where: { slug: cat.slug },
    update: {},
    create: cat,
  });
}

for (const [i, l] of LISTINGS.entries()) {
  const category = await prisma.category.findUniqueOrThrow({ where: { slug: l.category } });
  const post = await prisma.importedPost.upsert({
    where: { fbPostId: `local-post-${i}` },
    update: {},
    create: {
      fbPostId: `local-post-${i}`,
      rawText: `${l.title}\n\n${l.description}\n\nPrice: ${l.price}`,
      images: [],
      authorName: l.author,
      authorProfile: 'https://facebook.com/demo',
      priceScraped: l.price,
      status: PostStatus.APPROVED,
      groupId: group.id,
      userId: user.id,
    },
  });

  await prisma.listing.upsert({
    where: { importedPostId: post.id },
    update: {},
    create: {
      title: l.title,
      price: l.price,
      description: l.description,
      images: [],
      location: l.location,
      category: l.category,
      specs: l.specs,
      originalPostUrl: `https://facebook.com/groups/local-demo-group/posts/${i}`,
      contactUrl: 'https://m.me/demo',
      importedPostId: post.id,
      categoryId: category.id,
    },
  });
}

// A pending post so the admin review queue has something in it.
await prisma.importedPost.upsert({
  where: { fbPostId: 'local-post-pending' },
  update: {},
  create: {
    fbPostId: 'local-post-pending',
    rawText: 'Selling a mountain bike, barely used. 450 GEL.',
    images: [],
    authorName: 'Luka T.',
    priceScraped: 450,
    status: PostStatus.PENDING,
    groupId: group.id,
    userId: user.id,
  },
});

const counts = {
  users: await prisma.user.count(),
  listings: await prisma.listing.count(),
  pendingPosts: await prisma.importedPost.count({ where: { status: PostStatus.PENDING } }),
};
console.log('seeded:', JSON.stringify(counts));
console.log('login: admin@groupmarket.local / password123');
await prisma.$disconnect();
