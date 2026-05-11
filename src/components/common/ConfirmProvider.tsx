'use client';

import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from 'react';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export type ConfirmOptions = {
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** `destructive` makes the confirm button red — for delete actions. */
  tone?: 'default' | 'destructive';
};

type Pending = {
  options: ConfirmOptions;
  resolve: (value: boolean) => void;
};

const ConfirmContext = createContext<((opts: ConfirmOptions) => Promise<boolean>) | null>(
  null,
);

/**
 * Imperative confirm dialog — drop-in replacement for `window.confirm`.
 *
 *   const confirm = useConfirm();
 *   if (await confirm({ title: 'ลบรูปนี้?', tone: 'destructive' })) {
 *     await deleteAssetAction(...);
 *   }
 *
 * Renders one shared dialog inside `<ConfirmProvider>`. Only one prompt is
 * in flight at a time — calling `confirm()` while another is open resolves
 * the previous one with `false` (cancel).
 */
export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [pending, setPending] = useState<Pending | null>(null);

  const confirm = useCallback((options: ConfirmOptions) => {
    return new Promise<boolean>((resolve) => {
      setPending((previous) => {
        // Cancel any in-flight prompt before showing the new one.
        if (previous) previous.resolve(false);
        return { options, resolve };
      });
    });
  }, []);

  const respond = useCallback((value: boolean) => {
    setPending((current) => {
      current?.resolve(value);
      return null;
    });
  }, []);

  const options = pending?.options;

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <AlertDialog
        open={Boolean(pending)}
        onOpenChange={(open) => {
          if (!open) respond(false);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{options?.title ?? ''}</AlertDialogTitle>
            {options?.description && (
              <AlertDialogDescription>{options.description}</AlertDialogDescription>
            )}
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => respond(false)}>
              {options?.cancelLabel ?? 'ยกเลิก'}
            </AlertDialogCancel>
            <AlertDialogAction
              variant={options?.tone === 'destructive' ? 'destructive' : 'default'}
              onClick={() => respond(true)}
              autoFocus
            >
              {options?.confirmLabel ?? 'ยืนยัน'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  const ctx = useContext(ConfirmContext);
  if (!ctx) {
    throw new Error('useConfirm must be used within <ConfirmProvider>');
  }
  return ctx;
}
