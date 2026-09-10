import type { ReactNode } from 'react';

type RouteModalProps = {
  open: boolean;
  onClose: () => void;
  ariaLabel: string;
  maxWidthClass?: string;
  children: ReactNode;
};

export function RouteModal({
  open,
  onClose,
  ariaLabel,
  maxWidthClass = 'max-w-3xl',
  children,
}: RouteModalProps) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/55 p-4" onClick={onClose}>
      <section
        className={`max-h-[90vh] w-full ${maxWidthClass} overflow-auto rounded-3xl bg-white p-5 shadow-2xl`}
        role="dialog"
        aria-modal="true"
        aria-label={ariaLabel}
        onClick={(event) => event.stopPropagation()}
      >
        {children}
      </section>
    </div>
  );
}
