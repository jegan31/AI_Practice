import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'timeAgo', standalone: true })
export class TimeAgoPipe implements PipeTransform {
  transform(value: string | Date): string {
    const date = new Date(value);
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
    const intervals: [number, string][] = [
      [31536000, 'year'], [2592000, 'month'], [86400, 'day'],
      [3600, 'hour'], [60, 'minute'], [1, 'second'],
    ];
    for (const [divisor, unit] of intervals) {
      const count = Math.floor(seconds / divisor);
      if (count >= 1) return `${count} ${unit}${count !== 1 ? 's' : ''} ago`;
    }
    return 'just now';
  }
}
