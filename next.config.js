/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config) => {
    // public/data 폴더의 JSON 파일을 import할 수 있도록 설정
    config.resolve.alias = {
      ...config.resolve.alias,
      '@/data': require('path').resolve(__dirname, 'public/data'),
    };
    return config;
  },
}

module.exports = nextConfig

