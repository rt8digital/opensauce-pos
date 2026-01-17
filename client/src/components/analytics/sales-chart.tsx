import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import type { Order } from '../../../../shared/types';
import { useCurrency } from '@/contexts/currency-context';

interface SalesChartProps {
  orders: Order[];
}

export function SalesChart({ orders }: SalesChartProps) {
  const { formatPrice } = useCurrency();

  const dailySales = React.useMemo(() => {
    const salesByDay = orders.reduce((acc, order) => {
      const created = order.createdAt ?? Date.now();
      const date = new Date(created as any);
      const dateKey = date.toISOString().split('T')[0];
      acc[dateKey] = (acc[dateKey] || 0) + Number(order.total);
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(salesByDay)
      .map(([date, total]) => ({
        date,
        total,
        displayDate: new Date(date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [orders]);

  return (
    <div className="h-full min-h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={dailySales}
          margin={{
            top: 10,
            right: 10,
            left: 0,
            bottom: 0,
          }}
        >
          <defs>
            <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
              <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border)/0.5)" />
          <XAxis
            dataKey="displayDate"
            style={{ fontSize: '12px', fill: 'hsl(var(--foreground)/0.6)' }}
            axisLine={false}
            tickLine={false}
            tickMargin={10}
          />
          <YAxis
            style={{ fontSize: '12px', fill: 'hsl(var(--foreground)/0.6)' }}
            tickFormatter={(value) => formatPrice(value)}
            axisLine={false}
            tickLine={false}
            tickMargin={10}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'hsl(var(--card))',
              borderColor: 'hsl(var(--border))',
              borderRadius: '12px',
              boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
              fontSize: '13px',
              padding: '12px',
              border: '1px solid hsl(var(--border))'
            }}
            itemStyle={{ color: 'hsl(var(--primary))', fontWeight: 'bold' }}
            formatter={(value) => [formatPrice(Number(value)), 'Revenue']}
          />
          <Area
            type="monotone"
            dataKey="total"
            stroke="hsl(var(--primary))"
            strokeWidth={3}
            fillOpacity={1}
            fill="url(#colorTotal)"
            activeDot={{ r: 6, stroke: 'hsl(var(--background))', strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
