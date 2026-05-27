import type { LucideIcon } from 'lucide-react';
import { Pencil } from 'lucide-react';
import type { ReactNode } from 'react';
import { Button } from '../ui/Button';
import { cn } from '../../lib/utils';

type ProfileSectionCardProps = {
  icon: LucideIcon;
  title: string;
  editing: boolean;
  onEdit: () => void;
  onCancel: () => void;
  onSave: () => void;
  saving?: boolean;
  saveLabel?: string;
  children: ReactNode;
  className?: string;
};

export function ProfileSectionCard({
  icon: Icon,
  title,
  editing,
  onEdit,
  onCancel,
  onSave,
  saving = false,
  saveLabel = 'Save',
  children,
  className,
}: ProfileSectionCardProps) {
  return (
    <section
      className={cn(
        'flex flex-col rounded-[4px] border border-border bg-surface p-6',
        className
      )}
    >
      <div className="mb-5 flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-[4px] bg-parchment text-ledger">
            <Icon className="h-4 w-4" strokeWidth={1.75} />
          </span>
          <h2 className="font-display text-[20px] leading-tight tracking-[-0.01em] text-ink">{title}</h2>
        </div>
        {!editing ? (
          <button
            type="button"
            onClick={onEdit}
            className="inline-flex items-center gap-1.5 rounded-[4px] px-2 py-1 text-[13px] text-slate transition-colors hover:bg-parchment hover:text-ink"
          >
            <Pencil className="h-3.5 w-3.5" />
            Edit
          </button>
        ) : null}
      </div>

      <div className="flex-1">{children}</div>

      {editing ? (
        <div className="mt-6 flex flex-wrap gap-3 border-t border-border/60 pt-5">
          <Button loading={saving} onClick={onSave}>
            {saveLabel}
          </Button>
          <Button variant="secondary" disabled={saving} onClick={onCancel}>
            Cancel
          </Button>
        </div>
      ) : null}
    </section>
  );
}

type ProfileFieldProps = {
  label: string;
  value?: string | null;
  className?: string;
};

export function ProfileField({ label, value, className }: ProfileFieldProps) {
  const display = value?.trim() ? value : 'Not provided';
  const empty = !value?.trim();

  return (
    <div className={className}>
      <p className="eyebrow mb-1">{label}</p>
      <p className={cn('text-[14px] leading-snug', empty ? 'text-slate' : 'text-ink')}>{display}</p>
    </div>
  );
}

type ProfileInputProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  multiline?: boolean;
  rows?: number;
};

export function ProfileInput({
  label,
  value,
  onChange,
  type = 'text',
  placeholder,
  disabled,
  className,
  multiline,
  rows = 3,
}: ProfileInputProps) {
  const inputClass =
    'w-full rounded-[4px] border border-border bg-parchment px-3 py-2 text-[14px] text-ink placeholder:text-slate/70 focus:border-ledger/40 focus:outline-none disabled:bg-border/20 disabled:text-slate';

  return (
    <label className={cn('block', className)}>
      <span className="eyebrow mb-1 block">{label}</span>
      {multiline ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          rows={rows}
          className={cn(inputClass, 'resize-none')}
        />
      ) : (
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          className={inputClass}
        />
      )}
    </label>
  );
}
