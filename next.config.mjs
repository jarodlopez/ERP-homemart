/** @type {import('next').NextConfig} */
const nextConfig = {
  // Esto permite cargar imágenes desde dominios externos si usas ImgBB luego
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'i.ibb.co',
      },
    ],
  },
};

export default nextConfig;
