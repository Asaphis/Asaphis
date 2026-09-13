import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Countries (config-driven, not hard-coded in app logic)
  const countries = [
    { code: 'NG', name: 'Nigeria', allowedDocuments: ["NIN", "Passport", "Driver's Licence"], verificationProvider: 'mock', govIdCheckEnabled: false, phoneRequired: true, livenessRequired: true, manualReview: true, currency: 'NGN', contributionAmount: 25000, paymentProviders: ['Paystack', 'Flutterwave'], paymentMethods: ['Card', 'Transfer', 'Mobile money'], usesGlobalFallback: false },
    { code: 'GH', name: 'Ghana', allowedDocuments: ['Ghana Card', 'Passport'], verificationProvider: 'mock', govIdCheckEnabled: false, phoneRequired: true, livenessRequired: true, manualReview: true, currency: 'GHS', contributionAmount: 350, paymentProviders: ['Flutterwave'], paymentMethods: ['Card', 'Transfer', 'Mobile money'], usesGlobalFallback: false },
    { code: 'KE', name: 'Kenya', allowedDocuments: ['National ID', 'Passport'], verificationProvider: 'mock', govIdCheckEnabled: false, phoneRequired: true, livenessRequired: true, manualReview: true, currency: 'KES', contributionAmount: 3200, paymentProviders: ['Flutterwave', 'DPO'], paymentMethods: ['Card', 'Transfer', 'Mobile money'], usesGlobalFallback: false },
    { code: 'ZA', name: 'South Africa', enabled: false, allowedDocuments: ['National ID', 'Passport'], verificationProvider: 'mock', currency: 'ZAR', contributionAmount: 450, paymentProviders: ['Stripe'], paymentMethods: ['Card', 'Transfer'], usesGlobalFallback: true },
    { code: 'ZM', name: 'Zambia', allowedDocuments: ['National ID', 'Passport'], verificationProvider: 'mock', currency: 'ZMW', contributionAmount: 500, paymentProviders: ['Flutterwave'], paymentMethods: ['Card', 'Mobile money'], usesGlobalFallback: true },
  ];
  for (const c of countries) {
    await prisma.country.upsert({ where: { code: c.code }, create: c as never, update: c as never });
  }

  await prisma.paymentConfiguration.upsert({ where: { countryCode_currency: { countryCode: 'GLOBAL', currency: 'USD' } }, create: { countryCode: 'GLOBAL', currency: 'USD', amount: 25, providers: ['Stripe'], methods: ['Card', 'Transfer'], providerPriority: ['Stripe'] }, update: {} });

  for (const f of [
    ['MEMBER_CHAT', false, '1:1 member chat (keep disabled for launch)'],
    ['TRUSTED_MEMBER_AUTO_PUBLISH', false, 'Low-risk trusted member fast path'],
    ['TRAVEL_ACCESS', true, 'Travel request/grant flow'],
    ['PUSH_NOTIFICATIONS', false, 'Push fan-out'],
    ['WHATSAPP_NOTIFICATIONS', false, 'WhatsApp notifications'],
    ['NEW_VERIFICATION_PROVIDER', false, 'Second KYC vendor'],
    ['NEW_PAYMENT_PROVIDER', false, 'Second payment vendor'],
  ] as const) {
    await prisma.featureFlag.upsert({ where: { key: f[0] }, create: { key: f[0], enabled: f[1], description: f[2] }, update: {} });
  }

  for (const p of [
    { name: 'Paystack', kind: 'payment', priority: 10 },
    { name: 'Flutterwave', kind: 'payment', priority: 20 },
    { name: 'Stripe', kind: 'payment', priority: 30 },
    { name: 'mock-phone', kind: 'phone', priority: 100 },
    { name: 'mock-identity', kind: 'identity', priority: 100 },
  ]) {
    await prisma.verificationProvider.upsert({ where: { name: p.name }, create: p, update: {} });
  }

  const sections = [
    ['hero', 'Hero', 0], ['message', 'Featured message', 1], ['about', 'About', 2],
    ['vision', 'Vision', 3], ['education', 'Education', 4], ['community', 'Community', 5],
    ['support', 'Support', 6], ['final-cta', 'Final CTA', 7],
  ] as const;
  for (const [key, title, order] of sections) {
    await prisma.landingSection.upsert({ where: { key }, create: { key, title, visible: true, sortOrder: order }, update: {} });
  }

  // Preserve old frontend mock content as real DB rows so landing keeps serving
  // after switching to GET /content/published. Admin can edit/publish from /content.
  // Media preserved from web/frontend/src/lib/mock-data.ts (Pexels/Unsplash).
  const legacyContent = [
    { section: 'hero', kind: 'Hero', title: 'A serious home for African education and shared progress.', body: 'A home for African education, community knowledge, and the people carrying it forward.', mediaUrls: ['https://images.pexels.com/photos/10614241/pexels-photo-10614241.jpeg?auto=compress&cs=tinysrgb&w=1400&q=80'], sortOrder: 0 },
    { section: 'message', kind: 'Video', title: 'Knowledge is a shared responsibility.', body: 'A message on building trusted knowledge together.', mediaUrls: ['https://videos.pexels.com/video-files/8716787/8716787-uhd_3840_2160_25fps.mp4', 'https://images.pexels.com/videos/8716787/pexels-photo-8716787.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=630&w=1200'], sortOrder: 1 },
    { section: 'about', kind: 'Article', title: 'A long-term home for learning and participation.', body: 'AsaPhis makes African education, community knowledge, and thoughtful participation easier to find and carry forward.', mediaUrls: ['https://images.unsplash.com/photo-1770910236912-862918eca455?auto=format&fit=crop&w=1100&q=80'], sortOrder: 2 },
    { section: 'vision', kind: 'Article', title: 'Build the foundation before the horizon.', body: 'See what exists today and what comes next.', mediaUrls: [], sortOrder: 3 },
    { section: 'education', kind: 'Article', title: 'How to keep context when a story travels', body: 'A guide to reading historical material with context.', mediaUrls: ['https://images.unsplash.com/photo-1764529079425-2ce32cd92b8a?auto=format&fit=crop&w=900&q=80'], sortOrder: 10 },
    { section: 'education', kind: 'Article', title: 'A community note is more than a post', body: 'What makes a community contribution ready to share.', mediaUrls: ['https://images.unsplash.com/photo-1726207873181-03af2636095d?auto=format&fit=crop&w=700&q=80'], sortOrder: 11 },
    { section: 'education', kind: 'Article', title: 'Designing technology for people who need it', body: 'A primer on clear, accountable digital systems.', mediaUrls: [], sortOrder: 12 },
    { section: 'support', kind: 'Article', title: 'Support keeps the foundation open.', body: 'Contributions support education, moderation, and secure member access.', mediaUrls: [], sortOrder: 20 },
    { section: 'community', kind: 'Article', title: 'Community, with care.', body: 'Read, comment, reply, react, and submit through a visible review process.', mediaUrls: [], sortOrder: 30 },
  ] as const;
  for (const c of legacyContent) {
    const existing = await prisma.contentItem.findFirst({ where: { section: c.section, title: c.title } });
    if (!existing) {
      await prisma.contentItem.create({
        data: { section: c.section, kind: c.kind, title: c.title, body: c.body, mediaUrls: [...c.mediaUrls], visibility: 'PUBLIC', status: 'PUBLISHED', sortOrder: c.sortOrder, updatedBy: 'seed' } as never,
      });
    } else if (!((existing as unknown as { mediaUrls?: string[] }).mediaUrls?.length)) {
      await prisma.contentItem.update({ where: { id: existing.id }, data: { kind: c.kind, mediaUrls: [...c.mediaUrls] } as never });
    }
  }

  const email = process.env.SEED_ADMIN_EMAIL ?? 'admin@asaphis.org';
  const password = process.env.SEED_ADMIN_PASSWORD ?? 'ChangeMe123!';
  const hash = await bcrypt.hash(password, 12);
  await prisma.user.upsert({
    where: { email },
    create: { email, passwordHash: hash, roles: ['SUPER_ADMIN'], accountStatus: 'ACTIVE', membershipStage: 'ACTIVE_MEMBER', emailVerifiedAt: new Date(), member: { create: { memberCode: 'MEM-AD-000001', displayName: process.env.SEED_ADMIN_NAME ?? 'AsaPhis Admin', citizenshipCountry: 'NG' } } },
    update: { roles: ['SUPER_ADMIN'] },
  });

  // eslint-disable-next-line no-console
  console.log(`Seeded countries, flags, providers, sections, admin=${email}`);
}

main().finally(() => prisma.$disconnect());
