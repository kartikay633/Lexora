import React from 'react';
import './TabBar.css';

export default function TabBar({ tabs, activeTab, onTabChange }) {
  return (
    <div className="tab-bar-container">
      <div className="tab-bar-scroller">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              id={`tab-btn-${tab.id}`}
              className={`tab-btn ${isActive ? 'active' : ''}`}
              aria-pressed={isActive}
              onClick={() => onTabChange(tab.id)}
            >
              {tab.icon && <span className="tab-icon">{tab.icon}</span>}
              <span className="tab-label">{tab.label}</span>
              {tab.badge !== undefined && tab.badge > 0 && (
                <span className="tab-badge">{tab.badge}</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
