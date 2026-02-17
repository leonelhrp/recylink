import { ModuleFederationConfig } from '@nx/module-federation';

const config: ModuleFederationConfig = {
  name: 'webEvents',
  exposes: {
    './Module': './src/remote-entry.ts',
  },
  shared: (libraryName, sharedConfig) => {
    if (libraryName.startsWith('@hookform/resolvers')) {
      return { ...sharedConfig, singleton: false, strictVersion: false };
    }
    return undefined;
  },
};

/**
 * Nx requires a default export of the config to allow correct resolution of the module federation graph.
 **/
export default config;
