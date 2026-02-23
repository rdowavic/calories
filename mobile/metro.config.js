const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, '..');

const config = getDefaultConfig(projectRoot);

// Watch the monorepo root for shared packages
config.watchFolders = [monorepoRoot];

// Resolve packages from mobile workspace first, then monorepo root
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(monorepoRoot, 'node_modules'),
];

// Force ALL resolutions of 'react' to use mobile's React 19, even when
// react-native (hoisted to root) does require('react') internally.
const mobileReactPath = path.resolve(projectRoot, 'node_modules/react');
const mobileReactNativePath = path.resolve(projectRoot, 'node_modules/react-native');

const originalResolveRequest = config.resolver.resolveRequest;

config.resolver.resolveRequest = (context, moduleName, platform) => {
  // Intercept react resolution from anywhere — always use mobile's React 19
  if (moduleName === 'react') {
    return {
      type: 'sourceFile',
      filePath: path.resolve(mobileReactPath, 'index.js'),
    };
  }

  // Also pin react/jsx-runtime and react/jsx-dev-runtime
  if (moduleName === 'react/jsx-runtime') {
    return {
      type: 'sourceFile',
      filePath: path.resolve(mobileReactPath, 'jsx-runtime.js'),
    };
  }
  if (moduleName === 'react/jsx-dev-runtime') {
    return {
      type: 'sourceFile',
      filePath: path.resolve(mobileReactPath, 'jsx-dev-runtime.js'),
    };
  }

  // Use the default resolver for everything else
  if (originalResolveRequest) {
    return originalResolveRequest(context, moduleName, platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
