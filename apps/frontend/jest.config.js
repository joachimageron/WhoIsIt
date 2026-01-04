const nextJest = require("next/jest");

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files in your test environment
  dir: "./",
});

// Add any custom config to be passed to Jest
const customJestConfig = {
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
  testEnvironment: "jest-environment-jsdom",
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/$1",
  },
  testMatch: [
    "**/__tests__/**/*.{js,jsx,ts,tsx}",
    "**/*.{spec,test}.{js,jsx,ts,tsx}",
  ],
  collectCoverageFrom: [
    "app/**/*.{js,jsx,ts,tsx}",
    "components/**/*.{js,jsx,ts,tsx}",
    "lib/**/*.{js,jsx,ts,tsx}",
    "store/**/*.{js,jsx,ts,tsx}",
    "!**/*.d.ts",
    "!**/node_modules/**",
    "!**/.next/**",
    "!**/coverage/**",
    "!**/jest.config.js",
    // Configuration files
    "!**/config/**",
    "!**/jest.setup.ts",
    // Type definitions and dictionaries
    "!**/types/**",
    "!**/dictionaries/**",
    // Middleware (routing logic, no unit test needed)
    "!**/middleware.ts",
    // Presentational components (minimal logic)
    "!**/components/primitives.ts",
    "!**/components/icons.tsx",
    // Next.js server components (wrappers for client components)
    "!**/app/**/layout.tsx",
    "!**/app/**/page.tsx",
    "!**/app/**/error.tsx",
    "!**/app/**/providers.tsx",
    "!**/app/**/loading.tsx",
    "!**/app/**/not-found.tsx",
  ],
  coverageDirectory: "coverage",
  testPathIgnorePatterns: ["/node_modules/", "/.next/"],
};

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
module.exports = createJestConfig(customJestConfig);
