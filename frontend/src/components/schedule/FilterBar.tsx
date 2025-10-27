import { Button } from '../shared/Button';
import { Input } from '../shared/Input';

export const FilterBar = () => (
  <div className="flex flex-wrap items-center gap-3 rounded-xl border border-white/5 bg-slate-950/40 p-4">
    <Input placeholder="Search faculty" className="w-48" />
    <Input placeholder="Filter by subject" className="w-48" />
    <div className="flex gap-2">
      <Button variant="ghost">Clear filters</Button>
      <Button variant="secondary">Run optimiser</Button>
    </div>
  </div>
);
