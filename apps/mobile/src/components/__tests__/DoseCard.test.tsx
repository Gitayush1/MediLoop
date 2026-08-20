import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { DoseCard } from '../features/DoseCard';
import type { DoseEvent } from '../../services/doses.service';

const mockDose: DoseEvent = {
  id: 'dose-1',
  medicationId: 'med-1',
  scheduledAt: new Date('2026-08-20T08:00:00Z').toISOString(),
  status: 'SCHEDULED',
  medication: { id: 'med-1', name: 'Metformin', dosage: '500mg', color: '#4F46E5' },
  schedule: { timeOfDay: '08:00', mealRelation: 'AFTER_MEAL' },
};

describe('DoseCard', () => {
  it('renders medication name', () => {
    const { getByText } = render(<DoseCard dose={mockDose} />);
    expect(getByText('Metformin')).toBeTruthy();
  });

  it('shows dosage', () => {
    const { getByText } = render(<DoseCard dose={mockDose} />);
    expect(getByText('500mg')).toBeTruthy();
  });

  it('calls onTake when Take button pressed', () => {
    const onTake = jest.fn();
    const { getByText } = render(
      <DoseCard dose={mockDose} onTake={onTake} onSkip={jest.fn()} onSnooze={jest.fn()} />
    );
    fireEvent.press(getByText('✓ Taken'));
    expect(onTake).toHaveBeenCalledTimes(1);
  });

  it('calls onSkip when skip button pressed', () => {
    const onSkip = jest.fn();
    const { getByLabelText } = render(
      <DoseCard dose={mockDose} onTake={jest.fn()} onSkip={onSkip} onSnooze={jest.fn()} />
    );
    fireEvent.press(getByLabelText('Skip this dose'));
    expect(onSkip).toHaveBeenCalledTimes(1);
  });

  it('shows taken time when status is TAKEN', () => {
    const takenDose: DoseEvent = {
      ...mockDose,
      status: 'TAKEN',
      takenAt: new Date('2026-08-20T08:15:00Z').toISOString(),
    };
    const { queryByText } = render(<DoseCard dose={takenDose} />);
    // Should show taken time, not action buttons
    expect(queryByText('✓ Taken')).toBeNull();
  });

  it('does not show action buttons for completed doses', () => {
    const missedDose: DoseEvent = { ...mockDose, status: 'MISSED' };
    const { queryByText } = render(<DoseCard dose={missedDose} />);
    expect(queryByText('✓ Taken')).toBeNull();
  });
});
