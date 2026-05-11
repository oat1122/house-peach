'use client';

import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { useEffect, type ReactNode } from 'react';

type Props = {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  /** Optional accessible label for the dialog (otherwise rely on header inside). */
  label?: string;
};

/**
 * Bottom-sheet style modal — spring slide-up on the panel, fade on the
 * backdrop. ESC closes; click outside closes.
 *
 * Prefer shadcn `<Sheet side="bottom">` when its shape fits — it handles
 * focus trap + ARIA roles for you. Reach for this only when you need a
 * looser, custom-shaped panel (e.g. a confirmation drawer with custom
 * footer chrome).
 */
export function SlideUpSheet({ open, onClose, children, label }: Props) {
  const reduce = useReducedMotion();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            aria-hidden
            className="fixed inset-0 z-40 bg-ink/50"
            initial={{ opacity: reduce ? 1 : 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduce ? 0 : 0.2 }}
            onClick={onClose}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={label}
            className="fixed inset-x-0 bottom-0 z-50 max-h-[85vh] overflow-auto rounded-t-2xl bg-card p-4 pb-[env(safe-area-inset-bottom)] shadow-2xl"
            initial={{ y: reduce ? 0 : '100%' }}
            animate={{ y: 0 }}
            exit={{ y: reduce ? 0 : '100%' }}
            transition={
              reduce
                ? { duration: 0 }
                : { type: 'spring', stiffness: 350, damping: 30 }
            }
          >
            {children}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
