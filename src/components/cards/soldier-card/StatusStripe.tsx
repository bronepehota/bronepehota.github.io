import React from 'react';
import { clsx } from 'clsx';

export type SoldierState = 'done' | 'dead' | 'panic' | 'active';

interface StatusStripeProps {
  state: SoldierState;
  className?: string;
}

const StatusStripe: React.FC<StatusStripeProps> = ({ state, className }) => {
  const stripeStyles: Record<SoldierState, string> = {
    done: 'bg-gradient-to-b from-emerald-500 to-emerald-600 shadow-[0_0_8px_rgba(16,185,129,0.5)]',
    dead: 'bg-gradient-to-b from-red-600 to-red-700 shadow-[0_0_8px_rgba(220,38,38,0.5)]',
    panic: 'bg-gradient-to-b from-orange-500 to-amber-500 shadow-[0_0_8px_rgba(249,115,22,0.5)]',
    active: 'bg-transparent',
  };

  const widthClass = state === 'active' ? 'w-1' : 'w-1.5';

  return (
    <div
      className={clsx(
        'absolute left-0 top-0 bottom-0',
        widthClass,
        stripeStyles[state],
        className
      )}
      data-testid="soldier-status-stripe"
      aria-hidden="true"
    />
  );
};

export { StatusStripe };
export default StatusStripe;
