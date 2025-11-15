import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface ActiveScheduleCell {
  facultyId: string;
  timeslotId: string;
}

export type SortField = 'time' | 'day';
export type SortDirection = 'asc' | 'desc';

export interface SortConfig {
  field: SortField;
  direction: SortDirection;
}

export interface DayFilterConfig {
  selectedDays: Set<string>;
  availableDays: string[];
}

interface SchedulerUIState {
  activeCell: ActiveScheduleCell | null;
  isEditDialogOpen: boolean;
  sortConfig: SortConfig;
  dayFilter: DayFilterConfig;
  setActiveCell: (cell: ActiveScheduleCell | null) => void;
  openEditDialog: (cell?: ActiveScheduleCell) => void;
  closeEditDialog: () => void;
  setSortConfig: (config: SortConfig) => void;
  toggleSortDirection: () => void;
  setDayFilter: (days: Set<string>) => void;
  clearDayFilter: () => void;
  initializeDayFilter: (availableDays: string[]) => void;
}

const DEFAULT_SORT: SortConfig = {
  field: 'time',
  direction: 'asc',
};

const DEFAULT_DAY_FILTER: DayFilterConfig = {
  selectedDays: new Set<string>(),
  availableDays: [],
};

// Validation helpers
const isValidSortField = (field: unknown): field is SortField => {
  return field === 'time' || field === 'day';
};

const isValidSortDirection = (direction: unknown): direction is SortDirection => {
  return direction === 'asc' || direction === 'desc';
};

const validateSortConfig = (config: unknown): SortConfig => {
  if (!config || typeof config !== 'object') {
    console.warn('[scheduleUiStore] Invalid sort config detected, resetting to default');
    return DEFAULT_SORT;
  }

  const { field, direction } = config as any;

  if (!isValidSortField(field) || !isValidSortDirection(direction)) {
    console.warn('[scheduleUiStore] Invalid sort field or direction detected, resetting to default');
    return DEFAULT_SORT;
  }

  return { field, direction };
};

const validateDayFilter = (dayFilter: unknown, availableDays: string[]): Set<string> => {
  if (!Array.isArray(dayFilter)) {
    return new Set<string>();
  }

  // Filter out days that are no longer available
  const validDays = dayFilter.filter((day) => availableDays.includes(day));

  if (validDays.length !== dayFilter.length) {
    console.warn('[scheduleUiStore] Some persisted day filters are no longer available, clearing invalid filters');
  }

  return new Set(validDays);
};

export const useScheduleUiStore = create<SchedulerUIState>()(
  persist(
    (set) => ({
      activeCell: null,
      isEditDialogOpen: false,
      sortConfig: DEFAULT_SORT,
      dayFilter: DEFAULT_DAY_FILTER,
      setActiveCell: (cell) =>
        set((state) => ({
          activeCell: cell,
          isEditDialogOpen: state.isEditDialogOpen && !cell ? false : state.isEditDialogOpen,
        })),
      openEditDialog: (cell) =>
        set((state) => ({
          activeCell: cell ?? state.activeCell,
          isEditDialogOpen: true,
        })),
      closeEditDialog: () => set({ isEditDialogOpen: false }),
      setSortConfig: (config) => set({ sortConfig: config }),
      toggleSortDirection: () =>
        set((state) => ({
          sortConfig: {
            ...state.sortConfig,
            direction: state.sortConfig.direction === 'asc' ? 'desc' : 'asc',
          },
        })),
      setDayFilter: (days) =>
        set((state) => ({
          dayFilter: {
            ...state.dayFilter,
            selectedDays: days,
          },
        })),
      clearDayFilter: () =>
        set((state) => ({
          dayFilter: {
            ...state.dayFilter,
            selectedDays: new Set<string>(),
          },
        })),
      initializeDayFilter: (availableDays) =>
        set((state) => {
          // Validate persisted day filters against available days
          const validatedSelectedDays = validateDayFilter(
            Array.from(state.dayFilter.selectedDays),
            availableDays
          );

          return {
            dayFilter: {
              availableDays,
              selectedDays: validatedSelectedDays,
            },
          };
        }),
    }),
    {
      name: 'schedule-ui-preferences',
      partialize: (state) => ({
        sortConfig: state.sortConfig,
        dayFilter: {
          selectedDays: Array.from(state.dayFilter.selectedDays),
          availableDays: state.dayFilter.availableDays,
        },
      }),
      merge: (persistedState, currentState) => {
        const persisted = persistedState as any;
        
        // Validate sort config
        const sortConfig = validateSortConfig(persisted?.sortConfig);
        
        return {
          ...currentState,
          sortConfig,
          dayFilter: {
            selectedDays: new Set(persisted?.dayFilter?.selectedDays || []),
            availableDays: persisted?.dayFilter?.availableDays || [],
          },
        };
      },
    }
  )
);
