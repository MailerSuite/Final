import { Line, LineChart, CartesianGrid, XAxis, YAxis, Tooltip } from "recharts";
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart";

export interface TrendPoint {
  time: string;
  sent: number;
}

interface Props {
  data: TrendPoint[];
}

export default function TrendLine({ data }: Props) {
  return (
    <ChartContainer config={{ sent: { color: "hsl(var(--primary))" } }}>
      <LineChart data={data} aria-label="Performance Trend">
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="time" />
        <YAxis allowDecimals={false} />
        <Tooltip content={<ChartTooltipContent />} />
        <Line type="monotone" dataKey="sent" stroke="hsl(var(--primary))" />
      </LineChart>
    </ChartContainer>
  );
}
