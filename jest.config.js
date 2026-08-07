/** @type {import('jest').Config} */
module.exports = {
  projects: [
    {
      displayName: 'domain',
      preset: 'ts-jest',
      testEnvironment: 'node',
      rootDir: '.',
      testMatch: ['<rootDir>/tests/domain/**/*.test.ts'],
      transform: {
        '^.+\\.tsx?$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.jest.json' }],
      },
    },
    {
      displayName: 'data',
      preset: 'ts-jest',
      testEnvironment: 'node',
      rootDir: '.',
      testMatch: ['<rootDir>/tests/data/**/*.test.ts'],
      transform: {
        '^.+\\.tsx?$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.jest.json' }],
      },
    },
  ],
};
