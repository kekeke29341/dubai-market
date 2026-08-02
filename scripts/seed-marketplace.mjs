#!/usr/bin/env node
/**
 * Seed Dubai Market with users, generated product images, and listings.
 *
 * Usage (Node 22+):
 *   node scripts/seed-marketplace.mjs
 *   node scripts/seed-marketplace.mjs --reset   # delete previous seed items first
 *
 * Requires .env.local with NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY
 */

import { createClient } from '@supabase/supabase-js'
import { createHash } from 'crypto'
import { existsSync, readFileSync } from 'fs'
import { mkdir, readFile, writeFile } from 'fs/promises'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'
import sharp from 'sharp'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const CACHE_DIR = join(__dirname, '.seed-cache')
const SEED_TAG = 'seed-v1'

const LOCATIONS = [
  'Dubai Marina',
  'JBR, Dubai',
  'Downtown Dubai',
  'Business Bay',
  'Jumeirah',
  'Al Quoz',
  'Dubai Hills',
  'Palm Jumeirah',
  'DIFC',
  'Arabian Ranches',
  'Mirdif',
  'Motor City',
  'JLT',
  'Deira',
]

const CONDITIONS = ['new', 'like_new', 'good', 'fair']

const CATEGORY = {
  electronics: 1,
  fashion: 2,
  home: 3,
  sports: 4,
  vehicles: 5,
  books: 6,
  toys: 7,
  art: 8,
  beauty: 9,
  other: 10,
}

const PALETTES = {
  electronics: ['#0f172a', '#1e293b', '#38bdf8', '#e2e8f0'],
  fashion: ['#1c1917', '#44403c', '#f43f5e', '#fafaf9'],
  home: ['#14532d', '#166534', '#a3e635', '#f7fee7'],
  sports: ['#172554', '#1d4ed8', '#facc15', '#eff6ff'],
  vehicles: ['#111827', '#374151', '#f97316', '#f3f4f6'],
  books: ['#3b0764', '#6b21a8', '#fbbf24', '#faf5ff'],
  toys: ['#831843', '#db2777', '#67e8f9', '#fdf2f8'],
  art: ['#422006', '#92400e', '#fde68a', '#fffbeb'],
  beauty: ['#4c0519', '#9f1239', '#fda4af', '#fff1f2'],
  other: ['#1e3a5f', '#0ea5e9', '#f8fafc', '#e0f2fe'],
}

const SELLERS = [
  {
    email: 'alice@dubai-market.test',
    password: 'SeedPass123!',
    username: 'alice_dubai',
    full_name: 'Alice Al Mansoori',
    bio: 'Power seller in Dubai Marina. Electronics & gadgets specialist.',
    location: 'Dubai Marina',
    rating: 4.9,
    reviews_count: 47,
    is_admin: true,
    accent: '#38bdf8',
  },
  {
    email: 'bob@dubai-market.test',
    password: 'SeedPass123!',
    username: 'bob_trades',
    full_name: 'Bob Ibrahim',
    bio: 'Quality pre-owned finds. Same-day meetup in JBR.',
    location: 'JBR, Dubai',
    rating: 4.6,
    reviews_count: 23,
    accent: '#f97316',
  },
  {
    email: 'carol@dubai-market.test',
    password: 'SeedPass123!',
    username: 'carol_jbr',
    full_name: 'Carol Smith',
    bio: 'Fashion & lifestyle from Downtown Dubai.',
    location: 'Downtown Dubai',
    rating: 4.8,
    reviews_count: 31,
    accent: '#f43f5e',
  },
  {
    email: 'dan@dubai-market.test',
    password: 'SeedPass123!',
    username: 'dan_wheels',
    full_name: 'Dan Al Hashimi',
    bio: 'Motorbikes, cars & outdoor gear. Al Quoz pickup.',
    location: 'Al Quoz',
    rating: 4.7,
    reviews_count: 58,
    accent: '#facc15',
  },
  {
    email: 'emma@dubai-market.test',
    password: 'SeedPass123!',
    username: 'emma_home',
    full_name: 'Emma Rahman',
    bio: 'Home décor & kitchen essentials. Dubai Hills.',
    location: 'Dubai Hills',
    rating: 4.5,
    reviews_count: 19,
    accent: '#a3e635',
  },
  {
    email: 'farah@dubai-market.test',
    password: 'SeedPass123!',
    username: 'farah_beauty',
    full_name: 'Farah Khan',
    bio: 'Sealed beauty & wellness. Palm Jumeirah.',
    location: 'Palm Jumeirah',
    rating: 4.9,
    reviews_count: 72,
    accent: '#fda4af',
  },
  {
    email: 'omar@dubai-market.test',
    password: 'SeedPass123!',
    username: 'omar_sports',
    full_name: 'Omar Saleh',
    bio: 'Gym, golf & beach sports gear.',
    location: 'Jumeirah',
    rating: 4.4,
    reviews_count: 15,
    accent: '#60a5fa',
  },
  {
    email: 'nina@dubai-market.test',
    password: 'SeedPass123!',
    username: 'nina_art',
    full_name: 'Nina Varga',
    bio: 'Art, books & collectibles from DIFC.',
    location: 'DIFC',
    rating: 4.8,
    reviews_count: 27,
    accent: '#fbbf24',
  },
  {
    email: 'sam@dubai-market.test',
    password: 'SeedPass123!',
    username: 'sam_kids',
    full_name: 'Sam Patel',
    bio: 'Kids toys & family essentials. Mirdif.',
    location: 'Mirdif',
    rating: 4.6,
    reviews_count: 41,
    accent: '#67e8f9',
  },
  {
    email: 'layla@dubai-market.test',
    password: 'SeedPass123!',
    username: 'layla_deals',
    full_name: 'Layla Mansour',
    bio: 'Daily deals across categories. Business Bay.',
    location: 'Business Bay',
    rating: 4.3,
    reviews_count: 12,
    accent: '#c084fc',
  },
]

/** @type {Array<{
 *  seller: string
 *  category: keyof typeof CATEGORY
 *  title: string
 *  description: string
 *  price: number
 *  condition: string
 *  status?: string
 *  location?: string
 *  views?: number
 *  favorites?: number
 *  imageCount?: number
 *  unsplash?: string[]
 * }>} */
