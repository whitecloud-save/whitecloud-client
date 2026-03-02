import {Pipe, PipeTransform} from '@angular/core';
import {UnixTime} from '../../library/utility';

@Pipe({
  name: 'gameTime',
})
export class GameTimePipe implements PipeTransform {

  transform(value: number): string {
    if (value === 0) {
      return '尚未游玩';
    }
    if (value < 60) {
      return '不足一分钟';
    }
    if (value < UnixTime.hour(2)) {
      return (value / 60).toFixed(0) + '分钟';
    }
    return (value / 60 / 60).toFixed(1) + '小时';
  }

}
