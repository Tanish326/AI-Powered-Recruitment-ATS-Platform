import React, { useState, useEffect, useCallback } from 'react';

// ── Icons (inline SVG) ─────────────────────────────────────
export const Icon = {
  users: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M16 11c1.657 0 3-1.343 3-3s-1.343-3-3-3M16 21v-1a5 5 0 00-9.999-.175M12 11a4 4 0 100-8 4 4 0 000 8zM21 21v-1a5 5 0 00-4-4.9"/></svg>,
  pipeline: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="3" width="7" height="9" rx="1"/><rect x="14" y="3" width="7" height="5" rx="1"/><rect x="14" y="12" width="7" height="9" rx="1"/><rect x="3" y="16" width="7" height="5" rx="1"/></svg>,
  calendar: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>,
  brain: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 2C8 2 5 5 5 9c0 1.5.5 3 1.4 4.1L5 21h14l-1.4-7.9C18.5 12 19 10.5 19 9c0-4-3-7-7-7z"/><path d="M9 9h.01M15 9h.01M9 13h6"/></svg>,
  briefcase: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2M12 12v.01"/></svg>,
  upload: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12"/></svg>,
  sparkles: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5L12 3zM3 18l1 3 3-1-3 1-1-3z"/></svg>,
  search: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>,
  x: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M18 6L6 18M6 6l12 12"/></svg>,
  plus: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 5v14M5 12h14"/></svg>,
  check: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M20 6L9 17l-5-5"/></svg>,
  trash: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6M10 11v6M14 11v6M9 6V4h6v2"/></svg>,
  edit: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
  arrow_right: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>,
  clock: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  link: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/></svg>,
  filter: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>,
  refresh: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 11-2.12-9.36L23 10"/></svg>,
  chevron_down: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><polyline points="6 9 12 15 18 9"/></svg>,
};

// ── Score Ring ─────────────────────────────────────────────
export function ScoreRing({ score, size = 44 }) {
  const r = (size / 2) - 4;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  const color = score >= 80 ? '#10B981' : score >= 65 ? '#2563EB' : score >= 50 ? '#F59E0B' : '#EF4444';
  const textColor = score >= 80 ? '#34D399' : score >= 65 ? '#60A5FA' : score >= 50 ? '#FCD34D' : '#FCA5A5';

  return (
    <div className="score-ring" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="3.5"/>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth="3.5"
          strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"/>
      </svg>
      <div className="score-num" style={{ color: textColor, fontSize: size < 40 ? 10 : 12 }}>
        {score ? Math.round(score) : '—'}
      </div>
    </div>
  );
}

// ── Status Chip ────────────────────────────────────────────
export function StatusChip({ stage }) {
  const map = {
    applied: ['chip-applied', 'Applied'],
    screening: ['chip-screening', 'Screening'],
    interview: ['chip-interview', 'Interview'],
    offer: ['chip-offer', 'Offer'],
    rejected: ['chip-rejected', 'Rejected'],
    hired: ['chip-hired', 'Hired'],
  };
  const [cls, label] = map[stage] || ['chip-applied', stage];
  return <span className={`chip ${cls}`}>{label}</span>;
}

// ── Avatar ─────────────────────────────────────────────────
const AVATAR_COLORS = [
  { bg: 'rgba(139,92,246,0.2)', color: '#C4B5FD' },
  { bg: 'rgba(37,99,235,0.2)', color: '#93C5FD' },
  { bg: 'rgba(16,185,129,0.15)', color: '#6EE7B7' },
  { bg: 'rgba(245,158,11,0.15)', color: '#FCD34D' },
  { bg: 'rgba(239,68,68,0.12)', color: '#FCA5A5' },
  { bg: 'rgba(236,72,153,0.12)', color: '#F9A8D4' },
];
export function Avatar({ name, size = 38 }) {
  const initials = name?.split(' ').map(w => w[0]).slice(0, 2).join('') || '?';
  const idx = name?.charCodeAt(0) % AVATAR_COLORS.length || 0;
  const { bg, color } = AVATAR_COLORS[idx];
  return (
    <div className="cand-avatar" style={{ width: size, height: size, background: bg, color, fontSize: size < 36 ? 11 : 13 }}>
      {initials}
    </div>
  );
}

// ── Modal ──────────────────────────────────────────────────
export function Modal({ open, onClose, title, children, footer }) {
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  if (!open) return null;
  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <span className="modal-title">{title}</span>
          <button className="btn btn-ghost btn-icon" onClick={onClose}><Icon.x /></button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </div>
  );
}

// ── Toast ──────────────────────────────────────────────────
let addToastFn;
export function ToastContainer() {
  const [toasts, setToasts] = useState([]);
  addToastFn = useCallback((msg, type = 'success') => {
    const id = Date.now();
    setToasts(t => [...t, { id, msg, type }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3500);
  }, []);

  return (
    <div className="toast-container">
      {toasts.map(t => (
        <div key={t.id} className={`toast ${t.type}`}>
          {t.type === 'success' ? <Icon.check /> : <Icon.x />}
          {t.msg}
        </div>
      ))}
    </div>
  );
}
export const toast = (msg, type) => addToastFn?.(msg, type);

// ── Progress Bar ───────────────────────────────────────────
export function ProgressBar({ label, value, color }) {
  const c = color || (value >= 80 ? '#10B981' : value >= 60 ? '#2563EB' : '#F59E0B');
  return (
    <div className="progress-item">
      <div className="progress-label">
        <span style={{ color: 'var(--text-dim)' }}>{label}</span>
        <span style={{ color: c }}>{Math.round(value)}%</span>
      </div>
      <div className="progress-track">
        <div className="progress-fill" style={{ width: `${value}%`, background: c }} />
      </div>
    </div>
  );
}

// ── Loading ────────────────────────────────────────────────
export function Loading() {
  return <div className="loading"><div className="spinner" /></div>;
}

// ── Empty State ────────────────────────────────────────────
export function EmptyState({ icon: IconComp, title, description, action }) {
  return (
    <div className="empty-state">
      {IconComp && <IconComp />}
      <strong>{title}</strong>
      {description && <p>{description}</p>}
      {action}
    </div>
  );
}

// ── Metric Card ────────────────────────────────────────────
export function MetricCard({ label, value, delta, deltaUp, color }) {
  return (
    <div className="metric-card">
      <div className="metric-label">{label}</div>
      <div className="metric-value" style={color ? { color } : {}}>{value}</div>
      {delta && (
        <div className={`metric-delta ${deltaUp !== false ? 'delta-up' : 'delta-dn'}`}>
          {delta}
        </div>
      )}
    </div>
  );
}

// ── Select ─────────────────────────────────────────────────
export function Select({ value, onChange, options, placeholder }) {
  return (
    <select className="form-input" value={value} onChange={e => onChange(e.target.value)}
      style={{ cursor: 'pointer' }}>
      {placeholder && <option value="">{placeholder}</option>}
      {options.map(o => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  );
}