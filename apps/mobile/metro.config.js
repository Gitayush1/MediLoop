const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// Watch all files in the monorepo
config.watchFolders = [monorepoRoot];

// Resolve modules from mobile package first, then monorepo
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(monorepoRoot, 'node_modules'),
];

const findPackage = (pkg) => {
  try {
    return path.dirname(require.resolve(`${pkg}/package.json`, { paths: [projectRoot, monorepoRoot] }));
  } catch (e) {
    return path.resolve(monorepoRoot, 'node_modules', pkg);
  }
};

// Force single-instance React resolution across the monorepo
config.resolver.extraNodeModules = {
  react: findPackage('react'),
  'react-dom': findPackage('react-dom'),
  'react-native': findPackage('react-native'),
  'react-native-web': findPackage('react-native-web'),
  '@mediloop/shared': path.resolve(monorepoRoot, 'packages/shared/src/index.ts'),
};

module.exports = config;
