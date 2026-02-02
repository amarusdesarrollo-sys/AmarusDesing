/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        pathname: "/**",
      },
    ],
    // Mantener domains para compatibilidad (deprecated en Next.js 15)
    domains: ["res.cloudinary.com"],
    qualities: [75, 80, 85, 90, 95],
  },
};

module.exports = nextConfig;
