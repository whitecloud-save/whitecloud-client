import {Pipe, PipeTransform} from '@angular/core';
import {Save} from '../../entity/save';

@Pipe({
  name: 'saveTotalSize',
})
export class SaveTotalSizePipe implements PipeTransform {

  transform(value: Save[]): number {
    return value.reduce((pre, current) => pre + current.size, 0);
  }

}
