import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Icon } from './ui';

const NAV = [
  { to: '/', label: 'Candidates', icon: Icon.users, end: true },
  { to: '/pipeline', label: 'Pipeline', icon: Icon.pipeline },
  { to: '/schedule', label: 'Schedule', icon: Icon.calendar },
  { to: '/ai-screening', label: 'AI Screening', icon: Icon.brain },
  { to: '/jobs', label: 'Jobs', icon: Icon.briefcase },
];

export default function Sidebar({ jobCount = 6 }) {
  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="logo-icon">H</div>
        <span className="logo-text">HireAI</span>
        <span className="logo-badge">AI</span>
      </div>
      <nav className="sidebar-nav">
        <div className="nav-section">Recruitment</div>
        {NAV.slice(0, 3).map(({ to, label, icon: I, end }) => (
          <NavLink key={to} to={to} end={end}
            className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
            <I /><span>{label}</span>
          </NavLink>
        ))}
        <div className="nav-section">Intelligence</div>
        {NAV.slice(3).map(({ to, label, icon: I }) => (
          <NavLink key={to} to={to}
            className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
            <I /><span>{label}</span>
          </NavLink>
        ))}
      </nav>
      <div className="sidebar-footer">
        <div className="sidebar-footer-job">Active job postings</div>
        <div className="sidebar-footer-count">{jobCount}</div>
      </div>
    </aside>
  );
}