/** @type {import('next').NextConfig} */
const nextConfig = {
  // Use standalone output only in Docker builds or when explicitly enabled
  // This avoids Windows symlink permission issues during local development
  output: process.env.DOCKER_BUILD === 'true' ? 'standalone' : undefined,
};

module.exports = nextConfig;
