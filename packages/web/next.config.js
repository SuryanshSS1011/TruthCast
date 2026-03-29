/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
    // Mark pipeline and its native dependencies as external to avoid webpack bundling issues
    serverComponentsExternalPackages: [
      'better-sqlite3',
      '@solana/web3.js',
      '@solana/spl-memo',
      '@truthcast/pipeline',
      '@google/generative-ai',
    ],
    esmExternals: 'loose',
  },
  transpilePackages: ['@truthcast/shared'],
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Mark native modules and pipeline as external to prevent bundling issues
      config.externals.push(
        'better-sqlite3',
        '@solana/web3.js',
        '@solana/spl-memo',
        '@truthcast/pipeline',
        '@google/generative-ai',
      );

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
