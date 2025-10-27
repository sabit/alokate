const legend = [
  { value: 3, label: 'Strong preference', color: 'bg-emerald-400' },
  { value: 2, label: 'Moderate preference', color: 'bg-emerald-500' },
  { value: 1, label: 'Soft preference', color: 'bg-emerald-700' },
  { value: 0, label: 'Neutral', color: 'bg-slate-600' },
  { value: -1, label: 'Soft avoid', color: 'bg-amber-600' },
  { value: -2, label: 'Moderate avoid', color: 'bg-rose-500' },
  { value: -3, label: 'Strong avoid', color: 'bg-rose-600' },
];

export const PreferenceLegend = () => (
  <div className="flex flex-wrap gap-3 rounded-xl border border-white/5 bg-slate-950/40 p-4 text-sm">
    {legend.map((item) => (
      <span
        key={item.value}
        className="inline-flex items-center gap-2 rounded-full border border-white/10 px-3 py-1"
      >
        <span className={`h-3 w-3 rounded-full ${item.color}`} />
        <span className="font-medium">{item.value}</span>
        <span className="text-slate-400">{item.label}</span>
      </span>
    ))}
  </div>
);
