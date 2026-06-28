import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ShopProviders } from "./providers";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL("https://buyfest.vercel.app"),

  title: {
    default: "BuyFest - Online Shopping in Bangladesh",
    template: "%s | BuyFest",
  },

  description:
    "BuyFest is your trusted online shopping destination in Bangladesh. Shop electronics, fashion, beauty, home essentials, gadgets, and more at the best prices with fast delivery nationwide.",

  keywords: [
    "BuyFest",
    "BuyFest Bangladesh",
    "online shopping Bangladesh",
    "ecommerce Bangladesh",
    "electronics Bangladesh",
    "fashion Bangladesh",
    "gadgets BD",
    "mobile phones Bangladesh",
    "home appliances Bangladesh",
    "online store Bangladesh",
  ],

  openGraph: {
    title: "BuyFest - Online Shopping in Bangladesh",
    description:
      "Discover electronics, fashion, beauty products, home essentials, gadgets and more at BuyFest with fast delivery across Bangladesh.",
    url: "https://buyfest.vercel.app",
    siteName: "BuyFest",
    locale: "en_US",
    type: "website",

    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "BuyFest",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title: "BuyFest - Online Shopping in Bangladesh",
    description:
      "Shop electronics, fashion, gadgets, beauty products and more with fast delivery across Bangladesh.",
    images: ["/og-image.jpg"],
  },

  alternates: {
    canonical: "https://buyfest.vercel.app",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        <ShopProviders>{children}</ShopProviders>
      </body>
    </html>
  );
}
