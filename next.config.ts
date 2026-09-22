import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["127.0.0.1"],
  // Фотографии каталога — runtime-данные в shared-каталоге сервера, они не
  // должны попадать в output file tracing API-роутов синхронизации.
  outputFileTracingExcludes: {
    "/api/admin/catalog-sync": ["./public/catalog-images/**/*"],
    "/api/moysklad/webhook": ["./public/catalog-images/**/*"],
  },
};

export default nextConfig;
