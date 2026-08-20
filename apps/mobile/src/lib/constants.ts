export const APP_NAME = 'MediLoop';

export const DISCLAIMER =
  'MediLoop is a medication-management and information tool. It does not replace medical advice from a qualified healthcare professional.';

export const PRESCRIPTION_ABBREVIATIONS: Record<string, string> = {
  OD: 'Once Daily',
  BD: 'Twice Daily',
  BID: 'Twice Daily',
  TDS: 'Three Times Daily',
  TID: 'Three Times Daily',
  QID: 'Four Times Daily',
  HS: 'At Bedtime',
  SOS: 'As Needed / When Required',
  AC: 'Before Meals',
  PC: 'After Meals',
  CC: 'With Meals',
  PRN: 'As Needed',
  STAT: 'Immediately',
};

export const MEDICATION_FORM_LABELS: Record<string, string> = {
  TABLET: 'Tablet',
  CAPSULE: 'Capsule',
  SYRUP: 'Syrup / Liquid',
  INJECTION: 'Injection',
  DROPS: 'Drops',
  CREAM: 'Cream / Ointment',
  INHALER: 'Inhaler',
  PATCH: 'Patch',
  POWDER: 'Powder',
  OTHER: 'Other',
};

export const FREQUENCY_LABELS: Record<string, string> = {
  ONCE_DAILY: 'Once daily',
  TWICE_DAILY: 'Twice daily',
  THREE_TIMES_DAILY: '3 times daily',
  FOUR_TIMES_DAILY: '4 times daily',
  EVERY_OTHER_DAY: 'Every other day',
  WEEKLY: 'Once a week',
  AS_NEEDED: 'As needed',
  CUSTOM: 'Custom schedule',
};

export const MEAL_RELATION_LABELS: Record<string, string> = {
  BEFORE_MEAL: 'Before meal',
  AFTER_MEAL: 'After meal',
  WITH_MEAL: 'With meal',
  ANY: 'Any time',
};

export const STATUS_LABELS: Record<string, string> = {
  SCHEDULED: 'Upcoming',
  TAKEN: 'Taken',
  MISSED: 'Missed',
  SKIPPED: 'Skipped',
  SNOOZED: 'Snoozed',
};
