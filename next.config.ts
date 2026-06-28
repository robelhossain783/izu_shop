

const backendUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://127.0.0.1:8000";

let remotePatterns = [
  {
    protocol: "https",
    hostname: "images.unsplash.com",

  },
  {
    protocol: "https",
    hostname: "res.cloudinary.com",

  },
];

try {
  const parsedUrl = new URL(backendUrl);
  remotePatterns.push({
    protocol: parsedUrl.protocol.replace(":", ""),
    hostname: parsedUrl.hostname,
  });
} catch (e) {
  remotePatterns.push({
    protocol: "http",
    hostname: "127.0.0.1",
  });
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  trailingSlash: true,
  images: {
    remotePatterns,
  },
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${backendUrl}/api/:path*`,
      },
      {
        source: "/media/:path*",
        destination: `${backendUrl}/media/:path*`,
      },
      {
        source: "/orders",
        destination: "/izu_shop/orders",
      },
      {
        source: "/cart",
        destination: "/izu_shop/cart",
      },
      {
        source: "/auth",
        destination: "/izu_shop/auth",
      },
      {
        source: "/profile",
        destination: "/izu_shop/profile",
      },
      {
        source: "/checkout",
        destination: "/izu_shop/checkout",
      },
      {
        source: "/checkout/:slug",
        destination: "/izu_shop/checkout/:slug",
      },
      {
        source: "/product/:slug",
        destination: "/izu_shop/product/:slug",
      },
      {
        source: "/category/:slug",
        destination: "/izu_shop/category/:slug",
      },
      {
        source: "/all-products",
        destination: "/izu_shop/all-products",
      },
    ];
  },
};

module.exports = nextConfig;