const CATALOG = [
  // Electronics
  {
    seller: 'alice_dubai',
    category: 'electronics',
    title: 'iPhone 14 Pro 256GB Space Black',
    description:
      'Purchased from Apple Store Dubai Mall. Always in a case + screen protector. Original box, cable, and two spare MagSafe cases included. Battery health 94%.',
    price: 3200,
    condition: 'like_new',
    location: 'Dubai Marina',
    views: 189,
    favorites: 24,
    imageCount: 3,
    unsplash: [
      '1511707171634-5f897ff02aa9',
      '1592899677977-9c10ca588bbd',
      '1580910051074-3eb694886505',
    ],
  },
  {
    seller: 'alice_dubai',
    category: 'electronics',
    title: 'MacBook Pro 14" M2 Pro 512GB',
    description:
      'Space Grey, 16GB RAM. Used for light design work. Battery cycle count under 80. Charger and sleeve included.',
    price: 7500,
    condition: 'like_new',
    location: 'Dubai Marina',
    views: 256,
    favorites: 41,
    imageCount: 3,
    unsplash: [
      '1517336714731-489689fd1ca8',
      '1496181133206-80ce9b88a853',
      '1484788984921-03950022c9ef',
    ],
  },
  {
    seller: 'bob_trades',
    category: 'electronics',
    title: 'Samsung Galaxy S23 Ultra 256GB',
    description:
      'Phantom Black, dual SIM unlocked. S Pen included. Minor edge scuffs, screen perfect with tempered glass.',
    price: 2800,
    condition: 'good',
    location: 'JBR, Dubai',
    views: 142,
    favorites: 18,
    imageCount: 2,
    unsplash: ['1610945415295-d9bbf067e59c', '1598327105666-5b89351aff97'],
  },
  {
    seller: 'bob_trades',
    category: 'electronics',
    title: 'Sony PlayStation 5 Disc Edition',
    description:
      'Comes with 2 DualSense controllers and 3 games: EA FC 24, Spider-Man 2, God of War Ragnarök. Vertical stand included.',
    price: 1800,
    condition: 'good',
    location: 'JBR, Dubai',
    views: 312,
    favorites: 55,
    imageCount: 3,
    unsplash: [
      '1606144042614-b2417e99c4e3',
      '1622297845775-be0c4d4d6c8e',
      '1550745165-9bc0b252726f',
    ],
  },
  {
    seller: 'alice_dubai',
    category: 'electronics',
    title: 'Apple AirPods Pro 2 (USB-C)',
    description:
      'Sealed retail box. Bought as a gift but unused. Apple UAE warranty.',
    price: 850,
    condition: 'new',
    location: 'Dubai Marina',
    views: 98,
    favorites: 14,
    imageCount: 2,
    unsplash: ['1600294037681-c80b4cb5b434', '1572569511254-d8f925fe2cbb'],
  },
  {
    seller: 'layla_deals',
    category: 'electronics',
    title: 'iPad Air 5th Gen 64GB Wi‑Fi',
    description:
      'Starlight. Light use for note-taking. Apple Pencil 2 sold separately. Case included.',
    price: 1650,
    condition: 'like_new',
    location: 'Business Bay',
    views: 77,
    favorites: 9,
    imageCount: 2,
    unsplash: ['1544244015-0df4b3ffc6b0', '1561154464-82e9adf32764'],
  },
  {
    seller: 'alice_dubai',
    category: 'electronics',
    title: 'DJI Mini 3 Pro + Fly More Kit',
    description:
      'Flown ~12 hours. ND filters and spare propellers included. Excellent for travel photography around Dubai.',
    price: 3100,
    condition: 'like_new',
    status: 'reserved',
    location: 'Dubai Marina',
    views: 167,
    favorites: 29,
    imageCount: 3,
    unsplash: [
      '1473968512647-3e447244af8f',
      '1508614589041-895a489b5abf',
      '1527977960916-dd12e4be9bcf',
    ],
  },
  {
    seller: 'bob_trades',
    category: 'electronics',
    title: 'Sony WH-1000XM5 Noise Cancelling Headphones',
    description:
      'Black. Soft case and cables included. Used for daily commute on Metro Red Line.',
    price: 950,
    condition: 'good',
    location: 'JLT',
    views: 64,
    favorites: 8,
    imageCount: 2,
    unsplash: ['1546435770-a3e426bf72b9', '1484704849700-f032a568e944'],
  },
  {
    seller: 'layla_deals',
    category: 'electronics',
    title: 'Nintendo Switch OLED White',
    description:
      'Dock, Joy-Cons, and Mario Kart 8 Deluxe included. Screen protector applied from day one.',
    price: 1200,
    condition: 'like_new',
    location: 'Business Bay',
    views: 121,
    favorites: 16,
    imageCount: 2,
    unsplash: ['1578303518278-be747f9dc1b4', '1493711662062-fa541adb3fc8'],
  },
  {
    seller: 'alice_dubai',
    category: 'electronics',
    title: 'Canon EOS R6 Mark II Body',
    description:
      'Shutter count ~4.2k. Dual card slots. Battery grip + 2 spare batteries. No lens.',
    price: 8200,
    condition: 'like_new',
    location: 'Dubai Marina',
    views: 88,
    favorites: 13,
    imageCount: 3,
    unsplash: [
      '1516035069371-29a1b244cc32',
      '1502920917128-1aa500764cbd',
      '1606983340126-99ab4feaa64a',
    ],
  },
  {
    seller: 'bob_trades',
    category: 'electronics',
    title: 'LG 55" C3 OLED Smart TV',
    description:
      '2023 model. Wall mount included. HDMI eARC connected to soundbar previously. Remote + magic remote.',
    price: 3900,
    condition: 'good',
    location: 'JBR, Dubai',
    views: 203,
    favorites: 22,
    imageCount: 2,
    unsplash: ['1593359671871-ad68a05fc277', '1461153933084-4b4e4b4b4b4b'],
  },
  {
    seller: 'layla_deals',
    category: 'electronics',
    title: 'Apple Watch Ultra 2 GPS + Cellular',
    description:
      'Titanium, Ocean Band. Always worn with screen protector. Extra Alpine Loop included.',
    price: 2900,
    condition: 'like_new',
    location: 'DIFC',
    views: 145,
    favorites: 19,
    imageCount: 2,
    unsplash: ['1434493787089-ee7a8fb41c26', '1579586337278-3befd40fd17a'],
  },
  {
    seller: 'alice_dubai',
    category: 'electronics',
    title: 'iPad Pro 12.9" M2 Wi‑Fi 256GB',
    description: 'Sold with Apple Pencil and Magic Keyboard Folio.',
    price: 4200,
    condition: 'like_new',
    status: 'sold',
    location: 'Dubai Marina',
    views: 290,
    favorites: 28,
    imageCount: 2,
    unsplash: ['1544244015-0df4b3ffc6b0', '1585790050237-45b6d4b3b3b3'],
  },

  // Fashion
  {
    seller: 'carol_jbr',
    category: 'fashion',
    title: 'Gucci GG Canvas Tote Bag',
    description:
      'Purchased from Gucci Dubai Mall. Dust bag and authenticity card included. Light corner wear only.',
    price: 3800,
    condition: 'good',
    location: 'Downtown Dubai',
    views: 156,
    favorites: 27,
    imageCount: 3,
    unsplash: [
      '1584917865442-de89df76afd3',
      '1590874103328-eac38a683ce7',
      '1548036328-c9fa89d128fa',
    ],
  },
  {
    seller: 'bob_trades',
    category: 'fashion',
    title: 'Nike Air Jordan 1 Retro High OG UK 10',
    description:
      'Deadstock, never worn. Original box and extras. Stored in AC room.',
    price: 1200,
    condition: 'new',
    location: 'JBR, Dubai',
    views: 210,
    favorites: 38,
    imageCount: 3,
    unsplash: [
      '1556906781-9a412961c28c',
      '1542291026-7eec264c27ff',
      '1460353581641-37baddab0fa2',
    ],
  },
  {
    seller: 'carol_jbr',
    category: 'fashion',
    title: 'Rolex Datejust 36 Jubilee (Ladies)',
    description:
      'Serviced at Rolex AD Dubai. Papers and box available. Crystal and bezel pristine.',
    price: 28500,
    condition: 'like_new',
    location: 'Downtown Dubai',
    views: 421,
    favorites: 76,
    imageCount: 3,
    unsplash: [
      '1523170337487-0d4d9d8f8f8f',
      '1524592097953-4c4e7c4e7c4e',
      '1587836374828-4dbafa94cf0e',
    ],
  },
  {
    seller: 'farah_beauty',
    category: 'fashion',
    title: 'Louis Vuitton Neverfull MM Damier',
    description:
      'Classic neverfull with pouch. Interior clean. Purchased from LV Mall of Emirates.',
    price: 5200,
    condition: 'good',
    location: 'Palm Jumeirah',
    views: 188,
    favorites: 33,
    imageCount: 2,
    unsplash: ['1566150905458-1bf1fc113f0f', '1591561954557-26941169b49e'],
  },
  {
    seller: 'carol_jbr',
    category: 'fashion',
    title: 'Adidas Samba OG White Black UK 8',
    description: 'Worn twice. Soft leather, original box. Perfect summer sneakers.',
    price: 380,
    condition: 'like_new',
    location: 'Downtown Dubai',
    views: 92,
    favorites: 11,
    imageCount: 2,
    unsplash: ['1606107557195-0e29a4b5b4aa', '1595950653106-6c9ebd614d3a'],
  },
  {
    seller: 'layla_deals',
    category: 'fashion',
    title: 'Zara Linen Summer Set Size M',
    description: 'Beige co-ord set. Worn once for brunch at La Mer. No stains.',
    price: 180,
    condition: 'like_new',
    location: 'Business Bay',
    views: 45,
    favorites: 6,
    imageCount: 2,
    unsplash: ['1483985988355-763728e1935b', '1490481651871-ab68de25d43d'],
  },
  {
    seller: 'carol_jbr',
    category: 'fashion',
    title: 'Ray-Ban Aviator Classic Gold',
    description: 'Polarized lenses. Case and cloth included. Barely used.',
    price: 450,
    condition: 'like_new',
    location: 'Jumeirah',
    views: 67,
    favorites: 8,
    imageCount: 2,
    unsplash: ['1511499767150-a48a237f0083', '1572635196237-14b3f281503f'],
  },
  {
    seller: 'farah_beauty',
    category: 'fashion',
    title: 'Hermès Oran Sandals Size 38',
    description: 'Gold hardware, beige leather. Dust bag included. Indoor wear only.',
    price: 2400,
    condition: 'like_new',
    location: 'Palm Jumeirah',
    views: 134,
    favorites: 21,
    imageCount: 2,
    unsplash: ['1543163521-1bf539c55dd2', '1560343090-f0409e92791a'],
  },
  {
    seller: 'bob_trades',
    category: 'fashion',
    title: 'Patagonia Nano Puff Jacket M',
    description: 'Black. Perfect for AC offices and winter evenings in Dubai.',
    price: 520,
    condition: 'good',
    location: 'JLT',
    views: 39,
    favorites: 4,
    imageCount: 2,
    unsplash: ['1551028719-00167b16eac5', '1544966503-7cc5ac882d5f'],
  },
  {
    seller: 'carol_jbr',
    category: 'fashion',
    title: 'Seiko Presage Cocktail Time Automatic',
    description: 'Blue dial, excellent condition. Strap barely worn. Box included.',
    price: 980,
    condition: 'like_new',
    location: 'Downtown Dubai',
    views: 76,
    favorites: 10,
    imageCount: 2,
    unsplash: ['1524592097953-4dbafa94cf0e', '1614169393341-4e2f0a6b0b0b'],
  },

  // Home & Garden
  {
    seller: 'emma_home',
    category: 'home',
    title: 'IKEA KALLAX Shelf Unit 4x4 White',
    description: 'Disassembled and ready for pickup. All hardware in labelled bags. No chips.',
    price: 280,
    condition: 'good',
    location: 'Dubai Hills',
    views: 54,
    favorites: 7,
    imageCount: 2,
    unsplash: ['1586023492120-27b2c045efd7', '1555041469-a586c61ea9bc'],
  },
  {
    seller: 'alice_dubai',
    category: 'home',
    title: 'Nespresso Vertuo Plus Coffee Machine',
    description: 'Descaled monthly. Includes unused welcome capsules and milk frother.',
    price: 350,
    condition: 'good',
    location: 'Dubai Marina',
    views: 81,
    favorites: 9,
    imageCount: 2,
    unsplash: ['1495474472287-4d71bcdd2085', '1511920170033-f8396924c348'],
  },
  {
    seller: 'emma_home',
    category: 'home',
    title: 'Dyson V15 Detect Absolute',
    description: 'All attachments + wall dock. HEPA filter recently replaced. Great for villas.',
    price: 1800,
    condition: 'like_new',
    location: 'Arabian Ranches',
    views: 112,
    favorites: 15,
    imageCount: 2,
    unsplash: ['1558317374-570d7f0f5b0b', '1581578731548-c64695cc6952'],
  },
  {
    seller: 'emma_home',
    category: 'home',
    title: 'West Elm Mid-Century Sofa 3-Seater',
    description: 'Performance fabric, charcoal. No pet hair. Moving overseas — must go.',
    price: 3200,
    condition: 'good',
    location: 'Dubai Hills',
    views: 97,
    favorites: 12,
    imageCount: 3,
    unsplash: [
      '1555041469-a586c61ea9bc',
      '1493663284031-b7e3aefcae8e',
      '1567538096630-e0c55bd6374c',
    ],
  },
  {
    seller: 'layla_deals',
    category: 'home',
    title: 'Philips Hue Starter Kit + 6 Bulbs',
    description: 'Bridge + dimmer + colour bulbs. Works with Alexa and HomeKit.',
    price: 650,
    condition: 'like_new',
    location: 'Business Bay',
    views: 48,
    favorites: 5,
    imageCount: 2,
    unsplash: ['1513506003901-1e6a229e2d15', '1565814636199-ae8133055c1c'],
  },
  {
    seller: 'emma_home',
    category: 'home',
    title: 'KitchenAid Artisan Stand Mixer 4.8L',
    description: 'Empire Red. Used for weekend baking. Dough hook and whisk included.',
    price: 1400,
    condition: 'good',
    location: 'Jumeirah',
    views: 73,
    favorites: 11,
    imageCount: 2,
    unsplash: ['1556910103-1c02745aae4d', '1574269909869-4c0d0b0b0b0b'],
  },
  {
    seller: 'emma_home',
    category: 'home',
    title: 'Balcony Outdoor Lounge Set (4pc)',
    description: 'Weather-resistant rattan look. Cushions recently cleaned. Fits Marina balcony.',
    price: 1100,
    condition: 'good',
    location: 'Dubai Marina',
    views: 66,
    favorites: 8,
    imageCount: 2,
    unsplash: ['1600210492486-724fe5c67fb0', '1600585154340-be6161a56a0c'],
  },
  {
    seller: 'alice_dubai',
    category: 'home',
    title: 'Instant Pot Duo Plus 6L',
    description: 'Barely used. Perfect for meal prep. Manual and steamer basket included.',
    price: 320,
    condition: 'like_new',
    location: 'Dubai Marina',
    views: 41,
    favorites: 3,
    imageCount: 2,
    unsplash: ['1556911220-bff04edb8f0b', '1540189549336-e6e99c367c4c'],
  },

  // Sports
  {
    seller: 'omar_sports',
    category: 'sports',
    title: 'Peloton Bike+ Latest Generation',
    description:
      'Used 6 months. Cleats, mat, and resistance bands included. Moving to a building without space.',
    price: 4500,
    condition: 'like_new',
    location: 'Jumeirah',
    views: 163,
    favorites: 24,
    imageCount: 3,
    unsplash: [
      '1517836357463-d25dfeac3438',
      '1534438327276-14e5300c3a48',
      '1571019614242-c5c5dee9f50b',
    ],
  },
  {
    seller: 'omar_sports',
    category: 'sports',
    title: 'Callaway Rogue ST Max Driver',
    description: '9.5° stiff shaft. Headcover included. Played ~12 rounds at Emirates Golf Club.',
    price: 800,
    condition: 'good',
    location: 'Dubai Hills',
    views: 52,
    favorites: 6,
    imageCount: 2,
    unsplash: ['1535131749006-b7f58c99034b', '1587177116931-4e949f0a0b0b'],
  },
  {
    seller: 'dan_wheels',
    category: 'sports',
    title: 'Trek FX 3 Disc Hybrid Bike 2022',
    description: 'Size M, hydraulic discs. Lights and mudguards. Selling after upgrade.',
    price: 2200,
    condition: 'good',
    status: 'sold',
    location: 'Al Quoz',
    views: 178,
    favorites: 19,
    imageCount: 2,
    unsplash: ['1485963631004-ce2b6a0b0b0b', '1571068316344-75bc76f77890'],
  },
  {
    seller: 'omar_sports',
    category: 'sports',
    title: 'Wilson Clash 100 V2 Tennis Racket',
    description: 'Strung with Luxilon. Overgrip fresh. Cover included.',
    price: 650,
    condition: 'like_new',
    location: 'Jumeirah',
    views: 37,
    favorites: 4,
    imageCount: 2,
    unsplash: ['1554068865-24cecd4e34b8', '1626224583764-f87db24ac4ea'],
  },
  {
    seller: 'omar_sports',
    category: 'sports',
    title: 'Yeti Rambler 36oz Bottle Bundle (x3)',
    description: 'Navy, black, and sandstone. MagCap lids. Beach & desert ready.',
    price: 280,
    condition: 'new',
    location: 'Palm Jumeirah',
    views: 29,
    favorites: 3,
    imageCount: 2,
    unsplash: ['1523362628745-0c100150b504', '1602143407151-7111542de6e8'],
  },
  {
    seller: 'alice_dubai',
    category: 'sports',
    title: 'Lululemon Align Leggings Size 6 (x2)',
    description: 'Black and navy. Worn a few times each. SoftAlign fabric.',
    price: 420,
    condition: 'like_new',
    location: 'Dubai Marina',
    views: 58,
    favorites: 9,
    imageCount: 2,
    unsplash: ['1518611012118-696072aa579a', '1571902943202-507ec2618e8f'],
  },
  {
    seller: 'omar_sports',
    category: 'sports',
    title: 'Decathlon Inflatable SUP Board 10\'6"',
    description: 'Pump, leash, and backpack included. Used at Kite Beach twice.',
    price: 950,
    condition: 'like_new',
    location: 'Jumeirah',
    views: 84,
    favorites: 12,
    imageCount: 2,
    unsplash: ['1502680390469-be75c7b3b0b0', '1530549387789-4c1017266635'],
  },
  {
    seller: 'dan_wheels',
    category: 'sports',
    title: 'Garmin Fenix 7 Sapphire Solar',
    description: 'Black titanium. Maps loaded for UAE trails. Charging cable included.',
    price: 2100,
    condition: 'good',
    location: 'Motor City',
    views: 71,
    favorites: 10,
    imageCount: 2,
    unsplash: ['1434493787089-ee7a8fb41c26', '1508685096489-7fb3badb0b0b'],
  },

  // Vehicles
  {
    seller: 'dan_wheels',
    category: 'vehicles',
    title: 'Yamaha MT-07 2022 — 8,500km',
    description:
      'ABS, TCS, quick shifter. Serviced at Yamaha Dubai. No accidents. Relocating — priced to sell.',
    price: 28000,
    condition: 'like_new',
    location: 'Al Quoz',
    views: 512,
    favorites: 89,
    imageCount: 3,
    unsplash: [
      '1558981403-c5f9899a28bc',
      '1449426468159-d04ab43f3e7f',
      '1568772585407-780fff6a0b0b',
    ],
  },
  {
    seller: 'dan_wheels',
    category: 'vehicles',
    title: 'Giant Trance X 29 Mountain Bike',
    description: 'Full suspension, size L. Tubeless setup. Ridden Hatta trails.',
    price: 4800,
    condition: 'good',
    location: 'Al Quoz',
    views: 96,
    favorites: 14,
    imageCount: 2,
    unsplash: ['1571068316344-75bc76f77890', '1485963631004-ce2b6a0b0b0b'],
  },
  {
    seller: 'dan_wheels',
    category: 'vehicles',
    title: 'Thule Motion XT XL Roof Box',
    description: 'Gloss black. Fits most UAE SUVs. Mounting kit included.',
    price: 1600,
    condition: 'good',
    location: 'Dubai Hills',
    views: 43,
    favorites: 5,
    imageCount: 2,
    unsplash: ['1449965403124-c0e6d0b0b0b0', '1503376780353-7e6692767b70'],
  },
  {
    seller: 'dan_wheels',
    category: 'vehicles',
    title: 'Honda PCX 160 Scooter 2023',
    description: 'City commuting king. 3,200km. Full service history. Helmet included.',
    price: 12500,
    condition: 'like_new',
    location: 'Deira',
    views: 187,
    favorites: 31,
    imageCount: 3,
    unsplash: [
      '1558981806-ec527fa84a39',
      '1568772585407-ebe5bdcdb0b0',
      '1591637333184-19aa84b3e01f',
    ],
  },
  {
    seller: 'bob_trades',
    category: 'vehicles',
    title: 'Xiaomi Electric Scooter 4 Pro',
    description: 'Unlocked for UAE. Dual brakes. Used for Marina promenade rides.',
    price: 1800,
    condition: 'good',
    location: 'Dubai Marina',
    views: 118,
    favorites: 17,
    imageCount: 2,
    unsplash: ['1571330734568-7f0b0b0b0b0b', '1558618666-fcd25c85cd64'],
  },
  {
    seller: 'dan_wheels',
    category: 'vehicles',
    title: 'Car Camping Tent for SUV Tailgate',
    description: 'Fits Prado / Patrol. Waterproof. Used one desert weekend.',
    price: 750,
    condition: 'like_new',
    location: 'Al Quoz',
    views: 55,
    favorites: 7,
    imageCount: 2,
    unsplash: ['1504280390367-361c6d9f38f4', '1478131143086-80ce9b88a853'],
  },

  // Books
  {
    seller: 'nina_art',
    category: 'books',
    title: 'Business Classics Bundle (3 Books)',
    description:
      'The Lean Startup, Zero to One, and Shoe Dog. Light highlighting in Lean Startup only.',
    price: 120,
    condition: 'good',
    location: 'DIFC',
    views: 34,
    favorites: 4,
    imageCount: 2,
    unsplash: ['1512820790803-83ca734da794', '1495446815900-0b0b0b0b0b0b'],
  },
  {
    seller: 'nina_art',
    category: 'books',
    title: 'Atomic Habits + Deep Work Bundle',
    description: 'Paperback, clean pages. Perfect for a reading reset.',
    price: 90,
    condition: 'like_new',
    location: 'DIFC',
    views: 48,
    favorites: 6,
    imageCount: 2,
    unsplash: ['1544947950-fa07a98d237f', '1497633762265-9d179a990aa6'],
  },
  {
    seller: 'nina_art',
    category: 'books',
    title: 'Dubai Architecture Coffee Table Book',
    description: 'Large hardcover with skyline photography. Gift-ready condition.',
    price: 220,
    condition: 'like_new',
    location: 'Downtown Dubai',
    views: 27,
    favorites: 3,
    imageCount: 2,
    unsplash: ['1481627834876-b7833e8f5570', '1524995998060-0b0b0b0b0b0b'],
  },
  {
    seller: 'carol_jbr',
    category: 'books',
    title: 'Kindle Paperwhite Signature Edition',
    description: '32GB, warm light. Leather cover included. Battery lasts weeks.',
    price: 480,
    condition: 'like_new',
    location: 'Downtown Dubai',
    views: 61,
    favorites: 8,
    imageCount: 2,
    unsplash: ['1544716278-ca5e3f4abd8c', '1507842217343-583bb7270b66'],
  },
  {
    seller: 'nina_art',
    category: 'books',
    title: 'Japanese Interior Design Magazines (x8)',
    description: 'Assorted 2022–2024 issues. Ideal for mood boards and renovation ideas.',
    price: 160,
    condition: 'good',
    location: 'DIFC',
    views: 22,
    favorites: 2,
    imageCount: 2,
    unsplash: ['1519682337058-a94d519337bc', '1456513080885-0b0b0b0b0b0b'],
  },

  // Toys & Kids
  {
    seller: 'sam_kids',
    category: 'toys',
    title: 'LEGO Technic Lamborghini Sian',
    description: 'Complete set with instructions and box. Built once for display.',
    price: 1100,
    condition: 'like_new',
    location: 'Mirdif',
    views: 89,
    favorites: 13,
    imageCount: 2,
    unsplash: ['1587654780291-39b9884a0b0b', '1566576912321-d58ddd7a6088'],
  },
  {
    seller: 'sam_kids',
    category: 'toys',
    title: 'Tonies Starter Box + 6 Characters',
    description: 'Gentle used. Characters include Moana and Peppa. Perfect for ages 3–7.',
    price: 650,
    condition: 'good',
    location: 'Mirdif',
    views: 44,
    favorites: 5,
    imageCount: 2,
    unsplash: ['1515488042361-ee00e0ddd4e4', '1596462502278-27bfdc403348'],
  },
  {
    seller: 'sam_kids',
    category: 'toys',
    title: 'BabyBjörn Bouncer Bliss',
    description: 'Mesh fabric, washable. From smoke-free home. Ages 0–2.',
    price: 480,
    condition: 'good',
    location: 'Arabian Ranches',
    views: 36,
    favorites: 4,
    imageCount: 2,
    unsplash: ['1515488042361-ee00e0ddd4e4', '1503454537195-1dcabb73ffb9'],
  },
  {
    seller: 'sam_kids',
    category: 'toys',
    title: 'Nintendo Switch Lite Coral + Games',
    description: 'Animal Crossing, Mario Odyssey, and Zelda. Screen protector applied.',
    price: 900,
    condition: 'good',
    location: 'Mirdif',
    views: 77,
    favorites: 9,
    imageCount: 2,
    unsplash: ['1578303518278-be747f9dc1b4', '1606144042614-b2417e99c4e3'],
  },
  {
    seller: 'emma_home',
    category: 'toys',
    title: 'Kids Wooden Play Kitchen',
    description: 'Solid wood, non-toxic paint. Accessories included. Moving sale.',
    price: 550,
    condition: 'good',
    location: 'Dubai Hills',
    views: 51,
    favorites: 7,
    imageCount: 2,
    unsplash: ['1587654780291-39b9884a0b0b', '1566576912321-d58ddd7a6088'],
  },
  {
    seller: 'sam_kids',
    category: 'toys',
    title: 'Osprey Kids Hiking Backpack 20L',
    description: 'Hydration compatible. Used for one Hatta day trip. Like new.',
    price: 220,
    condition: 'like_new',
    location: 'Mirdif',
    views: 19,
    favorites: 2,
    imageCount: 2,
    unsplash: ['1553062407-98eeb64c6a62', '1622260614153-03223fb72052'],
  },

  // Art & Collectibles
  {
    seller: 'nina_art',
    category: 'art',
    title: 'Abstract Desert Canvas 120x80cm',
    description:
      'Original acrylic on canvas. Warm sand and indigo tones. Ready to hang — perfect for villa living rooms.',
    price: 1800,
    condition: 'new',
    location: 'DIFC',
    views: 68,
    favorites: 11,
    imageCount: 3,
    unsplash: [
      '1541961017774-22349e4a1262',
      '1579783902614-a3fb3927b6a5',
      '1515405295577-0d27c0e0b0b0',
    ],
  },
  {
    seller: 'nina_art',
    category: 'art',
    title: 'Vintage Brass Camel Sculpture Pair',
    description: 'Hand-finished brass. Beautiful desk or shelf accents. Gifted, unused.',
    price: 420,
    condition: 'new',
    location: 'Deira',
    views: 33,
    favorites: 5,
    imageCount: 2,
    unsplash: ['1578321272176-b7bbc0679853', '1561214115-f2f134cc4912'],
  },
  {
    seller: 'nina_art',
    category: 'art',
    title: 'Polaroid Now+ Instant Camera Bundle',
    description: 'Black. App connected. 2 film packs unused. Case included.',
    price: 680,
    condition: 'like_new',
    location: 'DIFC',
    views: 57,
    favorites: 8,
    imageCount: 2,
    unsplash: ['1526170375885-4d8ecf77b99f', '1495121553079-4c61bcce1894'],
  },
  {
    seller: 'layla_deals',
    category: 'art',
    title: 'Handmade Ceramic Vase Set (x3)',
    description: 'Neutral glazes. Artist-made in Alserkal Avenue studio.',
    price: 350,
    condition: 'new',
    location: 'Al Quoz',
    views: 41,
    favorites: 6,
    imageCount: 2,
    unsplash: ['1578500494198-034d0b0b0b0b', '1493106641515-6b5631de4bb9'],
  },
  {
    seller: 'nina_art',
    category: 'art',
    title: 'Signed UAE Photography Print A2',
    description: 'Limited edition Burj Khalifa dusk print. Archival paper, unframed.',
    price: 900,
    condition: 'new',
    location: 'Downtown Dubai',
    views: 72,
    favorites: 14,
    imageCount: 2,
    unsplash: ['1512453979798-5ea266f8880c', '1518684079-3c830dcef090'],
  },

  // Health & Beauty
  {
    seller: 'farah_beauty',
    category: 'beauty',
    title: 'Dyson Airwrap Complete Long',
    description:
      'Nickel/fuchsia. All attachments + case. Used gently a handful of times.',
    price: 1900,
    condition: 'like_new',
    location: 'Palm Jumeirah',
    views: 194,
    favorites: 36,
    imageCount: 3,
    unsplash: [
      '1522338140262-f46f5913618a',
      '1596462502278-27bfdc403348',
      '1487412947147-5cebf100ffc2',
    ],
  },
  {
    seller: 'farah_beauty',
    category: 'beauty',
    title: 'La Mer Moisturizing Cream 60ml',
    description: 'Sealed. Purchased from Sephora Dubai Mall. Unopened.',
    price: 950,
    condition: 'new',
    location: 'Palm Jumeirah',
    views: 88,
    favorites: 15,
    imageCount: 2,
    unsplash: ['1596462502278-27bfdc403348', '1571781926291-c477dfb465c1'],
  },
  {
    seller: 'farah_beauty',
    category: 'beauty',
    title: 'Theragun Relief Massage Gun',
    description: 'Quiet motor, travel case. Great after gym or long flights.',
    price: 720,
    condition: 'good',
    location: 'JBR, Dubai',
    views: 63,
    favorites: 7,
    imageCount: 2,
    unsplash: ['1571019614242-c5c5dee9f50b', '1544367567-0f2fcb009e0b'],
  },
  {
    seller: 'carol_jbr',
    category: 'beauty',
    title: 'Chanel Chance Eau Tendre 100ml',
    description: 'About 80% full. Original box. Stored upright, away from heat.',
    price: 480,
    condition: 'good',
    location: 'Downtown Dubai',
    views: 79,
    favorites: 12,
    imageCount: 2,
    unsplash: ['1541643600914-78b084683601', '1594035910387-fea47794261f'],
  },
  {
    seller: 'farah_beauty',
    category: 'beauty',
    title: 'Oral-B iO Series 9 Electric Toothbrush',
    description: 'Black onyx. Travel case + 2 brush heads unused.',
    price: 650,
    condition: 'like_new',
    location: 'Palm Jumeirah',
    views: 46,
    favorites: 5,
    imageCount: 2,
    unsplash: ['1607613009820-a29f7bb81c04', '1559599101-f09722fb4948'],
  },
  {
    seller: 'emma_home',
    category: 'beauty',
    title: 'Withings Body+ Smart Scale',
    description: 'Wi‑Fi sync, body composition. White. App ready.',
    price: 320,
    condition: 'like_new',
    location: 'Dubai Hills',
    views: 31,
    favorites: 3,
    imageCount: 2,
    unsplash: ['1571019613454-1cb2f99b2d81', '1518611012118-696072aa579a'],
  },

  // Other
  {
    seller: 'layla_deals',
    category: 'other',
    title: 'Office Standing Desk 140cm Oak',
    description: 'Electric height adjust. Cable tray included. Quiet motor.',
    price: 1400,
    condition: 'good',
    location: 'Business Bay',
    views: 58,
    favorites: 6,
    imageCount: 2,
    unsplash: ['1593062093420-0b0b0b0b0b0b', '1497366216548-37526070297c'],
  },
  {
    seller: 'bob_trades',
    category: 'other',
    title: 'Herman Miller Aeron Chair Size B',
    description: 'Fully loaded lumbar. Mesh clean. Classic graphite.',
    price: 2800,
    condition: 'good',
    location: 'DIFC',
    views: 132,
    favorites: 20,
    imageCount: 2,
    unsplash: ['1580480055273-228ff5388ef8', '1505843513577-22bbf0b0b0b0'],
  },
  {
    seller: 'layla_deals',
    category: 'other',
    title: 'Anker 737 Power Bank 24K',
    description: '140W output. Ideal for MacBook + phone on long flights.',
    price: 380,
    condition: 'like_new',
    location: 'Business Bay',
    views: 70,
    favorites: 9,
    imageCount: 2,
    unsplash: ['1609091836860-4e0b0b0b0b0b', '1555617981-0b0b0b0b0b0b'],
  },
  {
    seller: 'omar_sports',
    category: 'other',
    title: 'Coleman Camping Cooler 50L',
    description: 'Keeps ice 2–3 days. Used for desert camping trips.',
    price: 280,
    condition: 'good',
    location: 'Motor City',
    views: 25,
    favorites: 2,
    imageCount: 2,
    unsplash: ['1504280390367-361c6d9f38f4', '1478131143086-80ce9b88a853'],
  },
  {
    seller: 'sam_kids',
    category: 'other',
    title: 'Uppababy Vista V2 Stroller',
    description: 'Bassinet + toddler seat. Rain cover and cup holder included.',
    price: 2200,
    condition: 'good',
    location: 'Mirdif',
    views: 94,
    favorites: 11,
    imageCount: 2,
    unsplash: ['1515488042361-ee00e0ddd4e4', '1503454537195-1dcabb73ffb9'],
  },
  {
    seller: 'alice_dubai',
    category: 'other',
    title: 'Keychron Q1 Pro Mechanical Keyboard',
    description: 'Barebones aluminium, Gateron browns. Lubed & filmed. Mac layout.',
    price: 900,
    condition: 'like_new',
    location: 'Dubai Marina',
    views: 86,
    favorites: 13,
    imageCount: 2,
    unsplash: ['1587829741301-dc798b21106b', '1511467687858-23d96c32de4f'],
  },
  {
    seller: 'layla_deals',
    category: 'other',
    title: 'Samsung 25W Duo Wireless Charger',
    description: 'Phone + Watch pad. Original box. Works with MagSafe cases too.',
    price: 180,
    condition: 'like_new',
    location: 'JLT',
    views: 28,
    favorites: 2,
    imageCount: 2,
    unsplash: ['1556656793-08538906a9f8', '1609091836860-4e0b0b0b0b0b'],
  },
  {
    seller: 'emma_home',
    category: 'other',
    title: 'Breville Barista Express Espresso',
    description: 'Built-in grinder. Descaled. Portafilter and tamper included.',
    price: 1600,
    condition: 'good',
    location: 'Dubai Hills',
    views: 103,
    favorites: 16,
    imageCount: 2,
    unsplash: ['1495474472287-4d71bcdd2085', '1511920170033-f8396924c348'],
  },

  // Extra volume for a fuller feed
  {
    seller: 'alice_dubai',
    category: 'electronics',
    title: 'Bose QuietComfort Ultra Earbuds',
    description: 'Charging case + tips. Immersive audio mode works great on flights.',
    price: 780,
    condition: 'like_new',
    location: 'Dubai Marina',
    views: 59,
    favorites: 7,
    imageCount: 2,
    unsplash: ['1590658268037-6bf12165a8df', '1572569511254-d8f925fe2cbb'],
  },
  {
    seller: 'bob_trades',
    category: 'electronics',
    title: 'GoPro Hero 12 Black Bundle',
    description: 'Enduro batteries x3, media mod, and 64GB card. Dive housing unused.',
    price: 1450,
    condition: 'like_new',
    location: 'JBR, Dubai',
    views: 111,
    favorites: 14,
    imageCount: 2,
    unsplash: ['1502920917128-1aa500764cbd', '1516035069371-29a1b244cc32'],
  },
  {
    seller: 'carol_jbr',
    category: 'fashion',
    title: 'The Row Minimal Leather Tote',
    description: 'Soft black leather. Minimal scuffs. Dust bag included.',
    price: 4500,
    condition: 'good',
    location: 'Downtown Dubai',
    views: 84,
    favorites: 18,
    imageCount: 2,
    unsplash: ['1590874103328-eac38a683ce7', '1548036328-c9fa89d128fa'],
  },
  {
    seller: 'farah_beauty',
    category: 'fashion',
    title: 'Cartier Love Bracelet Small',
    description: 'Authentic Cartier with screwdriver and papers from Boutique Dubai Mall. Excellent condition.',
    price: 32000,
    condition: 'like_new',
    location: 'Palm Jumeirah',
    views: 266,
    favorites: 52,
    imageCount: 2,
    unsplash: ['1611591437281-460bfbe1220a', '1515562141207-7a88fb7ce338'],
  },
  {
    seller: 'emma_home',
    category: 'home',
    title: 'Casper Original Mattress Queen',
    description: 'Used 1 year. Encased in protector entire time. Pickup only — bulky.',
    price: 1800,
    condition: 'good',
    location: 'Dubai Hills',
    views: 47,
    favorites: 4,
    imageCount: 2,
    unsplash: ['1631049307264-da0ec9d70304', '1522771739844-6a9f6d5f0b0b'],
  },
  {
    seller: 'omar_sports',
    category: 'sports',
    title: 'Rogue Echo Bike',
    description: 'Commercial grade. Floor mat included. Serious HIIT machine.',
    price: 3200,
    condition: 'good',
    location: 'Jumeirah',
    views: 69,
    favorites: 8,
    imageCount: 2,
    unsplash: ['1534438327276-14e5300c3a48', '1517836357463-d25dfeac3438'],
  },
  {
    seller: 'dan_wheels',
    category: 'vehicles',
    title: 'BMW R1250GS Adventure Side Cases',
    description: 'OEM aluminium panniers. Locks + mounts. Fits standard Adventure racks.',
    price: 4500,
    condition: 'good',
    location: 'Al Quoz',
    views: 38,
    favorites: 5,
    imageCount: 2,
    unsplash: ['1558981403-c5f9899a28bc', '1449426468159-d04ab43f3e7f'],
  },
  {
    seller: 'nina_art',
    category: 'books',
    title: 'Penguin Classics Literature Set (x12)',
    description: 'Matching black spines. Austen, Orwell, Woolf and more. Shelf-ready.',
    price: 280,
    condition: 'good',
    location: 'DIFC',
    views: 30,
    favorites: 4,
    imageCount: 2,
    unsplash: ['1512820790803-83ca734da794', '1497633762265-9d179a990aa6'],
  },
  {
    seller: 'sam_kids',
    category: 'toys',
    title: 'Hot Wheels Ultimate Garage Track',
    description: 'Complete with cars. Some stickers applied. Hours of fun.',
    price: 320,
    condition: 'good',
    location: 'Mirdif',
    views: 42,
    favorites: 5,
    imageCount: 2,
    unsplash: ['1566576912321-d58ddd7a6088', '1587654780291-39b9884a0b0b'],
  },
  {
    seller: 'farah_beauty',
    category: 'beauty',
    title: 'Augustinus Bader The Cream 50ml',
    description: 'Sealed jar. Purchased from Harvey Nichols Mall of Emirates.',
    price: 1100,
    condition: 'new',
    location: 'Palm Jumeirah',
    views: 55,
    favorites: 9,
    imageCount: 2,
    unsplash: ['1571781926291-c477dfb465c1', '1487412947147-5cebf100ffc2'],
  },
  {
    seller: 'layla_deals',
    category: 'electronics',
    title: 'Meta Quest 3 128GB + Elite Strap',
    description: 'Lightly used. Beat Saber and golf apps installed. Facial interface cleaned.',
    price: 2100,
    condition: 'like_new',
    location: 'Business Bay',
    views: 99,
    favorites: 12,
    imageCount: 2,
    unsplash: ['1622979135225-d2ba269cf1ac', '1593508512255-86ab42a8e620'],
  },
  {
    seller: 'carol_jbr',
    category: 'fashion',
    title: 'Acne Studios Wool Scarf',
    description: 'Classic stripe. Soft merino. Ideal for travel to Europe.',
    price: 650,
    condition: 'like_new',
    location: 'Downtown Dubai',
    views: 35,
    favorites: 4,
    imageCount: 2,
    unsplash: ['1520903920243-00d872a80bda', '1483985988355-763728e1935b'],
  },
  {
    seller: 'emma_home',
    category: 'home',
    title: 'Smeg Retro Fridge Mini Bar',
    description: 'Pastel green. Perfect for villa guest kitchen or office.',
    price: 2400,
    condition: 'like_new',
    location: 'Jumeirah',
    views: 76,
    favorites: 10,
    imageCount: 2,
    unsplash: ['1571171637578-41bc2dd41cd2', '1556910103-1c02745aae4d'],
  },
  {
    seller: 'omar_sports',
    category: 'sports',
    title: 'Titleist Pro V1 Golf Balls (4 dozen)',
    description: 'New sleeves. Practice balls separated — these are unused.',
    price: 480,
    condition: 'new',
    location: 'Dubai Hills',
    views: 40,
    favorites: 3,
    imageCount: 2,
    unsplash: ['1535131749006-b7f58c99034b', '1626224583764-f87db24ac4ea'],
  },
  {
    seller: 'alice_dubai',
    category: 'electronics',
    title: 'Samsung Galaxy Tab S9+ 256GB',
    description: 'Graphite. Book cover keyboard included. S Pen in slot.',
    price: 2800,
    condition: 'like_new',
    location: 'Dubai Marina',
    views: 67,
    favorites: 8,
    imageCount: 2,
    unsplash: ['1561154464-82e9adf32764', '1544244015-0df4b3ffc6b0'],
  },
  {
    seller: 'bob_trades',
    category: 'electronics',
    title: 'Logitech MX Master 3S + MX Keys',
    description: 'Graphite combo. Multi-device Logi Options+. Barely worn feet.',
    price: 520,
    condition: 'like_new',
    location: 'JLT',
    views: 53,
    favorites: 6,
    imageCount: 2,
    unsplash: ['1587829741301-dc798b21106b', '1511467687858-23d96c32de4f'],
  },
  {
    seller: 'dan_wheels',
    category: 'vehicles',
    title: 'Ducati Monster 937 — 4,100km',
    description: 'Red. Termignoni exhaust. Full Ducati service history. Garage kept.',
    price: 52000,
    condition: 'like_new',
    location: 'Al Quoz',
    views: 340,
    favorites: 61,
    imageCount: 3,
    unsplash: [
      '1568772585407-780fff6a0b0b',
      '1558981403-c5f9899a28bc',
      '1449426468159-d04ab43f3e7f',
    ],
  },
  {
    seller: 'nina_art',
    category: 'art',
    title: 'Vintage Film Camera Contax T2',
    description: 'Working shutter. Cosmetic marks consistent with age. Strap included.',
    price: 3500,
    condition: 'fair',
    location: 'DIFC',
    views: 91,
    favorites: 17,
    imageCount: 2,
    unsplash: ['1526170375885-4d8ecf77b99f', '1495121553079-4c61bcce1894'],
  },
  {
    seller: 'sam_kids',
    category: 'toys',
    title: 'Yoto Player 3rd Gen + Card Pack',
    description: 'Screen-free audio player. Includes adventure card pack.',
    price: 520,
    condition: 'like_new',
    location: 'Mirdif',
    views: 38,
    favorites: 5,
    imageCount: 2,
    unsplash: ['1515488042361-ee00e0ddd4e4', '1596462502278-27bfdc403348'],
  },
  {
    seller: 'farah_beauty',
    category: 'beauty',
    title: 'NuFACE Trinity Facial Device',
    description: 'Complete kit with gel. Used twice. Includes charger.',
    price: 980,
    condition: 'like_new',
    location: 'Palm Jumeirah',
    views: 49,
    favorites: 7,
    imageCount: 2,
    unsplash: ['1522338140262-f46f5913618a', '1487412947147-5cebf100ffc2'],
  },
  {
    seller: 'layla_deals',
    category: 'other',
    title: 'Ring Video Doorbell 4 + Chime',
    description: 'Works with existing wiring. Weather sealed. App setup ready.',
    price: 550,
    condition: 'like_new',
    location: 'Business Bay',
    views: 44,
    favorites: 4,
    imageCount: 2,
    unsplash: ['1558002038-1055907df827', '1558618666-fcd25c85cd64'],
  },
]

