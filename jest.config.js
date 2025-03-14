const nextJest = require('next/jest')

const createJestConfig = nextJest({
  dir: './',
})

const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jest-environment-jsdom',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    '^lucide-react$':
      '<rootDir>/node_modules/lucide-react/dist/cjs/lucide-react.js',
  },
  transformIgnorePatterns: ['/node_modules/(?!lucide-react).+\\.js$'],
  testTimeout: 10000,
}

module.exports = createJestConfig(customJestConfig)
