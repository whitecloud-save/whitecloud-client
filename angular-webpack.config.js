/* eslint-disable*/
const fs = require('fs');
const path = require('path');

module.exports = (config, options) => {
  config.target = 'electron-renderer';

  if (options.fileReplacements) {
    for (const fileReplacement of options.fileReplacements) {
      if (fileReplacement.replace !== 'src/environments/environment.ts') {
        continue;
      }

      const fileReplacementParts = fileReplacement['with'].split('.');
      if (fileReplacementParts.length > 1 && ['web'].indexOf(fileReplacementParts[1]) >= 0) {
        config.target = 'web';
      }
      break;
    }
  }

  const packageFile = fs.readFileSync(path.join(__dirname, 'package.json')).toString();
  const pkg = JSON.parse(packageFile);
  const lib = Object.keys(pkg.dependencies);

  const ignoreLibrary = [
    'electron',
    'electron/main',
    'fs/promise',
    'fs',
    'path',
    'crypto',
    'child_process',
    ...lib,
  ];
  config.externals = [
    ({_, request}, callback) => {
      if (ignoreLibrary.indexOf(request) >= 0) {
        return callback(null, 'require(\'' + request + '\')');
      }
      return callback();
    },
  ];

  config.plugins = [
    ...config.plugins,
  ];

  return config;
};
