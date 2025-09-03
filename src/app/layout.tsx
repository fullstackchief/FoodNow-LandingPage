import type { Metadata } from 'next'
import { Inter, Poppins, Nunito } from 'next/font/google'
import StructuredData from '@/components/seo/StructuredData'
import PWAInit from '@/components/pwa/PWAInit'
import MobileNavigation from '@/components/ui/MobileNavigation'
import { AdminProvider } from '@/contexts/AdminContext'
import { EnhancedAdminProvider } from '@/contexts/EnhancedAdminContext'
import { LocationProvider } from '@/contexts/LocationContext'
import { AuthProvider } from '@/contexts/AuthContext'
import StoreProvider from '@/store/StoreProvider'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['600', '700', '800', '900'],
  variable: '--font-poppins',
  display: 'swap',
})

const nunito = Nunito({
  subsets: ['latin'],
  weight: ['400', '600', '700', '800', '900'],
  variable: '--font-nunito',
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    default: 'FoodNow - Premium Food Delivery in Lagos, Nigeria | 15-Min Fast Delivery',
    template: '%s | FoodNow - Premium Food Delivery'
  },
  description: 'Lagos\' #1 premium food delivery platform. Order from 500+ top restaurants with 15-minute guaranteed delivery. Nigerian dishes, international cuisine, and more delivered hot to your doorstep in Victoria Island, Lekki, Ikeja.',
  keywords: [
    'food delivery Lagos',
    'Nigerian food delivery',
    'fast food delivery Nigeria',
    'restaurants Lagos',
    'online food ordering',
    'jollof rice delivery',
    'suya delivery Lagos',
    'premium food delivery',
    'Victoria Island food delivery',
    'Lekki food delivery',
    'Ikeja food delivery',
    '15 minute delivery',
    'instant food delivery'
  ],
  authors: [{ name: 'FoodNow Team', url: 'https://foodnow.ng' }],
  creator: 'FoodNow',
  publisher: 'FoodNow Nigeria Limited',
  category: 'Food & Beverage',
  classification: 'Food Delivery Service',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://foodnow.ng'),
  alternates: {
    canonical: 'https://foodnow.ng',
    languages: {
      'en-NG': 'https://foodnow.ng',
      'en': 'https://foodnow.ng/en'
    }
  },
  openGraph: {
    title: 'FoodNow - Lagos\' Premier Food Delivery | 15-Min Guaranteed Delivery',
    description: 'Order from 500+ premium restaurants in Lagos. Nigerian delicacies to international cuisines delivered hot in 15 minutes. Available in VI, Lekki, Ikeja & more.',
    url: 'https://foodnow.ng',
    siteName: 'FoodNow',
    locale: 'en_NG',
    type: 'website',
    countryName: 'Nigeria',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'FoodNow - Premium Food Delivery in Lagos with phone mockup showing Nigerian restaurants',
        type: 'image/png',
      },
      {
        url: '/og-image-square.png',
        width: 600,
        height: 600,
        alt: 'FoodNow Logo - Premium Food Delivery',
        type: 'image/png',
      }
    ],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@foodnowng',
    creator: '@foodnowng',
    title: 'FoodNow - Lagos\' #1 Food Delivery | Order Nigerian Food in 15 Minutes',
    description: 'From jollof rice to suya - get your favorite Nigerian dishes delivered hot in 15 minutes. 500+ restaurants, premium quality, unbeatable speed. 🍛🚀',
    images: [{
      url: '/twitter-image.png',
      alt: 'FoodNow - Premium Food Delivery in Lagos',
      width: 1200,
      height: 600,
    }],
  },
  robots: {
    index: true,
    follow: true,
    noarchive: false,
    nosnippet: false,
    noimageindex: false,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'your-google-verification-code',
    other: {
      'facebook-domain-verification': 'your-facebook-verification-code',
    }
  },
  other: {
    'mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'default',
    'theme-color': '#FF6B35',
    'msapplication-TileColor': '#FF6B35',
    'application-name': 'FoodNow',
  }
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${inter.variable} ${poppins.variable} ${nunito.variable}`}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        
        {/* PWA Manifest */}
        <link rel="manifest" href="/manifest.json" />
        
        {/* Mobile optimization */}
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover" />
        
        {/* Apple PWA meta tags */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="FoodNow" />
        <link rel="apple-touch-icon" href="/images/icons/icon-192x192.png" />
        <link rel="apple-touch-startup-image" href="/images/splash/splash-640x1136.png" media="(device-width: 320px) and (device-height: 568px) and (-webkit-device-pixel-ratio: 2)" />
        <link rel="apple-touch-startup-image" href="/images/splash/splash-750x1334.png" media="(device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2)" />
        <link rel="apple-touch-startup-image" href="/images/splash/splash-1242x2208.png" media="(device-width: 414px) and (device-height: 736px) and (-webkit-device-pixel-ratio: 3)" />
        
        {/* Microsoft PWA meta tags */}
        <meta name="msapplication-TileImage" content="/images/icons/icon-144x144.png" />
        <meta name="msapplication-TileColor" content="#FF6B35" />
        <meta name="msapplication-navbutton-color" content="#FF6B35" />
        
        {/* Theme and styling */}
        <meta name="theme-color" content="#FF6B35" />
        <meta name="background-color" content="#FFFFFF" />
        
        {/* Security headers */}
        <meta httpEquiv="X-Content-Type-Options" content="nosniff" />
        <meta httpEquiv="X-Frame-Options" content="DENY" />
        <meta httpEquiv="X-XSS-Protection" content="1; mode=block" />
      </head>
      <body className={`${inter.className} antialiased`}>
        {process.env.NODE_ENV === 'development' && (
          <script
            dangerouslySetInnerHTML={{
              __html: `
                // Development cache cleanup to prevent HMR issues
                (function() {
                  // Unregister all service workers
                  if ('serviceWorker' in navigator) {
                    navigator.serviceWorker.getRegistrations().then(function(registrations) {
                      for(let registration of registrations) {
                        registration.unregister();
                        console.log('[Dev] Unregistered service worker:', registration.scope);
                      }
                    });
                  }
                  
                  // Clear all caches
                  if ('caches' in window) {
                    caches.keys().then(function(names) {
                      for (let name of names) {
                        caches.delete(name);
                        console.log('[Dev] Cleared cache:', name);
                      }
                    });
                  }
                  
                  // Clear module cache on page visibility change
                  document.addEventListener('visibilitychange', function() {
                    if (document.hidden) return;
                    // Clear session storage HMR cache
                    try {
                      const keys = Object.keys(sessionStorage);
                      keys.forEach(key => {
                        if (key.includes('webpack') || key.includes('turbopack') || key.includes('module')) {
                          sessionStorage.removeItem(key);
                        }
                      });
                    } catch (e) {}
                  });
                  
                  // Add cache-busting for development
                  window.__CACHE_BUST_ID__ = Date.now();
                })();
              `,
            }}
          />
        )}
        <StructuredData />
        <StoreProvider>
          <LocationProvider>
            <AuthProvider>
              <AdminProvider>
                <EnhancedAdminProvider>
                  <div id="root">
                    {children}
                  </div>
                  <MobileNavigation />
                  <PWAInit />
                </EnhancedAdminProvider>
              </AdminProvider>
            </AuthProvider>
          </LocationProvider>
        </StoreProvider>
      </body>
    </html>
  )
}