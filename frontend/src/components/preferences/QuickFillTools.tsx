import { Button } from '../shared/Button';

interface QuickFillToolsProps {
  onFillNeutral: () => void;
  onCopyLast: () => void;
  onImportCsv: () => void;
  disabled?: boolean;
}

export const QuickFillTools = ({
  onFillNeutral,
  onCopyLast,
  onImportCsv,
  disabled = false,
}: QuickFillToolsProps) => (
  <div className="flex flex-wrap gap-2">
    <Button variant="secondary" disabled={disabled} onClick={onCopyLast}>
      Copy last semester
    </Button>
    <Button variant="ghost" disabled={disabled} onClick={onFillNeutral}>
      Fill neutral
    </Button>
    <Button variant="ghost" disabled={disabled} onClick={onImportCsv}>
      Import CSV
    </Button>
  </div>
);