function loadEnvFile() {
  const raw = readFileSync(join(ROOT, '.env.local'), 'utf8')
  const env = {}
  for (const line of raw.split('\n')) {
    if (!line || line.startsWith('#')) continue
    const i = line.indexOf('=')
    if (i === -1) continue
    env[line.slice(0, i).trim()] = line.slice(i + 1).trim()
  }
  return env
}

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 48)
}

function hashKey(...parts) {
  return createHash('sha1').update(parts.join('|')).digest('hex').slice(0, 12)
}

function escapeXml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

async function downloadUnsplash(photoId) {
  const cachePath = join(CACHE_DIR, `unsplash-${photoId}.jpg`)
  if (existsSync(cachePath)) {
    return readFile(cachePath)
  }

  const urls = [
    `https://images.unsplash.com/photo-${photoId}?w=900&h=900&fit=crop&q=80`,
    `https://images.unsplash.com/photo-${photoId}?auto=format&fit=crop&w=900&h=900&q=80`,
  ]

  for (const url of urls) {
    try {
      const res = await fetch(url, {
        headers: { 'Accept': 'image/jpeg,image/*' },
        redirect: 'follow',
      })
      if (!res.ok) continue
      const buf = Buffer.from(await res.arrayBuffer())
      if (buf.length < 5000) continue
      // Validate it's an image
      const meta = await sharp(buf).metadata()
      if (!meta.width) continue
      const out = await sharp(buf)
        .resize(900, 900, { fit: 'cover', position: 'centre' })
        .jpeg({ quality: 84, mozjpeg: true })
        .toBuffer()
      await writeFile(cachePath, out)
      return out
    } catch {
      // try next url / fall through
    }
  }
  return null
}

