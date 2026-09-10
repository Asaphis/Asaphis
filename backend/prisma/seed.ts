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
