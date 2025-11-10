import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ConfigImporter } from '../ConfigImporter';
import * as csvParser from '../../../utils/csvParser';
import * as csvTransformer from '../../../utils/csvTransformer';

// Mock the stores and hooks
vi.mock('../../../store/schedulerStore', () => ({
  useSchedulerStore: vi.fn((selector) => {
    const mockState = {
      hydrate: vi.fn(),
      updateConfig: vi.fn(),
      updateSchedule: vi.fn(),
    };
    return selector(mockState);
  }),
}));

vi.mock('../../../store/snapshotStore', () => ({
  useSnapshotStore: vi.fn((selector) => {
    const mockState = {
      hydrate: vi.fn(),
    };
    return selector(mockState);
  }),
}));

vi.mock('../../../hooks/useSchedulerPersistence', () => ({
  useSchedulerPersistence: () => vi.fn().mockResolvedValue(true),
}));

vi.mock('../../../hooks/useToast', () => ({
  useToast: () => ({
    success: vi.fn(),
    error: vi.fn(),
  }),
}));

describe('ConfigImporter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render import buttons', () => {
    render(<ConfigImporter />);
    
    expect(screen.getByText('Import JSON')).toBeInTheDocument();
    expect(screen.getByText('Import CSV')).toBeInTheDocument();
  });

  it('should handle CSV file selection', async () => {
    const parseFacultySpy = vi.spyOn(csvParser, 'parseFacultyCSV');
    const parseRoomsSpy = vi.spyOn(csvParser, 'parseRoomsCSV');
    const transformFacultySpy = vi.spyOn(csvTransformer, 'transformFacultyData');
    const transformRoomsSpy = vi.spyOn(csvTransformer, 'transformRoomsData');
    
    parseFacultySpy.mockReturnValue([
      { name: 'Dr. Test', initial: 'AM' },
    ]);
    
    parseRoomsSpy.mockReturnValue([
      {
        slNo: '01548',
        course: 'MAT2101',
        capacity: 40,
        registration: 40,
        section: 'M3 [A]',
        slotDay: 'Sunday',
        slotTime: '2:40 PM',
        room: 'DS0605',
      },
    ]);

    transformFacultySpy.mockReturnValue([
      { id: 'faculty-am', name: 'Dr. Test', maxSections: 3, maxOverload: 1, canOverload: true },
    ]);

    transformRoomsSpy.mockReturnValue({
      subjects: [{ id: 'subject-mat2101', name: 'MAT2101', code: 'MAT2101' }],
      timeslots: [{ id: 'slot-sun-1440', label: 'Sunday 14:40–16:10', day: 'Sunday', start: '14:40', end: '16:10' }],
      buildings: [{ id: 'building-ds', label: 'DS' }],
      rooms: [{ id: 'room-ds0605', label: 'DS DS0605', buildingId: 'building-ds', capacity: 40 }],
      sections: [{ id: 'section-mat2101-m3-a', subjectId: 'subject-mat2101', timeslotId: 'slot-sun-1440', roomId: 'room-ds0605', capacity: 40 }],
    });

    render(<ConfigImporter />);
    
    const csvButton = screen.getByText('Import CSV');
    fireEvent.click(csvButton);

    const fileInput = document.querySelector('input[type="file"][accept="text/csv"]') as HTMLInputElement;
    expect(fileInput).toBeInTheDocument();

    const facultyContent = 'Name,Initial\nDr. Test,AM';
    const roomsContent = 'Sl No,Course,Capacity,Registration,Section,Slot Day,Slot Time,Room\n01548,MAT2101,40,40,M3 [A],Sunday,2:40 PM,DS0605';

    const facultyFile = new File([facultyContent], 'faculty.csv', { type: 'text/csv' });
    const roomsFile = new File([roomsContent], 'rooms.csv', { type: 'text/csv' });

    // Mock the text() method for File objects
    facultyFile.text = vi.fn().mockResolvedValue(facultyContent);
    roomsFile.text = vi.fn().mockResolvedValue(roomsContent);

    Object.defineProperty(fileInput, 'files', {
      value: [facultyFile, roomsFile],
      writable: false,
    });

    fireEvent.change(fileInput);

    await waitFor(() => {
      expect(parseFacultySpy).toHaveBeenCalled();
      expect(parseRoomsSpy).toHaveBeenCalled();
    });
  });
});
