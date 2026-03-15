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
    domains: ["res.cloudinary.com"],
    qualities: [75, 80, 85, 90, 95],
  },
  async redirects() {
    return [
      { source: "/joyeria-artesanal", destination: "/categorias/joyeria-artesanal", permanent: true },
      { source: "/macrame", destination: "/categorias/macrame", permanent: true },
      { source: "/minerales-del-mundo", destination: "/categorias/minerales-del-mundo", permanent: true },
      { source: "/tesoros-del-mundo", destination: "/categorias/tesoros-del-mundo", permanent: true },
      { source: "/ropa-artesanal", destination: "/categorias/ropa-artesanal", permanent: true },
      { source: "/coleccion-etiopia", destination: "/categorias/coleccion-etiopia", permanent: true },
    ];
  },
};

module.exports = nextConfig;
