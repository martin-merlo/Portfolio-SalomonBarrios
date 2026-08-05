'use client';

interface ToggleProps {
  label: string;
  ayuda?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}

export default function Toggle({ label, ayuda, checked, onChange }: ToggleProps) {
  return (
    <label className="flex items-start gap-3 cursor-pointer select-none">
      <span
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onChange(!checked);
          }
        }}
        tabIndex={0}
        className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors mt-0.5 ${
          checked ? 'bg-slate-700' : 'bg-slate-300'
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            checked ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </span>
      <span>
        <span className="block text-sm font-medium text-slate-800">{label}</span>
        {ayuda && <span className="block text-xs text-slate-500 mt-0.5">{ayuda}</span>}
      </span>
    </label>
  );
}
