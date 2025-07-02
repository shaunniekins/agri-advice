/** @type {import('next').NextConfig} */

const nextConfig = {
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "vgckngozsjzlzkrntaoq.supabase.co",
      },
    ],
  },
  output: "export",
  trailingSlash: true,
  // This ensures dynamic routes work in static exports
  basePath: "",
  // This improves performance by setting stricter boundaries for static generation
  staticPageGenerationTimeout: 120,
  // Add this to ensure proper static export behavior
  experimental: {
    missingSuspenseWithCSRBailout: false,
  },
  // Ensure all pages are generated as static files
  generateBuildId: () => "build",
};

export default nextConfig;
