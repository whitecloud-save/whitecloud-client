import {Pipe, PipeTransform} from '@angular/core';
import moment from 'moment';

@Pipe({
  name: 'lastGameTime',
})
export class LastGameTimePipe implements PipeTransform {

  transform(value: number): string {
    if (!value)
      return '尚未游玩';
    const diffDay = moment().diff(moment.unix(value), 'day');
    if (diffDay <= 0) {
      return '今天';
    }
    if (diffDay <= 1) {
      return '昨天';
    }
    return moment.unix(value).format('YYYY/MM/DD');
  }
}
