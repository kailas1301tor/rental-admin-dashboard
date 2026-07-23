import { useEffect } from 'react';
import { X } from 'lucide-react';
import { Sidebar } from '@/layouts/Sidebar';
import { cn } from '@/lib/utils';

export function MobileNavDrawer({
  open,
  onClose,
  badges,
}: {
  open: boolean;
  onClose: () => void;
  badges?: Partial<Record<string, number>>;
}) {
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);

  return (
    <div
      className={cn(
        'fixed inset-0 z-50 lg:hidden',
        open ? 'pointer-events-auto' : 'pointer-events-none',
      )}
      aria-hidden={!open}
    >
      <button
        type="button"
        className={cn(
          'absolute inset-0 bg-black/55 transition-opacity duration-300',
          open ? 'opacity-100' : 'opacity-0',
        )}
        aria-label="Close navigation"
        tabIndex={open ? 0 : -1}
        onClick={onClose}
      />
      <aside
        className={cn(
          'absolute inset-y-0 left-0 flex w-[min(100%,20rem)] flex-col shadow-2xl transition-transform duration-300 ease-out',
          'pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]',
          open ? 'translate-x-0' : '-translate-x-full',
        )}
        role="dialog"
        aria-modal="true"
        aria-label="Navigation menu"
      >
        <div className="absolute right-2 top-[calc(0.75rem+env(safe-area-inset-top))] z-10">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-border bg-surface text-text-secondary active:bg-accent-muted"
            aria-label="Close menu"
          >
            <X className="h-4 w-4" aria-hidden />
          </button>
        </div>
        <Sidebar onNavigate={onClose} badges={badges} />
      </aside>
    </div>
  );
}
