/** @type {import('next').NextConfig} */
const FILE_SERVER_URL = (process.env.FILE_SERVER_URL || 'http://file-storage:3010').replace(/\/$/, '');

const nextConfig = {
  distDir: process.env.NEXT_DIST_DIR || '.next',
  reactStrictMode: true,
  swcMinify: true,
  // Phục vụ file từ container `file-storage` (RAM ~6MB) qua đường dẫn /media/pofology/...
  async rewrites() {
    return [
      {
        source: '/media/:path*',
        destination: `${FILE_SERVER_URL}/files/:path*`,
      },
    ];
  },
}

module.exports = nextConfig
