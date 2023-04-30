module.exports = {
  testEnvironment: "jsdom",
  setupFilesAfterEnv: ["<rootDir>/.jest/jest.setup.ts"],
  testPathIgnorePatterns: ["<rootDir>/dist/", "<rootDir>/node_modules/"],
  roots: ["./src"],
  collectCoverageFrom: [
    "src/**/*.{ts,tsx}",
    "!src/**/*stories.tsx",
    "!src/index.ts",
    "!src/types/*",
  ],
};
