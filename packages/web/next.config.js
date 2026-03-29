/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
    serverComponentsExternalPackages: ['better-sqlite3', '@solana/web3.js'],
    esmExternals: 'loose',
  },
  transpilePackages: ['@truthcast/shared', '@truthcast/pipeline'],
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Mark native modules as external
      config.externals.push('better-sqlite3', '@solana/web3.js');

      // Resolve .ts files when .js is requested (for ES module imports)
      config.resolve.extensionAlias = {
        '.js': ['.js', '.ts'],
        '.mjs': ['.mjs', '.mts'],
      };
    }
    return config;
  },
}

module.exports = nextConfig
