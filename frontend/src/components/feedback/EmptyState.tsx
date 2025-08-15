import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface Props {
  message: string
  cta?: { label: string; onClick: () => void }
  className?: string
}

export default function EmptyState({ message, cta, className }: Props) {
  return (
    <div className={cn('flex items-center justify-center py-10', className)}>
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <CardTitle className="text-base text-muted-foreground">Nothing here yet</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{message}</p>
          {cta && (
            <Button className="mt-4" onClick={cta.onClick}>
              {cta.label}
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
