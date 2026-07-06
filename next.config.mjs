/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'www.mindandbodyresetcoach.com' },
      { protocol: 'https', hostname: 'mindandbodyresetcoach.com' },
      { protocol: 'https', hostname: 'pub-c6f7a165acb046c283b129a93cb2c8ec.r2.dev' },
      { protocol: 'https', hostname: 'cdn.shopify.com' },
      { protocol: 'https', hostname: '**.wsimg.com' },
      { protocol: 'https', hostname: 'i.ytimg.com' },
      { protocol: 'https', hostname: 'img.youtube.com' },
    ],
  },
};

export default nextConfig;
