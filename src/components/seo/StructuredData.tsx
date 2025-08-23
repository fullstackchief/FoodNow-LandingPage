import Script from 'next/script'

const StructuredData = () => {
  const businessSchema = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "@id": "https://foodnow.ng",
    "name": "FoodNow",
    "alternateName": ["FoodNow Nigeria", "FoodNow Food Delivery"],
    "description": "Lagos' premier food delivery platform offering 15-minute guaranteed delivery from 500+ top restaurants. Nigerian delicacies to international cuisines delivered hot to your doorstep.",
    "url": "https://foodnow.ng",
    "logo": "https://foodnow.ng/logo.png",
    "image": "https://foodnow.ng/og-image.png",
    "telephone": "+2341234567890",
    "email": "hello@usefoodnow.com",
    "foundingDate": "2024",
    "founder": {
      "@type": "Organization",
      "name": "FoodNow Team"
    },
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "Victoria Island",
      "addressLocality": "Lagos",
      "addressRegion": "Lagos State",
      "addressCountry": "Nigeria",
      "postalCode": "100001"
    },
    "geo": {
      "@type": "GeoCoordinates",
      "latitude": "6.4281",
      "longitude": "3.4219"
    },
    "areaServed": [
      {
        "@type": "City",
        "name": "Lagos",
        "addressRegion": "Lagos State",
        "addressCountry": "Nigeria"
      }
    ],
    "serviceArea": {
      "@type": "GeoCircle",
      "geoMidpoint": {
        "@type": "GeoCoordinates",
        "latitude": "6.4281",
        "longitude": "3.4219"
      },
      "geoRadius": "50000"
    },
    "openingHours": "Mo-Su 06:00-23:00",
    "paymentAccepted": ["Cash", "Credit Card", "Debit Card", "Bank Transfer"],
    "currenciesAccepted": "NGN",
    "priceRange": "₦₦",
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.9",
      "reviewCount": "10000",
      "bestRating": "5",
      "worstRating": "1"
    },
    "review": [
      {
        "@type": "Review",
        "reviewRating": {
          "@type": "Rating",
          "ratingValue": "5",
          "bestRating": "5"
        },
        "author": {
          "@type": "Person",
          "name": "Adebayo Johnson"
        },
        "reviewBody": "Amazing service! Food arrived hot in 12 minutes. Best delivery app in Lagos!"
      },
      {
        "@type": "Review",
        "reviewRating": {
          "@type": "Rating",
          "ratingValue": "5",
          "bestRating": "5"
        },
        "author": {
          "@type": "Person",
          "name": "Sarah Ibrahim"
        },
        "reviewBody": "Love the premium restaurants selection. Fast delivery and great customer service."
      }
    ],
    "hasOfferCatalog": {
      "@type": "OfferCatalog",
      "name": "FoodNow Restaurant Partners",
      "itemListElement": [
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Service",
            "name": "Nigerian Food Delivery",
            "description": "Authentic Nigerian dishes including jollof rice, suya, egusi soup and more"
          }
        },
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Service", 
            "name": "International Cuisine Delivery",
            "description": "Pizza, burgers, sushi, Chinese, Indian and continental dishes"
          }
        }
      ]
    },
    "sameAs": [
      "https://www.facebook.com/foodnowng",
      "https://www.instagram.com/foodnowng", 
      "https://twitter.com/foodnowng",
      "https://www.linkedin.com/company/foodnowng"
    ]
  }

  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "FoodNow",
    "alternateName": "FoodNow Food Delivery",
    "url": "https://foodnow.ng",
    "potentialAction": {
      "@type": "SearchAction",
      "target": {
        "@type": "EntryPoint",
        "urlTemplate": "https://foodnow.ng/search?q={search_term_string}"
      },
      "query-input": "required name=search_term_string"
    }
  }

  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "FoodNow",
    "legalName": "FoodNow Nigeria Limited",
    "url": "https://foodnow.ng",
    "logo": "https://foodnow.ng/logo.png",
    "foundingDate": "2024",
    "founders": [
      {
        "@type": "Person",
        "name": "FoodNow Founders"
      }
    ],
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "Victoria Island",
      "addressLocality": "Lagos", 
      "addressRegion": "Lagos State",
      "postalCode": "100001",
      "addressCountry": "Nigeria"
    },
    "contactPoint": [
      {
        "@type": "ContactPoint",
        "telephone": "+2341234567890",
        "contactType": "customer service",
        "email": "hello@usefoodnow.com",
        "availableLanguage": ["English", "Yoruba", "Hausa", "Igbo"]
      }
    ],
    "sameAs": [
      "https://www.facebook.com/foodnowng",
      "https://www.instagram.com/foodnowng",
      "https://twitter.com/foodnowng", 
      "https://www.linkedin.com/company/foodnowng"
    ]
  }

  const serviceSchema = {
    "@context": "https://schema.org",
    "@type": "Service",
    "name": "Premium Food Delivery Service",
    "description": "Fast, reliable food delivery service in Lagos with 15-minute guaranteed delivery from premium restaurants",
    "provider": {
      "@type": "Organization",
      "name": "FoodNow"
    },
    "areaServed": {
      "@type": "City",
      "name": "Lagos",
      "addressCountry": "Nigeria"
    },
    "hasOfferCatalog": {
      "@type": "OfferCatalog",
      "name": "Food Delivery Services",
      "itemListElement": [
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Service",
            "name": "15-Minute Food Delivery"
          },
          "priceRange": "₦500-₦5000"
        }
      ]
    }
  }

  return (
    <>
      <Script
        id="business-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(businessSchema) }}
      />
      <Script
        id="website-schema" 
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
      />
      <Script
        id="organization-schema"
        type="application/ld+json" 
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />
      <Script
        id="service-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceSchema) }}
      />
    </>
  )
}

export default StructuredData