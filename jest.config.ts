import type { Config } from 'jest';
import nextJest from 'next/jest.js';

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files
  dir: './',
});

const config: Config = {
  coverageProvider: 'v8',
  testEnvironment: 'node',
  // Only test the crypto lib — not Next.js pages (those need jsdom)
  testMatch: ['**/lib/crypto/**/*.test.ts', '**/lib/crypto/**/__tests__/**/*.test.ts'],
  // Allow importing from @/ alias
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
};

export default createJestConfig(config);
