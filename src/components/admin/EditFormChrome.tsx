// No 'use client' here: this module has no client hooks of its own — every
// interactive handler arrives via props. Keeping it directive-free lets the
// `'use client'` parent forms (PostForm / WorkForm) bundle it without tripping
// Next's "props must be serializable" check on client-entry exports.

import { ArrowLeft, Check, Save, Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';

/**
 * Shared chrome for the admin edit/new screens (PostForm + WorkForm), matching
 * the EDIT layout from the design: a sticky action bar pinned under the admin
 * topbar, a 2-column main/sidebar grid, design cards, a status radio list, and
 * a featured toggle. All colours use shadcn theme tokens — no hardcoded hex.
 */

/** Sticky action bar: ← ยกเลิก · heading · [ลบ] · บันทึก. Lives at `top-12`
 *  to sit directly below the `h-12` AdminTopbar. */
export function EditActionBar({
  heading,
  onCancel,
  onDelete,
  deleting = false,
  saving = false,
  pending = false,
  saveLabel = 'บันทึก',
}: {
  heading: string;
  onCancel: () => void;
  /** Omit on `new` — the delete button only renders when provided. */
  onDelete?: () => void;
  deleting?: boolean;
  saving?: boolean;
  pending?: boolean;
  saveLabel?: string;
}) {
  return (
    <div className="sticky top-12 z-20 border-b border-border bg-background/90 backdrop-blur supports-[backdrop-filter]:bg-background/75">
      <div className="mx-auto flex max-w-[1100px] items-center gap-2 px-4 py-3 lg:px-8">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onCancel}
          disabled={pending}
          className="text-muted-foreground"
        >
          <ArrowLeft className="size-4" aria-hidden /> ยกเลิก
        </Button>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-foreground">
            {heading}
          </p>
        </div>
        {onDelete && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onDelete}
            disabled={pending}
            aria-busy={deleting}
            className="border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive"
          >
            {deleting ? (
              <Spinner className="size-4" />
            ) : (
              <Trash2 className="size-4" aria-hidden />
            )}
            ลบ
          </Button>
        )}
        <Button type="submit" disabled={pending} aria-busy={saving}>
          {saving ? (
            <Spinner className="size-4" />
          ) : (
            <Save className="size-4" aria-hidden />
          )}
          {saving ? 'กำลังบันทึก…' : saveLabel}
        </Button>
      </div>
    </div>
  );
}

/** 2-column shell: main fields + 312px meta sidebar. Stacks on mobile. */
export function EditGrid({
  main,
  side,
}: {
  main: React.ReactNode;
  side: React.ReactNode;
}) {
  return (
    <div className="mx-auto w-full max-w-[1100px] px-4 py-6 lg:px-8 lg:py-8">
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_312px] lg:items-start lg:gap-6">
        <div className="flex min-w-0 flex-col gap-4">{main}</div>
        <div className="flex min-w-0 flex-col gap-4 lg:sticky lg:top-28">
          {side}
        </div>
      </div>
    </div>
  );
}

/** Design card: white surface, soft border, rounded-2xl, optional title row. */
export function EditCard({
  title,
  description,
  action,
  className,
  children,
}: {
  title?: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section
      className={'rounded-2xl border border-border bg-card p-5 ' + (className ?? '')}
      aria-label={title}
    >
      {(title || action) && (
        <div className="mb-3 flex items-center justify-between gap-2">
          {title && (
            <h2 className="text-sm font-semibold text-foreground">{title}</h2>
          )}
          {action}
        </div>
      )}
      {description && (
        <p className="-mt-1 mb-3 text-xs text-muted-foreground">{description}</p>
      )}
      <div className="space-y-4">{children}</div>
    </section>
  );
}

