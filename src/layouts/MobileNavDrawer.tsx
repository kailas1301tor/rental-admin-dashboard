import { Sidebar } from '@/layouts/Sidebar';

export function MobileNavDrawer({
  open,
  onClose,
  badges,
}: {
  open: boolean;
  onClose: () => void;
  badges?: Partial<Record<string, number>>;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-40 lg:hidden">
      <button
        type="button"
        className="absolute inset-0 bg-black/50"
        aria-label="Close navigation"
        onClick={onClose}
      />
      <aside className="absolute inset-y-0 left-0 w-[min(100%,18rem)] shadow-xl">
        <Sidebar onNavigate={onClose} badges={badges} />
      </aside>
    </div>
  );
}
