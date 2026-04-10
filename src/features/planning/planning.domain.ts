import { format, parseISO, startOfWeek, endOfWeek, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import { ScheduledDay } from '../../types';

export type ViewType = 'daily' | 'weekly' | 'monthly';

export function filterScheduleByViewType(
  schedule: ScheduledDay[],
  viewType: ViewType,
  selectedDate: Date
): ScheduledDay[] {
  if (viewType === 'daily') {
    return schedule.filter(day => format(parseISO(day.date), 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd'));
  } else if (viewType === 'weekly') {
    const start = startOfWeek(selectedDate, { weekStartsOn: 1 });
    const end = endOfWeek(selectedDate, { weekStartsOn: 1 });
    return schedule.filter(day => isWithinInterval(parseISO(day.date), { start, end }));
  } else {
    const start = startOfMonth(selectedDate);
    const end = endOfMonth(selectedDate);
    return schedule.filter(day => isWithinInterval(parseISO(day.date), { start, end }));
  }
}
