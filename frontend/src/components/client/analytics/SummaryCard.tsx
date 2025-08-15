import { Card, CardContent } from "@/components/ui/card";
import type { LucideIcon } from "lucide-react";

interface SummaryCardProps {
  label: string;
  value: number;
  icon: LucideIcon;
}

export default function SummaryCard({ label, value, icon: Icon }: SummaryCardProps) {
  return (
    <Card className="bg-gradient-to-br from-surface-2 to-surface-1 border">
      <CardContent className="p-4 flex flex-col items-center gap-2">
        <Icon className="w-5 h-5 text-primary" aria-hidden="true" />
        <div className="text-2xl font-bold" aria-label={label}>
          {value}
        </div>
        <div className="text-sm text-muted-foreground">{label}</div>
      </CardContent>
    </Card>
  );
}
