import {Injectable} from '@angular/core';
import {BehaviorSubject, Subject, interval, map, switchMap} from 'rxjs';
import {Utility} from '../library/utility';
import {workerAPI} from '../library/api/worker-api';

export enum ProcessEventType {
  Start = 'start',
  End = 'end',
}

export interface IProcessEvent {
  type: ProcessEventType;
  exeFilePath: string;
  pid: number;
}

@Injectable({
  providedIn: 'root',
})
export class ProcessMonitorService {

  private runningProcesses = new BehaviorSubject<{exePath: string, pid: number}[]>([]);
  private subjectMap = new Map<string, Subject<IProcessEvent>>();

  constructor() {
    interval(3000)
      .pipe(
        switchMap(async () => {
          return workerAPI.process.listProcesses();
          // return list.map(process => process.exePath);
        }),
      ).subscribe((processes) => {
        const diff = Utility.arrayDiffByMatcher(this.runningProcesses.getValue(), processes, (a, arr) => !arr.map(v => v.pid).includes(a.pid));
        this.runningProcesses.next(processes);
        for (const ele of diff.new) {
          [...this.subjectMap].filter(([dir]) => ele.exePath.indexOf(dir) === 0).forEach(([_, sub]) => {
            sub.next({
              type: ProcessEventType.Start,
              exeFilePath: ele.exePath,
              pid: ele.pid,
            });
          });
        }

        for (const ele of diff.del) {
          [...this.subjectMap].filter(([dir]) => ele.exePath.indexOf(dir) === 0).forEach(([_, sub]) => {
            sub.next({
              type: ProcessEventType.End,
              exeFilePath: ele.exePath,
              pid: ele.pid,
            });
          });
        }
      });
  }

  getRunningProcess(dir: string) {
    const running = this.runningProcesses.getValue();
    return running.filter(process => process.exePath.indexOf(dir) === 0);
  }

  registerObservable(dir: string) {
    const existed = this.subjectMap.get(dir);
    if (existed)
      return existed;

    const subject = new Subject<IProcessEvent>();
    this.subjectMap.set(dir, subject);
    return subject;
  }
}
