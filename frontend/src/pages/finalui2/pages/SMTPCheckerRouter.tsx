import React from 'react';
import { useSearchParams } from 'react-router-dom';
import SMTPCheckerPage from './SMTPCheckerPage';

// Adapter to map legacy tab names to current Tabs values
const SMTPCheckerRouter: React.FC = () => {
    const [params] = useSearchParams();
    const raw = (params.get('tab') || '').toLowerCase();
    const map: Record<string, string> = {
        config: 'connection',
        connection: 'connection',
        auth: 'authentication',
        authentication: 'authentication',
        message: 'message',
        advanced: 'advanced',
    };
    const tab = map[raw] || 'connection';
    return <SMTPCheckerPage initialTab={tab as any} /> as any;
};

export default SMTPCheckerRouter;

