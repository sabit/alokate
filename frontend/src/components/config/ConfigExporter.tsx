import { useSchedulerStore } from '../../store/schedulerStore';
import { Button } from '../shared/Button';

export const ConfigExporter = () => {
  const state = useSchedulerStore();

  const handleExport = () => {
    const blob = new Blob([JSON.stringify(state, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'faculty-scheduler.json';
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Button onClick={handleExport}>
      Export JSON
    </Button>
  );
};
