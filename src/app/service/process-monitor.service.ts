import {Injectable} from '@angular/core';
import {BehaviorSubject, Subject, interval, map} from 'rxjs';
import {Utility} from '../library/utility';
import {listProcesses} from '@whitecloud-save/binding-addon';

export enum ProcessEventType {
  Start = 'start',
  End = 'end',
}

export interface IProcessEvent {
  type: ProcessEventType;
  exeFilePath: string;
}

@Injectable({
  providedIn: 'root',
})
export class ProcessMonitorService {

  runningProcesses = new BehaviorSubject<string[]>([]);
  subjectMap = new Map<string, Subject<IProcessEvent>>();

  constructor() {
    interval(1000)
      .pipe(
        map(() => {
          return listProcesses();
        }),
      ).subscribe((processes) => {
        const diff = Utility.arrayDiff(this.runningProcesses.getValue(), processes);
        this.runningProcesses.next(processes);
        for (const ele of diff.new) {
          [...this.subjectMap].filter(([dir]) => ele.indexOf(dir) === 0).forEach(([_, sub]) => {
            sub.next({
              type: ProcessEventType.Start,
              exeFilePath: ele,
            });
          });
        }

        for (const ele of diff.del) {
          [...this.subjectMap].filter(([dir]) => ele.indexOf(dir) === 0).forEach(([_, sub]) => {
            sub.next({
              type: ProcessEventType.End,
              exeFilePath: ele,
            });
          });
        }
      });
  }

  getRunningProcess(dir: string) {
    const running = this.runningProcesses.getValue();
    return running.filter(process => process.indexOf(dir) === 0);
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