async function generateProductImage({ title, category, variant = 0 }) {
  const [bg, mid, accent, fg] = PALETTES[category] || PALETTES.other
  const key = hashKey(title, category, String(variant))
  const cachePath = join(CACHE_DIR, `gen-${key}.jpg`)
  if (existsSync(cachePath)) return readFile(cachePath)

  const words = title.split(/\s+/).slice(0, 5).join(' ')
  const catLabel = category.replace('-', ' & ').toUpperCase()
  const shapes =
    variant % 3 === 0
      ? `<circle cx="640" cy="220" r="180" fill="${accent}" fill-opacity="0.35"/>
         <rect x="120" y="420" width="280" height="280" rx="36" fill="${fg}" fill-opacity="0.12"/>`
      : variant % 3 === 1
        ? `<polygon points="700,120 860,420 540,420" fill="${accent}" fill-opacity="0.3"/>
           <circle cx="220" cy="560" r="140" fill="${fg}" fill-opacity="0.1"/>`
        : `<rect x="520" y="140" width="300" height="300" rx="150" fill="${accent}" fill-opacity="0.28"/>
           <rect x="80" y="480" width="360" height="200" rx="28" fill="${fg}" fill-opacity="0.1"/>`

  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="900" height="900" viewBox="0 0 900 900" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${bg}"/>
      <stop offset="55%" stop-color="${mid}"/>
      <stop offset="100%" stop-color="${bg}"/>
    </linearGradient>
    <radialGradient id="glow" cx="30%" cy="25%" r="60%">
      <stop offset="0%" stop-color="${accent}" stop-opacity="0.45"/>
      <stop offset="100%" stop-color="${accent}" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="900" height="900" fill="url(#g)"/>
  <rect width="900" height="900" fill="url(#glow)"/>
  ${shapes}
  <rect x="48" y="48" width="804" height="804" rx="40" fill="none" stroke="${fg}" stroke-opacity="0.18" stroke-width="2"/>
  <text x="80" y="120" fill="${accent}" font-family="Georgia, serif" font-size="22" letter-spacing="4">${escapeXml(catLabel)}</text>
  <text x="80" y="720" fill="${fg}" font-family="Georgia, serif" font-size="42" font-weight="700">${escapeXml(words)}</text>
  <text x="80" y="770" fill="${fg}" fill-opacity="0.55" font-family="Helvetica, Arial, sans-serif" font-size="20">Dubai Market · ${SEED_TAG}</text>
  <circle cx="780" cy="780" r="28" fill="${accent}"/>
</svg>`

  const buf = await sharp(Buffer.from(svg))
    .jpeg({ quality: 86, mozjpeg: true })
    .toBuffer()
  await writeFile(cachePath, buf)
  return buf
}

async function generateAvatar({ name, accent }) {
  const key = hashKey('avatar', name, accent)
  const cachePath = join(CACHE_DIR, `avatar-${key}.jpg`)
  if (existsSync(cachePath)) return readFile(cachePath)

  const initials = name
    .split(/\s+/)
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="ag" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#0f172a"/>
      <stop offset="100%" stop-color="${accent}"/>
    </linearGradient>
  </defs>
  <rect width="512" height="512" fill="url(#ag)"/>
  <circle cx="256" cy="256" r="180" fill="#000" fill-opacity="0.18"/>
  <text x="256" y="286" text-anchor="middle" fill="#fff" font-family="Georgia, serif" font-size="140" font-weight="700">${escapeXml(initials)}</text>
</svg>`

  const buf = await sharp(Buffer.from(svg)).jpeg({ quality: 88 }).toBuffer()
  await writeFile(cachePath, buf)
  return buf
}

