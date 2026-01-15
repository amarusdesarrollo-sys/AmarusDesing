/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ["res.cloudinary.com"],
    qualities: [75, 80, 85, 90, 95],
  },
};

module.exports = nextConfig;
