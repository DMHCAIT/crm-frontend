module.exports = {
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/crm-backend-main/setupTests.js', '<rootDir>/crm-frontend-main/src/setupTests.ts'],
  roots: ['<rootDir>/crm-backend-main/__tests__', '<rootDir>/crm-frontend-main/src/__tests__'],
  transform: {
    '^.+\\.tsx?$': 'ts-jest',
  },
  moduleFileExtensions: ['js', 'jsx', 'ts', 'tsx', 'json', 'node'],
};