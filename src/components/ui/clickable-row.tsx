import {
  createContext,
  useContext,
  type KeyboardEvent,
  type MouseEvent,
  type ReactNode,
  type TdHTMLAttributes,
} from 'react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Td } from '@/components/ui/Table';

const ROW_INTERACTIVE_SELECTOR =
  'a, button, input, select, textarea, label, [data-row-action]';

type ClickableRowContextValue = {
  activate: () => void;
};

const ClickableRowContext = createContext<ClickableRowContextValue | null>(
  null,
);

export function stopRowNavigation(
  event: MouseEvent | KeyboardEvent,
) {
  event.stopPropagation();
}

function isInteractiveRowTarget(target: EventTarget | null) {
  return target instanceof HTMLElement
    ? Boolean(target.closest(ROW_INTERACTIVE_SELECTOR))
    : false;
}

export function ClickableTableRow({
  to,
  onActivate,
  children,
  className,
  ariaLabel,
}: {
  to?: string;
  onActivate?: () => void;
  children: ReactNode;
  className?: string;
  ariaLabel?: string;
}) {
  const navigate = useNavigate();

  function activate() {
    if (to) {
      navigate(to);
      return;
    }
    onActivate?.();
  }

  function onKeyDown(event: KeyboardEvent<HTMLTableRowElement>) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      activate();
    }
  }

  return (
    <ClickableRowContext.Provider value={{ activate }}>
      <tr
        className={cn(
          'cursor-pointer transition-colors hover:bg-accent-muted/30 focus-visible:bg-accent-muted/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent/40',
          className,
        )}
        onKeyDown={onKeyDown}
        tabIndex={0}
        aria-label={ariaLabel}
      >
        {children}
      </tr>
    </ClickableRowContext.Provider>
  );
}

export function ClickableTd({
  className,
  onClick,
  ...props
}: TdHTMLAttributes<HTMLTableCellElement>) {
  const ctx = useContext(ClickableRowContext);

  return (
    <Td
      className={cn('cursor-pointer', className)}
      onClick={(event) => {
        if (!isInteractiveRowTarget(event.target)) {
          ctx?.activate();
        }
        onClick?.(event);
      }}
      {...props}
    />
  );
}

export function TableActionsCell({
  className,
  children,
  ...props
}: React.TdHTMLAttributes<HTMLTableCellElement>) {
  return (
    <Td
      data-row-action
      className={cn('cursor-default text-right', className)}
      onClick={stopRowNavigation}
      onKeyDown={stopRowNavigation}
      {...props}
    >
      {children}
    </Td>
  );
}
