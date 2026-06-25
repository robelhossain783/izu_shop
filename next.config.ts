

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
    ];
  },
};

module.exports = nextConfig;