async function ensureImageBuffers(item) {
  const count = item.imageCount || 2
  const buffers = []
  const ids = item.unsplash || []

  for (let i = 0; i < count; i++) {
    let buf = null
    if (ids[i]) buf = await downloadUnsplash(ids[i])
    if (!buf) {
      buf = await generateProductImage({
        title: item.title,
        category: item.category,
        variant: i,
      })
    } else {
      // Soft brand strip so even stock photos feel owned by the marketplace
      const overlay = Buffer.from(`<?xml version="1.0" encoding="UTF-8"?>
<svg width="900" height="900" xmlns="http://www.w3.org/2000/svg">
  <rect x="0" y="820" width="900" height="80" fill="#0f172a" fill-opacity="0.45"/>
  <text x="32" y="870" fill="#fff" font-family="Helvetica, Arial, sans-serif" font-size="22">Dubai Market</text>
</svg>`)
      buf = await sharp(buf)
        .composite([{ input: await sharp(overlay).png().toBuffer(), top: 0, left: 0 }])
        .jpeg({ quality: 84, mozjpeg: true })
        .toBuffer()
    }
    buffers.push(buf)
  }
  return buffers
}

async function uploadPublic(supabase, bucket, path, buffer, contentType = 'image/jpeg') {
  const { error } = await supabase.storage.from(bucket).upload(path, buffer, {
    contentType,
    upsert: true,
  })
  if (error) throw new Error(`Upload ${bucket}/${path}: ${error.message}`)
  const { data } = supabase.storage.from(bucket).getPublicUrl(path)
  return data.publicUrl
}

