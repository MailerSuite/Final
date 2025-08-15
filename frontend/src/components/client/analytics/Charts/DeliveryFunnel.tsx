import { Bar, BarChart, CartesianGrid, Tooltip, XAxis, YAxis } from "recharts";
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart";

export interface DeliveryStats {
  stage: string;
  count: number;
}

interface Props {
  data: DeliveryStats[];
}

export default function DeliveryFunnel({ data }: Props) {
  return (
    <ChartContainer config={{ count: { color: "hsl(var(--primary))" } }}>
      <BarChart data={data} aria-label="Delivery Funnel">
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="stage" />
        <YAxis allowDecimals={false} />
        <Tooltip content={<ChartTooltipContent />} />
        <Bar dataKey="count" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ChartContainer>
  );
}
