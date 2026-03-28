import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  output: "static",
  image: {
    // Allow remote images from Supabase Storage for optimization
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.supabase.co",
      },
    ],
  },
  vite: {
    plugins: [tailwindcss()],
  },
});
