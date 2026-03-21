import {app} from 'electron';
import net from 'net';
import path from 'path';
import readline from 'readline';
import fs from 'fs';
import sudo from '@vscode/sudo-prompt';
import {ExError} from '@sora-soft/framework';

const PIPE_NAME = '\\\\.\\pipe\\GameSaveMonitorPipe';
export class EtwManager {
  static async startMonitor(pids: number[], callback: (file: string) => void) {
    if (this.server_ || this.stream_) {
      throw new Error('duplicate start');
    }

    const etwExe = path.join(app.isPackaged ? process.resourcesPath : path.join(app.getAppPath(), 'exe', 'etw'), 'EtwMonitor.exe');
    var options = {
      name: 'Whitecloud',
    };

    await new Promise<void>((resolve, reject) => {
      const filePathSet = new Set();

      this.server_ = net.createServer((stream) => {
        this.stream_ = stream;
        console.log('ETW 探针已成功连接到管道！');

        const rl = readline.createInterface({
          input: stream,
          crlfDelay: Infinity // 兼容处理 \r\n 和 \n
        });

        rl.on('line', async (line) => {
          if (line.startsWith('error:')) {
            console.log(line);
            return;
          }

          const filePath = line.trim();
          if (filePath) {
            if (filePathSet.has(filePath))
              return;

            filePathSet.add(filePath);

            console.log('ETW 探针收到消息(完整路径)：', filePath);
            callback(filePath);
          }
        });

        stream.on('end', () => {
          console.log('ETW 探针断开连接。');
          rl.close();
          this.closeMonitor();
        });

        resolve();
      });

      this.server_.listen(PIPE_NAME, () => {
        console.log(`正在监听管道: ${PIPE_NAME}`);
        sudo.exec(`${etwExe} ${process.pid} ${PIPE_NAME} ${pids.join(' ')}`, options, (err, stdout, stderr) => {
          if (err) {
            console.log(err);
            if (err.message === 'User did not grant permission.') {
              err = new ExError('ERR_NEED_ADMIN', 'AdminError', 'User did not grant permission.');
            }
            reject(err);
            this.closeMonitor();
          }
        });
      });
    });
  }

  static async closeMonitor() {
    console.log('close monitor');
    if (this.stream_ && !this.stream_.closed) {
      this.stream_.write('close\r\n');
    }

    if (this.server_ && this.server_.listening) {
      console.log('close server');
      this.server_.close();
    }

    this.stream_ = undefined;
    this.server_ = undefined;
  }

  private static server_?: net.Server;
  private static stream_?: net.Socket;
}
