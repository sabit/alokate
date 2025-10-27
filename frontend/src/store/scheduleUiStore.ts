import { create } from 'zustand';

export interface ActiveScheduleCell {
  facultyId: string;
  timeslotId: string;
}

interface SchedulerUIState {
  activeCell: ActiveScheduleCell | null;
  isEditDialogOpen: boolean;
  setActiveCell: (cell: ActiveScheduleCell | null) => void;
  openEditDialog: (cell?: ActiveScheduleCell) => void;
  closeEditDialog: () => void;
}

export const useScheduleUiStore = create<SchedulerUIState>((set) => ({
  activeCell: null,
  isEditDialogOpen: false,
  setActiveCell: (cell) => set((state) => ({
    activeCell: cell,
    isEditDialogOpen: state.isEditDialogOpen && !cell ? false : state.isEditDialogOpen,
  })),
  openEditDialog: (cell) =>
    set((state) => ({
      activeCell: cell ?? state.activeCell,
      isEditDialogOpen: true,
    })),
  closeEditDialog: () => set({ isEditDialogOpen: false }),
}));