async function findUserByEmail(supabase, email) {
  // Paginate lightly — seed set is small
  let page = 1
  while (page <= 10) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 100 })
    if (error) throw error
    const hit = data.users.find((u) => u.email === email)
    if (hit) return hit
    if (data.users.length < 100) break
    page += 1
  }
  return null
}

async function ensureSeller(supabase, seller) {
  let user = await findUserByEmail(supabase, seller.email)
  if (!user) {
    const { data, error } = await supabase.auth.admin.createUser({
      email: seller.email,
      password: seller.password,
      email_confirm: true,
      user_metadata: {
        username: seller.username,
        full_name: seller.full_name,
      },
    })
    if (error) throw new Error(`Create user ${seller.email}: ${error.message}`)
    user = data.user
    console.log(`  + created auth user ${seller.username}`)
  } else {
    console.log(`  · reused auth user ${seller.username}`)
  }

  const avatarBuf = await generateAvatar({
    name: seller.full_name,
    accent: seller.accent,
  })
  const avatarPath = `${user.id}/avatar.jpg`
  const avatarUrl = await uploadPublic(supabase, 'avatars', avatarPath, avatarBuf)

  const profilePatch = {
    id: user.id,
    username: seller.username,
    full_name: seller.full_name,
    avatar_url: `${avatarUrl}?v=${Date.now()}`,
    bio: seller.bio,
    location: seller.location,
    rating: seller.rating,
    reviews_count: seller.reviews_count,
  }

  // Trigger may have created profile — upsert
  const { error: upErr } = await supabase.from('profiles').upsert(profilePatch, {
    onConflict: 'id',
  })
  if (upErr) throw new Error(`Profile ${seller.username}: ${upErr.message}`)

  // is_admin may not exist if admin_patch not applied
  if (seller.is_admin) {
    const { error: adminErr } = await supabase
      .from('profiles')
      .update({ is_admin: true })
      .eq('id', user.id)
    if (adminErr && !/column .* does not exist/i.test(adminErr.message)) {
      console.warn(`  ! admin flag skipped: ${adminErr.message}`)
    }
  }

  return { ...seller, id: user.id, avatar_url: profilePatch.avatar_url }
}

