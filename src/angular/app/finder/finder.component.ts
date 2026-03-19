import {Component, Inject, NgZone} from '@angular/core';
import {FormControl} from '@angular/forms';
import {mainAPI} from 'app/library/api/main-api';
import {workerAPI} from 'app/library/api/worker-api';
import {PathUtil} from 'app/library/path-util';
import {IconService} from 'app/service/icon.service';
import {ProcessEventType, ProcessMonitorService} from 'app/service/process-monitor.service';
import {ExePath, GamePath} from 'main';
import {NzMessageService} from 'ng-zorro-antd/message';
import {NzModalService} from 'ng-zorro-antd/modal';
import {debounceTime, interval} from 'rxjs';

@Component({
  selector: 'app-root',
  templateUrl: './finder.component.html',
  styleUrl: './finder.component.scss',
})
export class FinderComponent {
  topWindowControl = new FormControl(false);
  step = 1;
  runningProcess: {exePath: string; pid: number;}[] = [];
  attachedSavePathSet: Set<string> = new Set();
  savePathSelection: string[] = [];
  copied?: string | null = null;
  ended = false;

  constructor(
    @Inject(GamePath) public gamePath: string,
    @Inject(ExePath) public exePath: string,
    public iconService: IconService,
    private processMonitorService: ProcessMonitorService,
    private messageService: NzMessageService,
    private zone: NgZone,
    private modal: NzModalService,
  ) {
    this.topWindowControl.valueChanges.pipe(
      debounceTime(500),
    ).subscribe(async (value) => {
      if (value === null)
        return;

      mainAPI.window.setWindowTop(value);
    });

    const sub = this.processMonitorService.registerObservable(gamePath);
    sub.subscribe((event) => {
      switch(event.type) {
        case ProcessEventType.Start: {
          this.runningProcess.push({
            exePath: event.exeFilePath,
            pid: event.pid,
          });
          break;
        }
        case ProcessEventType.End: {
          this.runningProcess = this.runningProcess.filter(p => p.pid !== event.pid);
          if (!this.runningProcess.length && this.step === 3) {
            this.endEtwMonitor();
          }
          break;
        }
      }
    });
  }

  async endEtwMonitor() {
    const realPath: Set<string> = new Set();
    for (const file of [...this.attachedSavePathSet]) {
      try {
        const real = await workerAPI.fs.realpath(PathUtil.dirname(file));
        realPath.add(real);
      } catch (err) {
        console.log(err);
      }
    }

    this.savePathSelection = [...realPath];
    const commonParentDirs = PathUtil.findImmediateCommonParents([...realPath]);
    for (const dir of commonParentDirs) {
      this.savePathSelection.unshift(dir);
    }

    this.ended = true;
    await mainAPI.shell.stopEtwMonitor();
  }

  openEtwSource() {
    // https://github.com/whitecloud-save/whitecloud-client/blob/master/cs/EtwMonitor/Program.cs
    mainAPI.shell.openExternal('https://github.com/whitecloud-save/whitecloud-client/blob/master/cs/EtwMonitor/Program.cs');
  }

  openEtwAbout() {
    mainAPI.shell.openExternal('https://learn.microsoft.com/zh-cn/windows/win32/etw/about-event-tracing');
  }

  startGame() {
    console.log(this.exePath);
    if (this.exePath.startsWith('steam://')) {
      mainAPI.shell.openExternal(this.exePath);
    } else {
      workerAPI.process.spawn({
        exe: this.exePath,
        cwd: PathUtil.dirname(this.exePath),
      });
    }

  }

  // async checkProcesses() {
  //   const list = await workerAPI.process.listProcesses();
  //   this.runningProcess = list.filter(process => {
  //     return process.exePath.indexOf(this.gamePath) === 0;
  //   });
  // }

  async startMonitor() {
    await mainAPI.shell.startEtwMonitor(this.runningProcess.map(p => p.pid), (notify: {file: string}) => {
      this.zone.run(async () => {
        this.attachedSavePathSet.add(notify.file);
        // try {
        //   const realpath = await workerAPI.fs.realpath(PathUtil.dirname(notify.file));
        //   this.attachedSavePathSet.add(realpath);
        //   console.log(realpath);
        // } catch (err) {
        //   console.log(err);
        // }
      })
    });
    this.step = 3;
  }

  openFolder(path: string, event: Event) {
    event.stopPropagation();
    mainAPI.shell.openPath(path);
  }

  copy(path: string, event: Event) {
    event.stopPropagation();
    mainAPI.shell.writeClipboard(path);
    this.copied = path;
    this.messageService.success('复制成功');
    setTimeout(() => {
      this.zone.run(() => {
        this.copied = undefined;
      })
    }, 2000);
  }

  exit() {
    mainAPI.window.closeSaveFinderWindow();
  }

  selectPath(path: string) {
    this.modal.confirm({
      nzTitle: '确认选择存档目录？',
      nzContent: `确认选择${path}作为存档目录？`,
      nzOkText: '确认',
      nzOnOk: () => {
        mainAPI.window.notifyToMain({method: 'select-game-save-path', payload: path});
        this.exit();
      },
    });
  }

  get gameStatusColor() {
    if (this.runningProcess.length) {
      return '#52c41a';
    } else {
      return '#8c8c8c';
    }
  }

  // get attachedPathList() {
  //   return [...this.attachedSavePathSet];
  // }
}
