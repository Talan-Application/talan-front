import type { ReactNode } from 'react';
import { Header } from './Header';

export function Layout({ children }: { children: ReactNode }) {
  return (
    <>
      <Header />
      <main style={{ flex: 1, textAlign: 'left' }}>
        {children}
      </main>
    </>
  );
}