async function resetSeedItems(supabase) {
  // Prefer deleting by description marker if present; else wipe all items (empty DB expected)
  const { data: items, error } = await supabase
    .from('items')
    .select('id, images, seller_id, description')
    .ilike('description', `%[${SEED_TAG}]%`)
  if (error) throw error

  if (!items?.length) {
    console.log('No previous seed items tagged for reset.')
    return
  }

  for (const item of items) {
    for (const url of item.images || []) {
      const marker = '/item-images/'
      const idx = url.indexOf(marker)
      if (idx === -1) continue
      const path = decodeURIComponent(url.slice(idx + marker.length).split('?')[0])
      await supabase.storage.from('item-images').remove([path])
    }
  }

  const ids = items.map((i) => i.id)
  const { error: delErr } = await supabase.from('items').delete().in('id', ids)
  if (delErr) throw delErr
  console.log(`Reset: removed ${ids.length} seeded items.`)
}

async function seedFavorites(supabase, sellersByUsername, itemIds) {
  const carol = sellersByUsername.carol_jbr
  const alice = sellersByUsername.alice_dubai
  if (!carol || itemIds.length < 5) return

  const picks = itemIds.slice(0, 8)
  for (const itemId of picks) {
    await supabase.from('favorites').upsert(
      { user_id: carol.id, item_id: itemId },
      { onConflict: 'user_id,item_id', ignoreDuplicates: true },
    )
  }
  // Alice favorites a few too
  for (const itemId of itemIds.slice(8, 14)) {
    await supabase.from('favorites').upsert(
      { user_id: alice.id, item_id: itemId },
      { onConflict: 'user_id,item_id', ignoreDuplicates: true },
    )
  }
}

