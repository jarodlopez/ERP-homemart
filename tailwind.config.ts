import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#2563EB", // Azul estándar
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'), // Lo incluimos en package.json, hay que activarlo
  ],
};
export default config;
