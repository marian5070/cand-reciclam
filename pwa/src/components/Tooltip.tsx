import {
  cloneElement,
  isValidElement,
  useId,
  useRef,
  useState,
  type ReactElement,
  type ReactNode,
} from 'react';
import { motion, AnimatePresence } from 'framer-motion';

type Side = 'top' | 'bottom' | 'left' | 'right';

export function Tooltip({
  children,
  content,
  side = 'top',
  delay = 350,
}: {
  children: ReactElement;
  content: ReactNode;
  side?: Side;
  delay?: number;
}) {
  const [open, setOpen] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const id = useId();

  const show = () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setOpen(true), delay);
  };
  const hide = () => {
    if (timer.current) clearTimeout(timer.current);
    setOpen(false);
  };

  if (!isValidElement(children)) return children;

  const childProps = children.props as Record<string, unknown>;
  const childClassName = typeof childProps.className === 'string' ? childProps.className : '';
  const trigger = cloneElement(children as ReactElement<Record<string, unknown>>, {
    onMouseEnter: show,
    onMouseLeave: hide,
    onFocus: show,
    onBlur: hide,
    onTouchStart: show,
    onTouchEnd: () => setTimeout(hide, 1500),
    'aria-describedby': open ? id : undefined,
    className: `relative ${childClassName}`,
  });

  const pos: Record<Side, string> = {
    top: 'bottom-[calc(100%+8px)] left-1/2 -translate-x-1/2',
    bottom: 'top-[calc(100%+8px)] left-1/2 -translate-x-1/2',
    left: 'right-[calc(100%+8px)] top-1/2 -translate-y-1/2',
    right: 'left-[calc(100%+8px)] top-1/2 -translate-y-1/2',
  };

  const origin: Record<Side, string> = {
    top: 'bottom',
    bottom: 'top',
    left: 'right',
    right: 'left',
  };

  return (
    <span className="relative inline-flex">
      {trigger}
      <AnimatePresence>
        {open && (
          <motion.span
            id={id}
            role="tooltip"
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            style={{ transformOrigin: origin[side] }}
            className={`absolute z-50 ${pos[side]} pointer-events-none rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] backdrop-blur-xl px-3.5 py-2.5 text-sm leading-relaxed text-[color:var(--color-fg)] shadow-[0_12px_32px_-12px_oklch(20%_0.04_160/0.5)] max-w-[280px] w-max`}
          >
            {content}
          </motion.span>
        )}
      </AnimatePresence>
    </span>
  );
}
