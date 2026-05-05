import React from "react";
import { X } from "lucide-react";

export function Modal({ title, children, onClose }) {
  return (
    <div className="modal-overlay open" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-head">
          <span className="modal-title">{title}</span>
          <button className="modal-close" onClick={onClose} type="button"><X size={16} /></button>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
}

export function ModalActions({ onClose, label }) {
  return (
    <div className="modal-foot">
      <button className="btn btn-ghost" type="button" onClick={onClose}>Cancel</button>
      <button className="btn btn-primary" type="submit">{label}</button>
    </div>
  );
}

export function Field({ label, children }) {
  return <label className="field"><span>{label}</span>{children}</label>;
}

export function CardHeader({ title, action }) {
  return <div className="card-header"><div className="card-title">{title}</div>{action}</div>;
}

export function StatCard({ tone, icon, value, label }) {
  return (
    <div className={`stat-card s-${tone}`}>
      <div className={`stat-icon si-${tone}`}>{icon}</div>
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
    </div>
  );
}

export function ProgressRow({ label, tone, count, total }) {
  const percent = Math.round((count / total) * 100);
  return (
    <div className="progress-row">
      <span className="progress-label">{label}</span>
      <div className="progress-bar"><div className={`progress-fill pf-${tone}`} style={{ width: `${percent}%` }} /></div>
      <span className="progress-count">{count}</span>
    </div>
  );
}

export function EmptyState({ label }) {
  return <div className="empty-state">{label}</div>;
}
