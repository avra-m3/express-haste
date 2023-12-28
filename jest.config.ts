import type {Config} from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  coveragePathIgnorePatterns: ['/node_modules/', '/dist/', '/docs/'],
  modulePathIgnorePatterns: ['/node_modules/', '/dist/', '/docs/'],
};

export default config;