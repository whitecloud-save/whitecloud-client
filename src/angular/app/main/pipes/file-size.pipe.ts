import {Pipe, PipeTransform} from '@angular/core';


/**
 * A pipe for human readable file size representation.
 */
@Pipe({
  name: 'fileSize',
})
export class FileSizePipe implements PipeTransform {
  transform(value: bigint | number, precision: number = 1): string {
    // 1. 统一转为 bigint 处理，处理 null/undefined/0
    let bytes = BigInt(value || 0n);

    if (bytes === 0n) return '0 B';

    const units = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
    const k = 1024n;
    let exp = 0;

    // 2. 循环确定单位等级 (BigInt 不支持 Math.log)
    let tempBytes = bytes;
    while (tempBytes >= k && exp < units.length - 1) {
      tempBytes /= k;
      exp++;
    }

    // 3. 计算最终数值
    // 由于需要小数点，我们将结果转回 number 进行最后的除法运算
    // 只有在当前单位下进行转换，不会损失精度（因为当前数值已经很小了）
    const divisor = k ** BigInt(exp);
    const resultValue = Number(bytes) / Number(divisor);

    // 4. 格式化输出
    let result = resultValue.toFixed(precision);

    // 移除无效的末尾 0 (例如 10.00 -> 10)
    result = result.replace(/\.?0+$/, '');

    return `${result} ${units[exp]}`;
  }
}

