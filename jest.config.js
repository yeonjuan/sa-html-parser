/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  testTimeout: 20000,
  testMatch: ["**/*.test.ts"],
  setupFilesAfterEnv: ["./src/tests/setup-jest.ts"],
};
