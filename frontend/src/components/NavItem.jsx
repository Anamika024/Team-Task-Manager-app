import React from "react";

export function NavItem({ active, icon, label, badge, onClick }) {
  return (
    <button className={`nav-item ${active ? "active" : ""}`} onClick={onClick}>
      {React.cloneElement(icon, { className: "nav-icon", size: 16 })}
      {label}
      <span className="badge">{badge}</span>
    </button>
  );
}
