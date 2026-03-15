import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const computeAsarHash = () => {
  const outDir = path.join(__dirname, '..', 'out');
  const platform = process.platform;
  const arch = process.arch;
  const appName = 'whitecloud';

  let appDir;
  if (platform === 'win32') {
    appDir = path.join(outDir, `${appName}-win32-${arch}`, 'resources');
  } else {
    console.error(`Unsupported platform: ${platform}`);
    process.exit(1);
  }

  const asarPath = path.join(appDir, 'app.asar');

  if (!fs.existsSync(asarPath)) {
    console.error(`app.asar not found at: ${asarPath}`);
    process.exit(1);
  }

  const hash = crypto.createHash('sha1');
  const stream = fs.createReadStream(asarPath);

  stream.on('data', (chunk) => {
    hash.update(chunk);
  });

  stream.on('end', () => {
    const fileHash = hash.digest('hex').substring(0, 10);
    // eslint-disable-next-line no-console
    console.log(`app.asar hash: ${fileHash}`);
    stream.destroy();
  });

  stream.on('error', (err) => {
    console.error('Error computing hash:', err);
    stream.destroy();
    process.exit(1);
  });
};

computeAsarHash();
