module.exports = {
    testEnvironment: "node",
    testTimeout: 10000, // Set timeout for async tests
    coverageDirectory: "coverage",
    collectCoverage: true, // Enable coverage collection
    collectCoverageFrom: [
      "src/**/*.js",
      "!src/config/**", // Exclude config files
      "!src/routes/**", // Exclude route files (tested indirectly via controllers)
      "!src/server.js", // Exclude server entry point
    ],
    coverageThreshold: {
      global: {
        branches: 90,
        functions: 95,
        lines: 95,
        statements: 95,
      },
    },
    setupFilesAfterEnv: ["jest-extended/all"], // Load additional matchers
  };
  