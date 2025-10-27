import { useState } from 'react';
import { useSnapshots } from '../../../hooks/useSnapshots';
import { Button } from '../../shared/Button';

export const SaveSnapshotButton = () => {
  const { createSnapshot } = useSnapshots();
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const { synced } = await createSnapshot({ snapshotName: 'Quick Save' });
      if (!synced) {
        console.warn('Snapshot stored locally; will sync when online.');
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Button variant="secondary" loading={isSaving} onClick={handleSave}>
      Save
    </Button>
  );
};
