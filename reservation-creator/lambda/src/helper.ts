import { SearchDateRange } from './types';

const oneDay = 24 * 60 * 60 * 1000;

function parseDate(dateStr: string) {
  return new Date(dateStr);
}

function daysBetween(date1: Date, date2: Date) {
  return Math.round(Math.abs((date2.getTime() - date1.getTime()) / oneDay));
}

export function mergeDateRanges(
  dateRanges: SearchDateRange[]
): SearchDateRange[] {
  // Sort date ranges by start date
  dateRanges.sort(
    (a, b) =>
      parseDate(a.startDate).getTime() - parseDate(b.startDate).getTime()
  );

  // Adding one day to end date, because bc api end date is exclusive
  dateRanges = dateRanges.map((range) => ({
    ...range,
    endDate: dateTimeToDate(
      new Date(parseDate(range.endDate).getTime() + oneDay).toISOString()
    )
  }));

  // Filtering date ranges that have already passed
  dateRanges = dateRanges.filter(
    (range) => parseDate(range.startDate) > new Date()
  );

  const result = [];
  let currentRange = dateRanges[0];

  for (let i = 1; i < dateRanges.length; i++) {
    const currentStart = parseDate(currentRange.startDate);
    const nextEnd = parseDate(dateRanges[i].endDate);

    if (daysBetween(currentStart, nextEnd) <= 30) {
      // Merge ranges if they fit within one month
      currentRange = {
        startDate: currentRange.startDate,
        endDate: dateRanges[i].endDate
      };
    } else {
      // Push the current range to result and start a new range
      result.push(currentRange);
      currentRange = dateRanges[i];
    }
  }

  // Add the last range
  result.push(currentRange);

  return result;
}

export function dateTimeToDate(str: string): string {
  return str.split('T')[0];
}
