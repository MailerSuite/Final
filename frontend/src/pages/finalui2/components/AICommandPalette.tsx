import React, { useState, useEffect } from 'react';
import {
  MagnifyingGlassIcon,
  XMarkIcon,
  RocketLaunchIcon,
  DocumentTextIcon,
  UserGroupIcon,
  ChartBarIcon,
  SparklesIcon,
  Cog6ToothIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';

interface Command {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<unknown>;
  action: () => void;
  category: string;
  shortcut?: string;
}

interface AICommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AICommandPalette: React.FC<AICommandPaletteProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);

  const commands: Command[] = [
    {
      id: '1',
      title: 'Create New Campaign',
      description: 'Start a new email marketing campaign',
      icon: RocketLaunchIcon,
      action: () => {
        navigate('campaigns/new');
        onClose();
      },
      category: 'Actions',
      shortcut: '⌘N'
    },
    {
      id: '2',
      title: 'Generate Email Template',
      description: 'Use AI to create a new template',
      icon: DocumentTextIcon,
      action: () => {
        navigate('templates/new');
        onClose();
      },
      category: 'AI Tools',
      shortcut: '⌘T'
    },
    {
      id: '3',
      title: 'View Analytics',
      description: 'Check campaign performance metrics',
      icon: ChartBarIcon,
      action: () => {
        navigate('analytics');
        onClose();
      },
      category: 'Navigation'
    },
    {
      id: '4',
      title: 'Manage Contacts',
      description: 'View and organize your contact lists',
      icon: UserGroupIcon,
      action: () => {
        navigate('contacts');
        onClose();
      },
      category: 'Navigation'
    },
    {
      id: '5',
      title: 'AI Assistant',
      description: 'Get help from AI assistant',
      icon: SparklesIcon,
      action: () => {
        navigate('assistant');
        onClose();
      },
      category: 'AI Tools',
      shortcut: '⌘/'
    },
    {
      id: '6',
      title: 'Settings',
      description: 'Configure your account settings',
      icon: Cog6ToothIcon,
      action: () => {
        navigate('settings');
        onClose();
      },
      category: 'Navigation',
      shortcut: '⌘,'
    }
  ];

  const filteredCommands = commands.filter(cmd =>
    cmd.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    cmd.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const groupedCommands = filteredCommands.reduce((acc, cmd) => {
    if (!acc[cmd.category]) acc[cmd.category] = [];
    acc[cmd.category].push(cmd);
    return acc;
  }, {} as Record<string, Command[]>);

  useEffect(() => {
    if (!isOpen) {
      setSearchQuery('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev =>
          prev < filteredCommands.length - 1 ? prev + 1 : 0
        );
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev =>
          prev > 0 ? prev - 1 : filteredCommands.length - 1
        );
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filteredCommands[selectedIndex]) {
          filteredCommands[selectedIndex].action();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filteredCommands, selectedIndex, onClose]);

  if (!isOpen) return null;

  return (
    <>
      <div className="command-overlay" onClick={onClose} />
      <div className="command-palette glass-panel" role="dialog" aria-modal="true" aria-label="Command palette">
        <div className="command-header">
          <MagnifyingGlassIcon className="search-icon" />
          <input
            type="text"
            placeholder="Type a command or search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="command-input"
            autoFocus
          />
          <button onClick={onClose} className="close-btn">
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        <div className="command-list">
          {Object.entries(groupedCommands).map(([category, cmds]) => (
            <div key={category} className="command-group">
              <div className="command-category">{category}</div>
              {cmds.map((cmd, idx) => {
                const globalIndex = filteredCommands.indexOf(cmd);
                return (
                  <button
                    key={cmd.id}
                    className={`command-item ${globalIndex === selectedIndex ? 'selected' : ''}`}
                    onClick={cmd.action}
                    onMouseEnter={() => setSelectedIndex(globalIndex)}
                  >
                    <cmd.icon className="command-icon" />
                    <div className="command-info">
                      <div className="command-title">{cmd.title}</div>
                      <div className="command-description">{cmd.description}</div>
                    </div>
                    {cmd.shortcut && (
                      <div className="command-shortcut">{cmd.shortcut}</div>
                    )}
                    <ArrowRightIcon className="command-arrow" />
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        <div className="command-footer">
          <div className="footer-hint">
            <kbd>↑↓</kbd> Navigate
          </div>
          <div className="footer-hint">
            <kbd>↵</kbd> Select
          </div>
          <div className="footer-hint">
            <kbd>ESC</kbd> Close
          </div>
        </div>
      </div>

      <style>{`
        .command-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.7);
          backdrop-filter: blur(4px);
          z-index: 70;
        }

        .command-palette {
          position: fixed;
          top: 20%;
          left: 50%;
          transform: translateX(-50%);
          width: 90%;
          max-width: 640px;
          max-height: 60vh;
          background: var(--ai-bg-elevated);
          border-radius: var(--ai-radius-xl);
          display: flex;
          flex-direction: column;
          z-index: 80;
          animation: fadeIn 0.2s ease-out;
        }

        .command-header {
          padding: 20px;
          border-bottom: 1px solid var(--ai-border);
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .search-icon {
          width: 20px;
          height: 20px;
          color: var(--ai-text-tertiary);
          flex-shrink: 0;
        }

        .command-input {
          flex: 1;
          background: transparent;
          border: none;
          outline: none;
          color: var(--ai-text-primary);
          font-size: 16px;
        }

        .command-input::placeholder {
          color: var(--ai-text-tertiary);
        }

        .close-btn {
          padding: 4px;
          background: transparent;
          border: none;
          color: var(--ai-text-tertiary);
          cursor: pointer;
          border-radius: var(--ai-radius-md);
          transition: all 0.2s ease;
        }

        .close-btn:hover {
          background: var(--ai-bg-hover);
          color: var(--ai-text-primary);
        }

        .command-list {
          flex: 1;
          overflow-y: auto;
          padding: 8px;
        }

        .command-group {
          margin-bottom: 16px;
        }

        .command-category {
          padding: 8px 12px;
          font-size: 11px;
          font-weight: 600;
          color: var(--ai-text-tertiary);
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .command-item {
          width: 100%;
          padding: 12px 16px;
          display: flex;
          align-items: center;
          gap: 12px;
          background: transparent;
          border: none;
          color: var(--ai-text-secondary);
          cursor: pointer;
          border-radius: var(--ai-radius-md);
          transition: all 0.2s ease;
          text-align: left;
        }

        .command-item:hover,
        .command-item.selected {
          background: var(--ai-bg-hover);
          color: var(--ai-text-primary);
        }

        .command-item.selected {
          background: var(--ai-accent-light);
        }

        .command-icon {
          width: 20px;
          height: 20px;
          flex-shrink: 0;
        }

        .command-info {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .command-title {
          font-size: 14px;
          font-weight: 500;
        }

        .command-description {
          font-size: 12px;
          color: var(--ai-text-tertiary);
        }

        .command-shortcut {
          padding: 4px 8px;
          background: var(--ai-bg-secondary);
          border: 1px solid var(--ai-border);
          border-radius: var(--ai-radius-sm);
          font-size: 11px;
          font-family: monospace;
          color: var(--ai-text-tertiary);
        }

        .command-arrow {
          width: 16px;
          height: 16px;
          opacity: 0;
          transition: opacity 0.2s ease;
        }

        .command-item:hover .command-arrow,
        .command-item.selected .command-arrow {
          opacity: 1;
        }

        .command-footer {
          padding: 12px 20px;
          border-top: 1px solid var(--ai-border);
          display: flex;
          gap: 16px;
        }

        .footer-hint {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
          color: var(--ai-text-tertiary);
        }

        .footer-hint kbd {
          padding: 2px 6px;
          background: var(--ai-bg-secondary);
          border: 1px solid var(--ai-border);
          border-radius: 4px;
          font-family: monospace;
          font-size: 11px;
        }
      `}</style>
    </>
  );
};