import type { ReactNode } from 'react';

interface Props {
  title: string;
  wide?: boolean;
  onClose: () => void;
  children: ReactNode;
}

export function Modal({ title, wide, onClose, children }: Props) {
  return (
    <div className="qm-overlay" onClick={onClose}>
      <div className={`qm-box${wide ? ' qm-box-wide' : ''}`} onClick={e => e.stopPropagation()}>
        <div className="qm-header">
          <h3 className="qm-title">{title}</h3>
          <button className="qm-close" onClick={onClose}>×</button>
        </div>
        {children}
      </div>
    </div>
  );
}
