/* eslint-disable @typescript-eslint/no-var-requires */
const {FusesPlugin} = require('@electron-forge/plugin-fuses');
const {FuseV1Options, FuseVersion} = require('@electron/fuses');
const path = require('path');

module.exports = {
  packagerConfig: {
    asar: true,
    icon: 'icon.ico',
    extraResource: [
      path.join(__dirname, 'updater/updater.exe'),
    ],
    ignore: [
      /^\/src($|\/)/,
      /^\/\.ai($|\/)/,
      /^\/\.angular($|\/)/,
      /^\/\.backup($|\/)/,
      /^\/\.vscode($|\/)/,
      /^\/data($|\/)/,
      /^\/doc($|\/)/,
      /^\/openspec($|\/)/,
      /^\/third-party($|\/)/,
      /^\/\.editorconfig$/,
      /^\/\.gitignore$/,
      /^\/angular\.json$/,
      /^\/angular-webpack\.config\.js$/,
      /^\/forge\.config\.js$/,
      /^\/opencode\.json$/,
      /^\/README\.md$/,
      /^\/tsconfig.*\.json$/,
    ],
  },
  rebuildConfig: {},
  makers: [
    {
      name: '@electron-forge/maker-squirrel',
      config: {},
    },
  ],
  plugins: [
    {
      name: '@electron-forge/plugin-auto-unpack-natives',
      config: {},
    },
    new FusesPlugin({
      version: FuseVersion.V1,
      [FuseV1Options.RunAsNode]: false,
      [FuseV1Options.EnableCookieEncryption]: true,
      [FuseV1Options.EnableNodeOptionsEnvironmentVariable]: false,
      [FuseV1Options.EnableNodeCliInspectArguments]: false,
      [FuseV1Options.EnableEmbeddedAsarIntegrityValidation]: false,
      [FuseV1Options.OnlyLoadAppFromAsar]: true,
    }),
  ],
};
