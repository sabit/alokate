import { useState } from 'react';
import { useSnapshots } from '../../../hooks/useSnapshots';
import { Button } from '../../shared/Button';

export const SaveSnapshotButton = () => {
  const { createSnapshot } = useSnapshots();
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await createSnapshot({ snapshotName: 'Quick Save' });
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