async function seedConversation(supabase, sellersByUsername, items) {
  const bob = sellersByUsername.bob_trades
  const carol = sellersByUsername.carol_jbr
  const ps5 = items.find((i) => /PlayStation 5/i.test(i.title))
  if (!bob || !carol || !ps5) return

  const { data: conv, error } = await supabase
    .from('conversations')
    .upsert(
      {
        item_id: ps5.id,
        buyer_id: carol.id,
        seller_id: bob.id,
        last_message: 'Is it still available this weekend?',
        last_message_at: new Date().toISOString(),
        buyer_unread_count: 0,
        seller_unread_count: 1,
      },
      { onConflict: 'item_id,buyer_id' },
    )
    .select('id')
    .maybeSingle()

  if (error) {
    console.warn('Conversation seed skipped:', error.message)
    return
  }

  if (!conv?.id) return

  const { count } = await supabase
    .from('messages')
    .select('*', { count: 'exact', head: true })
    .eq('conversation_id', conv.id)

  if ((count || 0) > 0) return

  await supabase.from('messages').insert([
    {
      conversation_id: conv.id,
      sender_id: carol.id,
      content: 'Hi Bob! Is the PS5 still available?',
      is_read: true,
      created_at: new Date(Date.now() - 2 * 3600_000).toISOString(),
    },
    {
      conversation_id: conv.id,
      sender_id: bob.id,
      content: 'Yes! Controllers and games included. Free delivery in Marina/JBR.',
      is_read: true,
      created_at: new Date(Date.now() - 90 * 60_000).toISOString(),
    },
    {
      conversation_id: conv.id,
      sender_id: carol.id,
      content: 'Is it still available this weekend?',
      is_read: false,
      created_at: new Date(Date.now() - 3600_000).toISOString(),
    },
  ])
}

async function main() {
  const reset = process.argv.includes('--reset')
  const env = loadEnvFile()
  const url = env.NEXT_PUBLIC_SUPABASE_URL
  const key = env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local')
    process.exit(1)
  }

  await mkdir(CACHE_DIR, { recursive: true })

  const supabase = createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  console.log(`\nDubai Market seeder (${SEED_TAG})`)
  console.log(`Catalog size: ${CATALOG.length} items · Sellers: ${SELLERS.length}\n`)

  if (reset) {
    console.log('Resetting previous seed…')
    await resetSeedItems(supabase)
  }

  console.log('Ensuring sellers…')
  const sellers = []
  for (const s of SELLERS) {
    sellers.push(await ensureSeller(supabase, s))
  }
  const sellersByUsername = Object.fromEntries(sellers.map((s) => [s.username, s]))

  console.log('\nSeeding items + images…')
  const createdItems = []
  let imageUploads = 0
  let generatedOnly = 0
  let unsplashHits = 0

  for (let idx = 0; idx < CATALOG.length; idx++) {
    const item = CATALOG[idx]
    const seller = sellersByUsername[item.seller]
    if (!seller) throw new Error(`Unknown seller ${item.seller}`)

    process.stdout.write(`  [${idx + 1}/${CATALOG.length}] ${item.title.slice(0, 48)}… `)

    const buffers = await ensureImageBuffers(item)
    // Track source roughly
    for (let i = 0; i < buffers.length; i++) {
      if (item.unsplash?.[i]) {
        const cached = existsSync(join(CACHE_DIR, `unsplash-${item.unsplash[i]}.jpg`))
        if (cached) unsplashHits += 1
        else generatedOnly += 1
      } else {
        generatedOnly += 1
      }
    }

    const images = []
    for (let i = 0; i < buffers.length; i++) {
      const path = `${seller.id}/${SEED_TAG}/${slugify(item.title)}-${i + 1}-${hashKey(item.title, String(i))}.jpg`
      const publicUrl = await uploadPublic(supabase, 'item-images', path, buffers[i])
      images.push(publicUrl)
      imageUploads += 1
    }

    const daysAgo = Math.floor(Math.random() * 28) + 1
    const createdAt = new Date(Date.now() - daysAgo * 86400_000).toISOString()
    const description = `${item.description}\n\n[${SEED_TAG}]`

    const row = {
      seller_id: seller.id,
      category_id: CATEGORY[item.category],
      title: item.title,
      description,
      price: item.price,
      currency: 'AED',
      condition: item.condition || CONDITIONS[Math.floor(Math.random() * 3)],
      status: item.status || 'active',
      images,
      location: item.location || seller.location || LOCATIONS[idx % LOCATIONS.length],
      views_count: item.views ?? Math.floor(Math.random() * 200),
      favorites_count: 0,
      created_at: createdAt,
      updated_at: createdAt,
    }

    const { data: inserted, error } = await supabase
      .from('items')
      .insert(row)
      .select('id, title')
      .single()

    if (error) {
      console.log('FAIL')
      throw new Error(`Insert "${item.title}": ${error.message}`)
    }

    createdItems.push(inserted)
    console.log(`ok (${images.length} imgs)`)
  }

  console.log('\nSeeding favorites + sample conversation…')
  await seedFavorites(
    supabase,
    sellersByUsername,
    createdItems.map((i) => i.id),
  )
  await seedConversation(supabase, sellersByUsername, createdItems)

  const { count: itemCount } = await supabase
    .from('items')
    .select('*', { count: 'exact', head: true })
  const { count: profileCount } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })

  console.log('\nSeed complete')
  console.log(`  Profiles: ${profileCount}`)
  console.log(`  Items:    ${itemCount} (created this run: ${createdItems.length})`)
  console.log(`  Images:   ${imageUploads} uploaded to item-images`)
  console.log(`  Note:     stock photos used when available; otherwise sharp-generated`)
  console.log('\nTest logins (password for all): SeedPass123!')
  for (const s of SELLERS) {
    console.log(`  ${s.email.padEnd(32)}  @${s.username}`)
  }
  console.log('')
}

main().catch((err) => {
  console.error('\nSeed failed:', err.message || err)
  process.exit(1)
})
