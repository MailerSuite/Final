export interface PageMeta {
  title: string;
  description: string;
}

export function getPageMeta(pathname: string): PageMeta {
  const map: Record<string, PageMeta> = {
    '/smtp/checker/config': {
      title: 'Advanced SMTP Checker Configuration',
      description: 'Configure and test your SMTP server settings with our advanced SMTP checker.'
    },
    '/imap/checker': {
      title: 'IMAP Mailbox Checker',
      description: 'Test and verify IMAP mailbox connectivity and credentials seamlessly.'
    },
    '/mailing/dashboard': {
      title: 'Mailing Dashboard',
      description: 'Overview of your mailing campaigns, statistics, and delivery performance.'
    },
    '/mailing-dashboard': {
      title: 'Mailing Dashboard',
      description: 'Overview of your mailing campaigns, statistics, and delivery performance.'
    }
    // add your other console routes here...
  };
  return map[pathname] || {
    title: 'Mega-AI Console',
    description: 'Powerful mail and server tools by Mega-AI.'
  };
}
