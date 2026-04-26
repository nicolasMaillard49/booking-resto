// ============================================================
// Seed — Données de démo
// Usage: pnpm --filter @booking-resto/prisma seed
// ============================================================

import { PrismaClient, BookingStatus, PaymentStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Début du seeding…');

  // Nettoyage (ordre important pour respecter les FK)
  await prisma.booking.deleteMany();
  await prisma.review.deleteMany();
  await prisma.availability.deleteMany();
  await prisma.blockedSlot.deleteMany();
  await prisma.user.deleteMany();
  await prisma.service.deleteMany();

  // ── Availability (mardi=1 … samedi=5) ──────────────────────
  const availabilityData = [
    { dayOfWeek: 1, startTime: '09:00', endTime: '19:00' },
    { dayOfWeek: 2, startTime: '09:00', endTime: '19:00' },
    { dayOfWeek: 3, startTime: '09:00', endTime: '19:00' },
    { dayOfWeek: 4, startTime: '09:00', endTime: '20:00' },
    { dayOfWeek: 5, startTime: '09:00', endTime: '18:00' },
  ];
  for (const avail of availabilityData) {
    await prisma.availability.create({ data: avail });
  }

  // ── Services ───────────────────────────────────────────────
  const services = await Promise.all([
    prisma.service.create({
      data: {
        name: 'Coupe femme',
        description: 'Coupe + brushing inclus. Conseil personnalisé.',
        duration: 60,
        price: 55,
        category: 'Coupes',
        sortOrder: 1,
      },
    }),
    prisma.service.create({
      data: {
        name: 'Coupe homme',
        description: 'Coupe + shampooing. Rapide et soignée.',
        duration: 30,
        price: 25,
        category: 'Coupes',
        sortOrder: 2,
      },
    }),
    prisma.service.create({
      data: {
        name: 'Coloration complète',
        description: 'Coloration racines + longueurs. Produits végétaux disponibles.',
        duration: 120,
        price: 85,
        category: 'Couleur',
        sortOrder: 3,
      },
    }),
    prisma.service.create({
      data: {
        name: 'Soin profond',
        description: 'Masque kératine ou soin hydratant.',
        duration: 45,
        price: 35,
        category: 'Soins',
        sortOrder: 4,
      },
    }),
  ]);

  // ── Admin user ─────────────────────────────────────────────
  const adminEmail = process.env.SEED_ADMIN_EMAIL ?? 'admin@example.fr';
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? 'Admin1234!';
  const passwordHash = await bcrypt.hash(adminPassword, 12);
  await prisma.user.create({
    data: {
      email: adminEmail,
      passwordHash,
      role: 'ADMIN',
    },
  });

  // ── Réservations à venir (démo calendrier plein) ───────────
  const clients = [
    { name: 'Marie Dupont', email: 'marie.dupont@email.com', phone: '06 98 76 54 32' },
    { name: 'Sophie Martin', email: 'sophie.martin@email.com', phone: '07 11 22 33 44' },
    { name: 'Julie Leroy', email: 'julie.leroy@email.com', phone: '06 55 44 33 22' },
    { name: 'Camille Rousseau', email: 'camille.r@email.com', phone: '07 88 99 00 11' },
    { name: 'Thomas Bernard', email: 'thomas.b@email.com', phone: '06 12 12 12 12' },
    { name: 'Lucas Petit', email: 'lucas.petit@email.com', phone: '07 33 44 55 66' },
    { name: 'Emma Robert', email: 'emma.robert@email.com', phone: '06 77 88 99 00' },
    { name: 'Chloé Garnier', email: 'chloe.g@email.com', phone: '07 22 33 44 55' },
    { name: 'Nicolas Dubois', email: 'nicolas.d@email.com', phone: '06 44 55 66 77' },
    { name: 'Sarah Moreau', email: 'sarah.moreau@email.com', phone: '07 99 88 77 66' },
    { name: 'Paul Lefevre', email: 'paul.l@email.com', phone: '06 23 45 67 89' },
    { name: 'Amélie Vincent', email: 'amelie.v@email.com', phone: '07 66 77 88 99' },
  ];
  const hours = [9, 10, 11, 14, 15, 16, 17];
  // Probabilités: 70% CONFIRMED, 20% PENDING, 10% CANCELLED
  function pickStatus(): BookingStatus {
    const r = Math.random();
    if (r < 0.7) return BookingStatus.CONFIRMED;
    if (r < 0.9) return BookingStatus.PENDING;
    return BookingStatus.CANCELLED;
  }

  const futureBookings: Array<Parameters<typeof prisma.booking.create>[0]['data']> = [];
  let tokenCounter = 100;

  // 25 RDV étalés sur J+1 … J+30, 1 ou 2 par jour
  for (let dayOffset = 1; dayOffset <= 30 && futureBookings.length < 25; dayOffset++) {
    const day = new Date();
    day.setDate(day.getDate() + dayOffset);
    const jsDay = day.getDay();
    const dow = jsDay === 0 ? 6 : jsDay - 1;
    // Skip dimanche (dow=6, fermé dans le seed horaires)
    if (dow === 6) continue;

    const nbForDay = Math.random() < 0.4 ? 2 : 1;
    for (let i = 0; i < nbForDay && futureBookings.length < 25; i++) {
      const service = services[Math.floor(Math.random() * services.length)];
      const client = clients[Math.floor(Math.random() * clients.length)];
      const hour = hours[Math.floor(Math.random() * hours.length)];
      const date = new Date(day);
      date.setHours(hour, 0, 0, 0);

      const status = pickStatus();
      futureBookings.push({
        serviceId: service.id,
        clientName: client.name,
        clientEmail: client.email,
        clientPhone: client.phone,
        date,
        duration: service.duration,
        amount: service.price,
        status,
        paymentStatus: PaymentStatus.UNPAID,
        cancelToken: `seed-cancel-${tokenCounter++}`,
        confirmedAt: status === BookingStatus.CONFIRMED ? new Date() : null,
        cancelledAt: status === BookingStatus.CANCELLED ? new Date() : null,
      });
    }
  }

  // Historique : 40 RDV répartis sur les 18 derniers mois (année courante
  // + année précédente) pour alimenter les stats annuelles.
  const now = new Date();
  for (let i = 0; i < 40; i++) {
    const daysAgo = Math.floor(Math.random() * 540) + 1; // 1 à 540 jours
    const date = new Date(now);
    date.setDate(date.getDate() - daysAgo);
    const jsDay = date.getDay();
    const dow = jsDay === 0 ? 6 : jsDay - 1;
    if (dow === 6) continue;
    const hour = hours[Math.floor(Math.random() * hours.length)];
    date.setHours(hour, 0, 0, 0);

    const service = services[Math.floor(Math.random() * services.length)];
    const client = clients[Math.floor(Math.random() * clients.length)];
    const status =
      Math.random() < 0.1 ? BookingStatus.CANCELLED : BookingStatus.COMPLETED;

    futureBookings.push({
      serviceId: service.id,
      clientName: client.name,
      clientEmail: client.email,
      clientPhone: client.phone,
      date,
      duration: service.duration,
      amount: service.price,
      status,
      paymentStatus:
        status === BookingStatus.COMPLETED ? PaymentStatus.PAID : PaymentStatus.UNPAID,
      cancelToken: `seed-cancel-${tokenCounter++}`,
      confirmedAt: status === BookingStatus.COMPLETED ? date : null,
      cancelledAt: status === BookingStatus.CANCELLED ? new Date(date.getTime() - 86400000) : null,
    });
  }

  for (const data of futureBookings) {
    await prisma.booking.create({ data });
  }

  // ── Avis ───────────────────────────────────────────────────
  await prisma.review.createMany({
    data: [
      {
        author: 'Camille R.',
        rating: 5,
        comment:
          'Excellent accueil, service parfait ! Je reviens à chaque fois avec le sourire.',
        isApproved: true,
      },
      {
        author: 'Lucie M.',
        rating: 5,
        comment: 'Prestation superbe, exactement ce que je voulais. Très bon rapport qualité/prix.',
        isApproved: true,
      },
      {
        author: 'Isabelle T.',
        rating: 4,
        comment: 'Équipe sympathique. Un peu d\'attente mais ça vaut le coup.',
        isApproved: true,
      },
    ],
  });

  console.log('Seeding terminé.');
  console.log(`Admin : ${adminEmail} / ${adminPassword}`);
  console.log(`Frontend : http://localhost:3100/`);
  console.log(`Admin UI : http://localhost:3100/admin/login`);
}

main()
  .catch((e) => {
    console.error('Erreur seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
