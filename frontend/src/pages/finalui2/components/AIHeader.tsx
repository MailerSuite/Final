import React, { useState } from 'react';
import { 
  MagnifyingGlassIcon,
  BellIcon,
  SparklesIcon,
  CommandLineIcon,
  UserCircleIcon,
  ArrowPathIcon,
  PlusIcon
} from '@heroicons/react/24/outline';
import { ThemePicker } from './ThemePicker';

interface AIHeaderProps {
  onToggleAssistant: () => void;
  onOpenCommand: () => void;
}

export const AIHeader: React.FC<AIHeaderProps> = ({ onToggleAssistant, onOpenCommand }) => {
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <header className="ai-header">
      <div className="header-left">
        <div className="search-container glass-panel">
          <MagnifyingGlassIcon className="search-icon" />
          <input
            type="text"
            placeholder="Search or ask AI..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
          <div className="search-shortcuts">
            <kbd>⌘K</kbd>
          </div>
        </div>
      </div>

      <div className="header-center">
        <button className="quick-action glass-button">
          <PlusIcon className="w-4 h-4" />
          <span>New Campaign</span>
        </button>
        <button className="quick-action glass-button" onClick={onToggleAssistant}>
          <SparklesIcon className="w-4 h-4" />
          <span>AI Assistant</span>
        </button>
        <button className="quick-action glass-button" onClick={onOpenCommand}>
          <CommandLineIcon className="w-4 h-4" />
          <span>Commands</span>
        </button>
      </div>

      <div className="header-right">
        <ThemePicker showInNavbar />
        
        <button className="header-icon-btn">
          <ArrowPathIcon className="w-5 h-5" />
        </button>
        
        <button className="header-icon-btn notification-btn">
          <BellIcon className="w-5 h-5" />
          <span className="notification-badge">3</span>
        </button>

        <div className="user-menu">
          <button className="user-menu-btn glass-button">
            <UserCircleIcon className="w-6 h-6" />
            <div className="user-info">
              <span className="user-name">Admin User</span>
              <span className="user-role">Pro Plan</span>
            </div>
          </button>
        </div>
      </div>

      <style>{`
        .ai-header {
          height: var(--ai-header-height);
          background: var(--ai-bg-secondary);
          border-bottom: 1px solid var(--ai-border);
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 24px;
          gap: 24px;
        }

        .header-left {
          flex: 1;
          max-width: 500px;
        }

        .search-container {
          display: flex;
          align-items: center;
          padding: 8px 16px;
          gap: 12px;
        }

        .search-icon {
          width: 20px;
          height: 20px;
          color: var(--ai-text-tertiary);
          flex-shrink: 0;
        }

        .search-input {
          flex: 1;
          background: transparent;
          border: none;
          outline: none;
          color: var(--ai-text-primary);
          font-size: 14px;
        }

        .search-input::placeholder {
          color: var(--ai-text-tertiary);
        }

        .search-shortcuts {
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .search-shortcuts kbd {
          padding: 2px 6px;
          background: var(--ai-bg-elevated);
          border: 1px solid var(--ai-border);
          border-radius: 4px;
          font-size: 11px;
          font-family: monospace;
          color: var(--ai-text-tertiary);
        }

        .header-center {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .quick-action {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 14px;
          font-size: 13px;
          font-weight: 500;
          color: var(--ai-text-secondary);
          transition: all 0.2s ease;
        }

        .quick-action:hover {
          color: var(--ai-text-primary);
          transform: translateY(-1px);
        }

        .header-right {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .header-icon-btn {
          padding: 8px;
          border-radius: var(--ai-radius-md);
          color: var(--ai-text-secondary);
          background: transparent;
          border: none;
          cursor: pointer;
          transition: all 0.2s ease;
          position: relative;
        }

        .header-icon-btn:hover {
          background: var(--ai-bg-hover);
          color: var(--ai-text-primary);
        }

        .notification-btn {
          position: relative;
        }

        .notification-badge {
          position: absolute;
          top: 4px;
          right: 4px;
          width: 16px;
          height: 16px;
          background: var(--ai-accent);
          color: white;
          font-size: 10px;
          font-weight: 600;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .user-menu-btn {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 6px 12px;
        }

        .user-info {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          text-align: left;
        }

        .user-name {
          font-size: 13px;
          font-weight: 500;
          color: var(--ai-text-primary);
        }

        .user-role {
          font-size: 11px;
          color: var(--ai-text-tertiary);
        }

        @media (max-width: 768px) {
          .header-center {
            display: none;
          }
          
          .user-info {
            display: none;
          }
        }
      `}</style>
    </header>
  );
};