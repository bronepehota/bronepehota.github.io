const nextJest = require('next/jest')

const createJestConfig = nextJest({
  dir: './',
})

const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jest-environment-jsdom',
  clearMocks: true,
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  testMatch: [
    '**/__tests__/**/*.(test|spec).(ts|tsx)',
  ],
  testPathIgnorePatterns: [
    '/node_modules/',
    '/e2e/',
    // Stale git worktrees under .claude/worktrees carry full test copies that
    // fail on their missing setup — never run tests from there.
    '/.claude/',
  ],
}

module.exports = createJestConfig(customJestConfig)
