import { useCallback } from 'react';
import { Button } from '../shared/Button';

interface QuickFillToolsProps {
  onFillNeutral: () => void | Promise<void>;
  onCopyLast: () => void;
  onImportCsv: () => void;
  disabled?: boolean;
}

export const QuickFillTools = ({
  onFillNeutral,
  onCopyLast,
  onImportCsv,
  disabled = false,
}: QuickFillToolsProps) => {
  const handleFillNeutralClick = useCallback(() => {
    if (disabled) {
      return;
    }

    const shouldProceed = typeof window === 'undefined' || window.confirm('Reset all preferences in this view to neutral?');
    if (!shouldProceed) {
      return;
    }

    void onFillNeutral();
  }, [disabled, onFillNeutral]);

  return (
    <div className="flex flex-wrap gap-2">
      <Button variant="secondary" disabled={disabled} onClick={onCopyLast}>
        Copy last semester
      </Button>
      <Button variant="ghost" disabled={disabled} onClick={handleFillNeutralClick}>
        Fill neutral
      </Button>
      <Button variant="ghost" disabled={disabled} onClick={onImportCsv}>
        Import CSV
      </Button>
    </div>
  );
};
