const { getDefaultConfig } = require('expo/metro-config')
const path = require('path')

const projectRoot = __dirname
const monorepoRoot = path.resolve(projectRoot, '../..')

const config = getDefaultConfig(projectRoot)

// Watch all files in the monorepo
config.watchFolders = [monorepoRoot]

// Let Metro know where to resolve packages
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(monorepoRoot, 'node_modules'),
]

// Fix pnpm symlink issues
config.resolver.unstable_enableSymlinks = true
config.resolver.unstable_enablePackageExports = true

// Extra node modules for monorepo
config.resolver.extraNodeModules = {
  '@treni/shared': path.resolve(monorepoRoot, 'packages/shared'),
}

module.exports = config
