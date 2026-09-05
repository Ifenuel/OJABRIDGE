import './globals.css';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import ClientProviders from '@/components/ClientProviders';
import { AuthProvider } from '@/context/AuthContext';
import { FavoritesProvider } from '@/context/FavoritesContext';
import { CartProvider } from '@/context/CartContext';

export const metadata = {
  title: {
    default: 'OjaBridge — Shop • Connect • Grow',
    template: '%s | OjaBridge',
  },
  description: 'The trusted bridge between suppliers, retailers and customers. Discover quality products from verified vendors, shop securely and grow your business through one connected marketplace.',
  keywords: ['marketplace', 'e-commerce', 'suppliers', 'vendors', 'customers', 'Nigeria', 'multi-vendor', 'Paystack', 'verified vendors', 'secure payments', 'shop online', 'buy online'],
  authors: [{ name: 'OjaBridge' }],
  openGraph: {
    title: 'OjaBridge — Shop • Connect • Grow',
    description: 'The trusted bridge between suppliers, retailers and customers. Discover quality products from verified vendors.',
    type: 'website',
    locale: 'en_US',
    siteName: 'OjaBridge',
    url: 'https://ojabridge.com',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'OjaBridge — Shop • Connect • Grow',
    description: 'The trusted bridge between suppliers, retailers and customers.',
  },
  robots: {
    index: true,
    follow: true,
  },
  manifest: '/manifest.json',
  icons: {
    icon: '/favicon-logo.png',
    apple: '/favicon-logo.png',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon-logo.png" type="image/png" />
        <link rel="apple-touch-icon" href="/favicon-logo.png" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#5B21B6" />
      </head>
      <body className="font-poppins antialiased min-h-screen flex flex-col">
        <AuthProvider>
          <CartProvider>
            <FavoritesProvider>
              <Navbar />
              <main className="flex-1">{children}</main>
              <Footer />
              <ClientProviders />
            </FavoritesProvider>
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
