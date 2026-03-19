import {app} from 'electron';
import net from 'net';
import path from 'path';
import readline from 'readline';
import fs from 'fs';
import sudo from '@vscode/sudo-prompt';

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

    const result = await new Promise<{server: net.Server, stream: net.Socket}>((resolve, reject) => {
      const filePathSet = new Set();

      const server = net.createServer((stream) => {
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

        resolve({
          server,
          stream,
        });
      });

      server.listen(PIPE_NAME, () => {
        console.log(`正在监听管道: ${PIPE_NAME}`);
        sudo.exec(`${etwExe} ${process.pid} ${PIPE_NAME} ${pids.join(' ')}`, options, (err, stdout, stderr) => {
          if (err) {
            console.log(err);
            reject(err);
            this.closeMonitor();
          }
        });
      });
    });

    this.server_ = result.server;
    this.stream_ = result.stream;
  }

  static async closeMonitor() {
    if (this.stream_ && !this.stream_.closed) {
      this.stream_.write('close\r\n');
    }

    if (this.server_ && this.server_.listening) {
      this.server_.close();
    }

    this.stream_ = undefined;
    this.server_ = undefined;
  }

  private static server_?: net.Server;
  private static stream_?: net.Socket;
}
