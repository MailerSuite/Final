import React from 'react';
import { useSearchParams } from 'react-router-dom';
import IMAPInboxPage from './IMAPInboxPage';

// Adapter for /imap/checker?tab=host-config|live-test-results|conditions
const IMAPCheckerRouter: React.FC = () => {
  const [params] = useSearchParams();
  const tab = params.get('tab') || 'host-config';
  return <IMAPInboxPage initialTab={tab as any} /> as any;
};

export default IMAPCheckerRouter;

