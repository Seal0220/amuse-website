/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: { serverActions: true },
  env: {
    NEXT_PUBLIC_BASE_URL: ''
  },
};

export default nextConfig;
