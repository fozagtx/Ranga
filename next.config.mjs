/** @type {import('next').NextConfig} */
const nextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  turbopack: {
    root: process.cwd(),
  },
  webpack: (config, { webpack }) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      buffer: "buffer/",
      crypto: "crypto-browserify",
      fs: false,
      net: false,
      os: false,
      path: false,
      process: "process/browser",
      stream: "stream-browserify",
      tls: false,
      util: "util/",
    };
    config.resolve.alias = {
      ...config.resolve.alias,
      "@react-native-async-storage/async-storage": false,
    };
    config.plugins.push(
      new webpack.ProvidePlugin({
        Buffer: ["buffer", "Buffer"],
        process: "process/browser",
      }),
    );
    return config;
  },
};

export default nextConfig;
