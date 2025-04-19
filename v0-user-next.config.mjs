/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable Payload CMS to work with Next.js
  webpack: (config) => {
    config.experiments = {
      ...config.experiments,
      topLevelAwait: true,
    }
    return config
  },
  // Add image domains for MongoDB Atlas and Payload CMS
  images: {
    domains: ['localhost', 'res.cloudinary.com'],
  },
}

export default nextConfig

