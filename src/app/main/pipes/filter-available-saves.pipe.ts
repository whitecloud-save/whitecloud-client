import {Pipe, PipeTransform} from '@angular/core';
import {Save} from '../../entity/save';
import {RemoteSave} from '../../entity/remote-save';

@Pipe({
  name: 'filterAvailableSaves',
})
export class FilterAvailableSavesPipe implements PipeTransform {

  transform(value: (Save | RemoteSave)[], onlyStared: boolean): (Save | RemoteSave)[] {
    return value.filter(save => {
      if (save instanceof RemoteSave) {
        return !onlyStared || save.stared;
      }
      if (save instanceof Save) {
        if (!save.isAvailable) {
          return false;
        }
        return !onlyStared || save.stared;
      }
      return false;
    });
  }

}
