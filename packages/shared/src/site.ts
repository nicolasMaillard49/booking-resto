// ============================================================
// Site Config — éditer ce fichier au fork pour personnaliser.
// Partagé entre backend et frontend.
// ============================================================

export const siteConfig = {
  name: 'Booking Pro',
  type: 'demo',
  description:
    'Template de réservation en ligne pour artisans, prestataires et indépendants.',
  foundedYear: 2024,
  contact: {
    phone: '02 00 00 00 00',
    email: 'contact@example.fr',
    address: '1 rue Exemple',
    city: 'Angers',
    postalCode: '49000',
  },
  branding: {
    primaryColor: '#6366f1',
    logo: '/logo.svg',
  },
  booking: {
    acceptPayment: false,
    stripePublicKey: '',
  },
} as const;

export type SiteConfig = typeof siteConfig;
