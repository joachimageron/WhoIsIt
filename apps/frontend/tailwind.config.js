const { heroui } = require("@heroui/theme");

/**
 * Tailwind CSS configuration with Hero UI semantic colors customization.
 * 
 * Semantic colors configured:
 * - Primary (Brand): #F07507 (Orange) with shades 100-900
 * - Success: #08D877 (Green) with shades 100-900
 * - Warning: #FFE207 (Yellow) with shades 100-900
 * - Danger: #FF5959 (Red) with shades 100-900
 * - Secondary (Info): #06BBE8 (Cyan) with shades 100-900
 * 
 * Colors are identical for both light and dark themes.
 * 
 * @type {import('tailwindcss').Config}
 */
const config = {
  content: [
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    "./node_modules/@heroui/theme/dist/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-sans)"],
        mono: ["var(--font-mono)"],
      },
    },
  },
  darkMode: "class",
  plugins: [
    heroui({
      themes: {
        light: {
          colors: {
            primary: {
              100: "#FEEECC",
              200: "#FDD99B",
              300: "#FABC68",
              400: "#F6A042",
              500: "#F07507",
              600: "#CE5905",
              700: "#AC4103",
              800: "#8B2D02",
              900: "#731F01",
              DEFAULT: "#F07507",
              foreground: "#FFFFFF",
            },
            success: {
              100: "#CCFDD2",
              200: "#9AFBB0",
              300: "#66F395",
              400: "#40E788",
              500: "#08D877",
              600: "#05B977",
              700: "#049B73",
              800: "#027D68",
              900: "#016760",
              DEFAULT: "#08D877",
              foreground: "#FFFFFF",
            },
            warning: {
              100: "#FFFBCD",
              200: "#FFF79B",
              300: "#FFF16A",
              400: "#FFEB45",
              500: "#FFE207",
              600: "#DBBF05",
              700: "#B79E03",
              800: "#937D02",
              900: "#7A6601",
              DEFAULT: "#FFE207",
              foreground: "#000000",
            },
            danger: {
              100: "#FFE9DD",
              200: "#FFCDBC",
              300: "#FFAC9B",
              400: "#FF8D82",
              500: "#FF5959",
              600: "#DB414E",
              700: "#B72C44",
              800: "#931C3B",
              900: "#7A1135",
              DEFAULT: "#FF5959",
              foreground: "#FFFFFF",
            },
            secondary: {
              100: "#CCFDF8",
              200: "#9AFCFA",
              300: "#67F0F8",
              400: "#40DBF1",
              500: "#06BBE8",
              600: "#0492C7",
              700: "#036DA7",
              800: "#014E86",
              900: "#01386F",
              DEFAULT: "#06BBE8",
              foreground: "#FFFFFF",
            },
          },
        },
        dark: {
          colors: {
            primary: {
              100: "#731F01",
              200: "#8B2D02",
              300: "#AC4103",
              400: "#CE5905",
              500: "#F07507",
              600: "#F6A042",
              700: "#FABC68",
              800: "#FDD99B",
              900: "#FEEECC",
              DEFAULT: "#F07507",
              foreground: "#FFFFFF",
            },
            success: {
              100: "#016760",
              200: "#027D68",
              300: "#049B73",
              400: "#05B977",
              500: "#08D877",
              600: "#40E788",
              700: "#66F395",
              800: "#9AFBB0",
              900: "#CCFDD2",
              DEFAULT: "#08D877",
              foreground: "#FFFFFF",
            },
            warning: {
              100: "#7A6601",
              200: "#937D02",
              300: "#B79E03",
              400: "#DBBF05",
              500: "#FFE207",
              600: "#FFEB45",
              700: "#FFF16A",
              800: "#FFF79B",
              900: "#FFFBCD",
              DEFAULT: "#FFE207",
              foreground: "#000000",
            },
            danger: {
              100: "#7A1135",
              200: "#931C3B",
              300: "#B72C44",
              400: "#DB414E",
              500: "#FF5959",
              600: "#FF8D82",
              700: "#FFAC9B",
              800: "#FFCDBC",
              900: "#FFE9DD",
              DEFAULT: "#FF5959",
              foreground: "#FFFFFF",
            },
            secondary: {
              100: "#01386F",
              200: "#014E86",
              300: "#036DA7",
              400: "#0492C7",
              500: "#06BBE8",
              600: "#40DBF1",
              700: "#67F0F8",
              800: "#9AFCFA",
              900: "#CCFDF8",
              DEFAULT: "#06BBE8",
              foreground: "#FFFFFF",
            },
          },
        },
      },
    }),
  ],
};

module.exports = config;