/** Label + control + hint/error stack. */
export function FormField({
  id,
  label,
  error,
  required,
  hint,
  children,
}: {
  id?: string;
  label: string;
  error?: string;
  required?: boolean;
  hint?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-xs font-medium text-muted-foreground">
        {label}
        {required && <span className="text-destructive"> *</span>}
      </Label>
      {children}
      {hint && <p className="text-[11px] text-muted-foreground">{hint}</p>}
      {error && (
        <p id={id ? `${id}-error` : undefined} role="alert" className="text-xs text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}

/** Dot colour per content status — semantic warm tokens. */
export const STATUS_DOT: Record<string, string> = {
  draft: 'bg-warning',
  published: 'bg-success',
  archived: 'bg-muted-foreground',
};

export type StatusOption<T extends string> = {
  value: T;
  label: string;
  dot?: string;
};

/** Vertical radio list of status options (dot · label · check when active). */
export function StatusRadioGroup<T extends string>({
  value,
  onChange,
  options,
  ariaLabel = 'สถานะ',
}: {
  value: T;
  onChange: (next: T) => void;
  options: StatusOption<T>[];
  ariaLabel?: string;
}) {
  return (
    <div role="radiogroup" aria-label={ariaLabel} className="flex flex-col gap-1.5">
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(o.value)}
            className={
              'flex items-center gap-2.5 rounded-lg border px-3 py-2 text-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background ' +
              (active
                ? 'border-foreground/30 bg-secondary text-foreground'
                : 'border-border bg-card text-muted-foreground hover:bg-secondary/50')
            }
          >
            <span
              className={'size-2.5 shrink-0 rounded-full ' + (o.dot ?? 'bg-muted-foreground')}
              aria-hidden
            />
            <span className="flex-1 text-left">{o.label}</span>
            {active && <Check className="size-4 text-foreground" aria-hidden />}
          </button>
        );
      })}
    </div>
  );
}

/** Accessible on/off switch (role="switch"). */
export function ToggleSwitch({
  id,
  checked,
  onChange,
  label,
  description,
  disabled = false,
}: {
  id: string;
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
  description?: string;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="min-w-0">
        <Label htmlFor={id} className="text-sm font-medium text-foreground">
          {label}
        </Label>
        {description && (
          <p className="mt-0.5 text-[11px] text-muted-foreground">{description}</p>
        )}
      </div>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={
          'relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 ' +
          (checked ? 'bg-primary' : 'bg-muted')
        }
      >
        <span
          className={
            'inline-block size-5 rounded-full bg-card shadow-sm transition ' +
            (checked ? 'translate-x-[22px]' : 'translate-x-0.5')
          }
        />
      </button>
    </div>
  );
}

/** Slug input with a fixed URL prefix + Auto / EN generators. */
export function SlugField({
  prefix,
  registerProps,
  onAuto,
  onAutoAscii,
  error,
}: {
  prefix: string;
  /** Spread of `register('slug')`. */
  registerProps: React.InputHTMLAttributes<HTMLInputElement> & {
    ref?: React.Ref<HTMLInputElement>;
  };
  onAuto: () => void;
  onAutoAscii: () => void;
  error?: string;
}) {
  return (
    <FormField
      id="slug"
      label="Slug (URL)"
      required
      error={error}
      hint={
        <>
          a-z, 0-9, ไทย, dash · URL = {prefix}
          &lt;slug&gt;
        </>
      }
    >
      <div className="flex gap-2">
        <div className="flex flex-1 items-center overflow-hidden rounded-md border border-input bg-background focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/40">
          <span className="pl-3 pr-1 font-mono text-xs text-muted-foreground">
            {prefix}
          </span>
          <input
            id="slug"
            {...registerProps}
            maxLength={140}
            autoComplete="off"
            className="h-9 min-w-0 flex-1 bg-transparent pr-3 font-mono text-sm text-foreground outline-none"
          />
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onAuto}
          aria-label="สร้าง slug จากหัวข้อ (เก็บภาษาไทย)"
        >
          Auto
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onAutoAscii}
          aria-label="สร้าง slug แบบอักษรละติน"
        >
          EN
        </Button>
      </div>
    </FormField>
  );
}
