import type { ReactNode } from 'react';

interface ResponsiveTableProps {
  /** Content rendered on md+ (768px) — the standard table */
  table: ReactNode;
  /** Content rendered below md — card/list layout */
  cards: ReactNode;
}

export function ResponsiveTable({ table, cards }: ResponsiveTableProps) {
  return (
    <>
      <div className="hidden md:block">{table}</div>
      <div className="block md:hidden">{cards}</div>
    </>
  );
}
