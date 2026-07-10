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
      { protocol: 'https', hostname: 'd2xsxph8kpxj0f.cloudfront.net' },
      { protocol: 'https', hostname: 'cdn.mindandbodyresetcoach.com' },
    ],
  },
  async redirects() {
    return [
      // ── Legacy site URLs still ranking in Google Search Console ──
      { source: '/about-us', destination: '/about', permanent: true },
      { source: '/about-us/', destination: '/about', permanent: true },
      { source: '/privacy-policy', destination: '/privacy', permanent: true },
      { source: '/privacy-policy/', destination: '/privacy', permanent: true },
      { source: '/mini-reset-plan-quiz', destination: '/food-quiz', permanent: true },
      { source: '/mini-reset-plan-quiz/', destination: '/food-quiz', permanent: true },
      { source: '/terms-of-service', destination: '/terms', permanent: true },
      { source: '/terms-of-service/', destination: '/terms', permanent: true },
      { source: '/terms-and-conditions', destination: '/terms', permanent: true },
      { source: '/contact', destination: '/book', permanent: true },
      { source: '/contact-us', destination: '/book', permanent: true },
      { source: '/contact-us/', destination: '/book', permanent: true },
      { source: '/coaching', destination: '/reclaim', permanent: true },
      { source: '/coaching/', destination: '/reclaim', permanent: true },
      { source: '/services', destination: '/reclaim', permanent: true },
      // Legacy blog index ONLY. Never redirect /blog/* files — static assets live under public/blog/
      // and covers also live on Cloudflare R2 (cdn.mindandbodyresetcoach.com).
      { source: '/blog', destination: '/health-wellness-blog', permanent: true },
      { source: '/blog/', destination: '/health-wellness-blog', permanent: true },
      // Intentionally NO /blog/:slug catch-all — it hijacked image URLs like /blog/foo.png

      // Old show-notes slug (wrong video binding) → correct Tiny Movements episode
      {
        source: '/midlife-health-podcast/exercise-snacks-2-minute-movement-habit',
        destination: '/midlife-health-podcast/could-tiny-movements-transform-your-energy-levels',
        permanent: true,
      },

      // ── Duplicate product page: canonicalize to /unicity ──
      { source: '/feel-great-system', destination: '/unicity', permanent: true },
      { source: '/feel-great-system/', destination: '/unicity', permanent: true },

      // ── Dated FPU event landing (May 12 cohort) → evergreen FPU page ──
      { source: '/fpu-may-12', destination: '/financial-peace', permanent: true },
      { source: '/fpu-may-12/', destination: '/financial-peace', permanent: true },

      // ── Blog slug aliases (static short slugs → full published slugs) ──
      {
        source: '/health-wellness-blog/calming-food-noise',
        destination: '/health-wellness-blog/calming-food-noise-drop-the-food-courtroom',
        permanent: true,
      },
      {
        source: '/health-wellness-blog/midlife-body-image',
        destination: '/health-wellness-blog/midlife-body-image-your-body-is-not-a-before-picture',
        permanent: true,
      },
      {
        source: '/health-wellness-blog/embrace-reflection',
        destination: '/health-wellness-blog/embrace-reflection-shifting-from-fault-finding-to-self-awareness',
        permanent: true,
      },

      // ── Trailing-slash normalization for key marketing URLs ──
      { source: '/about/', destination: '/about', permanent: true },
      { source: '/reclaim/', destination: '/reclaim', permanent: true },
      { source: '/unicity/', destination: '/unicity', permanent: true },
      { source: '/food-quiz/', destination: '/food-quiz', permanent: true },
      { source: '/book/', destination: '/book', permanent: true },
    ];
  },
};

export default nextConfig;
