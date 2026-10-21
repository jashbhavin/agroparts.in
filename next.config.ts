import type { NextConfig } from 'next';
const config: NextConfig = { output: 'export', images: { loader: 'custom', loaderFile: './lib/image-loader.ts', deviceSizes: [480, 768, 1200, 1600], imageSizes: [64, 128, 256] }, trailingSlash: true };
export default config;
