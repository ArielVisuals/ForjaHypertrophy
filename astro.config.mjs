import { defineConfig } from 'astro/config';

import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';
import vercel from '@astrojs/vercel';
import clerk from '@clerk/astro';
import { dark } from "@clerk/themes";

// https://astro.build/config
export default defineConfig({
  output: 'server',
  adapter: vercel(),
  integrations: [
    react(), 
    clerk({
      appearance: {
        baseTheme: dark,
        variables: {
          colorPrimary: "#3b82f6",
          colorBackground: "#0A0A0B",
          colorText: "#ffffff",
          colorInputBackground: "#18181b",
          colorInputText: "#ffffff",
        }
      }
    })
  ],

  vite: {
    plugins: [tailwindcss()]
  }
});