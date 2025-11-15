import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ConfigSummary } from '../ConfigSummary';
import type { ConfigData } from '../../../types';

describe('ConfigSummary', () => {
  it('displays "No configuration loaded" when config is empty', () => {
    const emptyConfig: ConfigData = {
      faculty: [],
      subjects: [],
      sections: [],
      timeslots: [],
      rooms: [],
      buildings: [],
    };

    render(<ConfigSummary config={emptyConfig} />);

    expect(screen.getByText('No configuration loaded')).toBeInTheDocument();
    expect(screen.getByText('Import a JSON or CSV file to get started')).toBeInTheDocument();
  });

  it('displays counts for all configuration entities', () => {
    const config: ConfigData = {
      faculty: [
        { id: 'f1', name: 'Faculty 1', initial: 'F1', maxSections: 3, maxOverload: 1, canOverload: true },
        { id: 'f2', name: 'Faculty 2', initial: 'F2', maxSections: 3, maxOverload: 1, canOverload: true },
      ],
      subjects: [
        { id: 's1', name: 'Subject 1', code: 'S1' },
        { id: 's2', name: 'Subject 2', code: 'S2' },
        { id: 's3', name: 'Subject 3', code: 'S3' },
      ],
      sections: [
        { id: 'sec1', subjectId: 's1', timeslotId: 't1', roomId: 'r1', capacity: 40 },
      ],
      timeslots: [
        { id: 't1', label: 'Mon 08:00-09:30', day: 'Monday', start: '08:00', end: '09:30' },
        { id: 't2', label: 'Tue 10:00-11:30', day: 'Tuesday', start: '10:00', end: '11:30' },
      ],
      rooms: [
        { id: 'r1', label: 'Room 1', buildingId: 'b1', capacity: 50 },
        { id: 'r2', label: 'Room 2', buildingId: 'b1', capacity: 60 },
        { id: 'r3', label: 'Room 3', buildingId: 'b2', capacity: 40 },
      ],
      buildings: [
        { id: 'b1', label: 'Building 1' },
      ],
    };

    render(<ConfigSummary config={config} />);

    // Verify all entity type labels are present
    expect(screen.getByText('faculty')).toBeInTheDocument();
    expect(screen.getByText('subjects')).toBeInTheDocument();
    expect(screen.getByText('sections')).toBeInTheDocument();
    expect(screen.getByText('timeslots')).toBeInTheDocument();
    expect(screen.getByText('rooms')).toBeInTheDocument();
    expect(screen.getByText('buildings')).toBeInTheDocument();
    
    // Verify specific counts are displayed
    expect(screen.getAllByText('2')).toHaveLength(2); // faculty and timeslots
    expect(screen.getAllByText('3')).toHaveLength(2); // subjects and rooms
    expect(screen.getAllByText('1')).toHaveLength(2); // sections and buildings
  });
});
