
"use client";

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts";
import { ChartTooltipContent } from "@/components/ui/chart";

interface SalesChartProps {
    data: any[];
    onBarClick?: (data: any) => void;
}

export default function SalesChart({data, onBarClick}: SalesChartProps) {
  return (
    <ResponsiveContainer width="100%" minHeight={350}>
      <BarChart data={data} onClick={onBarClick}>
        <XAxis
          dataKey="name"
          stroke="hsl(var(--muted-foreground))"
          fontSize={12}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          stroke="hsl(var(--muted-foreground))"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => `₹${value}`}
        />
        <Tooltip
            cursor={{fill: 'hsl(var(--accent) / 0.2)'}}
            content={<ChartTooltipContent />}
            wrapperClassName="font-body"
        />
        <Bar dataKey="total" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
