import type { NextConfig } from "next";
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

const nextConfig: NextConfig = {
  transpilePackages: ['react-map-gl', 'mapbox-gl', '@treni/shared'],
};

export default withNextIntl(nextConfig);
