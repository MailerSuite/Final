import Joyride, { Step } from 'react-joyride'
import { useTour } from '@/hooks/useTour'

export const tourSteps: Step[] = [
  {
    target: '#tour-sidebar',
    title: 'Sidebar',
    content: 'This is the main navigation. Click here to jump between features.',
  },
  {
    target: '#nav-mailing-dashboard',
    title: 'Mailing Dashboard',
    content: 'View your sent campaigns and live stats.',
  },
  {
    target: '#nav-analytics',
    title: 'Analytics',
    content: 'Drill down into performance metrics.',
  },
  {
    target: '#nav-ai-dashboard',
    title: 'AI Dashboard',
    content: 'Use AI to draft and optimize email copy.',
  },
  {
    target: '#nav-smtp-checker',
    title: 'SMTP Checker',
    content: 'Test your SMTP credentials here.',
  },
  {
    target: '#nav-imap-checker',
    title: 'IMAP Checker',
    content: 'Monitor IMAP connections in real time.',
  },
  {
    target: '#tour-create-session',
    title: 'Create Session',
    content: 'Click here to start a new test session.',
  },
  {
    target: '#nav-live-console',
    title: 'Live Console',
    content: 'Watch console output for your tests.',
  },
  {
    target: '#nav-campaigns',
    title: 'Campaigns',
    content: 'Manage and send email campaigns.',
  },
]

export default function TourGuide({ steps = tourSteps }: { steps?: Step[] }) {
  const { run, stepIndex, handleCallback } = useTour()

  return (
    <Joyride
      steps={steps}
      run={run}
      stepIndex={stepIndex}
      continuous
      scrollToFirstStep
      showProgress
      showSkipButton
      disableScrolling
      spotlightClicks
      callback={handleCallback}
      styles={{
        options: {
          zIndex: 1000,
          arrowColor: 'hsl(var(--primary))',
          backgroundColor: 'hsl(var(--primary))',
          overlayColor: 'rgba(0,0,0,0.6)',
          primaryColor: 'hsl(var(--primary))',
          textColor: 'hsl(var(--foreground))',
        },
      }}
    />
  )
}
