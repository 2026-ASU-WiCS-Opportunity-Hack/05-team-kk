const createNextIntlPlugin = require("next-intl/plugin");

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

/** @type {import('next').NextConfig} */
module.exports = withNextIntl({
  transpilePackages: ["@repo/ui", "@repo/supabase"],
});
