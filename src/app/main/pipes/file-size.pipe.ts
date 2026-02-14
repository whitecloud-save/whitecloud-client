import {Pipe, PipeTransform} from '@angular/core';


/**
 * A pipe for human readable file size representation.
 */
@Pipe({
  name: 'fileSize',
})
export class FileSizePipe implements PipeTransform {
  transform(value: any, precision: number = 1): any {
    const bytes: number = value ? value : 0;
    const exp: number = (Math.log(bytes) / Math.log(1024)) | 0;
    let result: string = (bytes / Math.pow(1024, exp)).toFixed(precision);

    result = result.replace(/\.(0)+$/, '');

    return result + ' ' + (exp == 0 ? 'B' : 'KMGTPEZY'[exp - 1] + 'B');
  }
}

