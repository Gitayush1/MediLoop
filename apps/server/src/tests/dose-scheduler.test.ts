import { generateDoseEvents } from '../modules/medications/dose-scheduler';

describe('Dose Scheduler', () => {
  const baseInput = {
    medicationId: 'med-1',
    scheduleId: 'sched-1',
    userId: 'user-1',
    timezone: 'Asia/Kolkata',
    scheduledTime: '08:00',
  };

  it('should generate once-daily events for a 5-day course', () => {
    const start = new Date('2026-08-20');
    const end = new Date('2026-08-24');

    const events = generateDoseEvents({
      ...baseInput,
      startDate: start,
      endDate: end,
      frequency: 'ONCE_DAILY',
    });

    expect(events.length).toBe(5);
    expect(events[0].status).toBe('SCHEDULED');
    events.forEach((e) => {
      expect(e.medicationId).toBe('med-1');
      expect(e.userId).toBe('user-1');
    });
  });

  it('should generate twice-daily events for a 3-day course', () => {
    const start = new Date('2026-08-20');
    const end = new Date('2026-08-22');

    const morningEvents = generateDoseEvents({
      ...baseInput,
      startDate: start,
      endDate: end,
      frequency: 'TWICE_DAILY',
      scheduledTime: '08:00',
    });

    const eveningEvents = generateDoseEvents({
      ...baseInput,
      startDate: start,
      endDate: end,
      frequency: 'TWICE_DAILY',
      scheduledTime: '20:00',
    });

    // 3 morning + 3 evening (generated separately per schedule)
    expect(morningEvents.length).toBe(3);
    expect(eveningEvents.length).toBe(3);
  });

  it('should generate weekly events correctly', () => {
    const start = new Date('2026-08-01');
    const end = new Date('2026-08-31');

    const events = generateDoseEvents({
      ...baseInput,
      startDate: start,
      endDate: end,
      frequency: 'WEEKLY',
    });

    expect(events.length).toBe(5); // Aug has ~5 weeks
  });

  it('should return empty array for AS_NEEDED frequency', () => {
    const events = generateDoseEvents({
      ...baseInput,
      startDate: new Date('2026-08-20'),
      endDate: new Date('2026-08-25'),
      frequency: 'AS_NEEDED',
    });

    expect(events.length).toBe(0);
  });

  it('should cap generation at 365 days when no end date', () => {
    const start = new Date('2026-08-20');

    const events = generateDoseEvents({
      ...baseInput,
      startDate: start,
      endDate: null,
      frequency: 'ONCE_DAILY',
    });

    expect(events.length).toBeLessThanOrEqual(365);
  });

  it('should filter by daysOfWeek when specified', () => {
    const start = new Date('2026-08-17'); // Monday
    const end = new Date('2026-08-23'); // Sunday

    // Only Mon (1) and Wed (3)
    const events = generateDoseEvents({
      ...baseInput,
      startDate: start,
      endDate: end,
      frequency: 'CUSTOM',
      daysOfWeek: [1, 3],
    });

    expect(events.length).toBe(2);
  });
});
