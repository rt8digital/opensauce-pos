import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { SalesChart } from '@/components/analytics/sales-chart';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import type { Order } from '../../../../shared/types';

const COLORS = [
  'hsl(142.1 86.2% 50%)', // Neon Green (Primary)
  '#3b82f6', // Bright Blue
  '#06b6d4', // Cyan
  '#8b5cf6', // Violet
  '#f59e0b', // Amber
  '#ec4899', // Pink
  '#10b981', // Emerald
];

interface AnalyticsChartsProps {
  filteredOrders: Order[];
  salesByCategory: { name: string; revenue: number; cost: number; profit: number }[];
  salesByPaymentMethod: { name: string; value: number }[];
  topProducts: { name: string; quantity: number }[];
  formatPrice: (price: number) => string;
}

export function AnalyticsCharts({
  filteredOrders,
  salesByCategory,
  salesByPaymentMethod,
  topProducts,
  formatPrice,
}: AnalyticsChartsProps) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 print:break-inside-avoid">
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm shadow-xl shadow-black/5 overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
          <CardHeader>
            <CardTitle className="text-xl font-bold tracking-tight">Sales Performance</CardTitle>
            <CardDescription className="text-muted-foreground/80">Revenue trends over the selected period</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[400px] w-full pt-4">
              <SalesChart orders={filteredOrders} />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2 print:break-inside-avoid">
        <Card className="flex flex-col border-border/50 bg-card/50 backdrop-blur-sm shadow-lg shadow-black/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-bold">Sales by Category</CardTitle>
            <CardDescription className="text-sm">Revenue distribution by category</CardDescription>
          </CardHeader>
          <CardContent className="h-[450px]">
            <ResponsiveContainer width="100%" height={400}>
              <PieChart>
                <Pie
                  data={salesByCategory}
                  cx="50%"
                  cy="50%"
                  innerRadius={80}
                  outerRadius={120}
                  paddingAngle={8}
                  dataKey="revenue"
                  stroke="transparent"
                >
                  {salesByCategory.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    borderColor: 'hsl(var(--border))',
                    borderRadius: '12px',
                    boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                    border: '1px solid hsl(var(--border))',
                    padding: '12px'
                  }}
                  itemStyle={{ color: 'hsl(var(--foreground))', fontWeight: 'bold' }}
                  formatter={(value) => [formatPrice(Number(value)), 'Revenue']}
                />
                <Legend
                  verticalAlign="bottom"
                  align="center"
                  wrapperStyle={{ paddingTop: '20px', fontSize: '13px' }}
                  iconType="circle"
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="flex flex-col border-border/50 bg-card/50 backdrop-blur-sm shadow-lg shadow-black/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-bold">Payment Methods</CardTitle>
            <CardDescription className="text-sm">Usage distribution of payment channels</CardDescription>
          </CardHeader>
          <CardContent className="h-[450px]">
            <ResponsiveContainer width="100%" height={400}>
              <PieChart>
                <Pie
                  data={salesByPaymentMethod}
                  cx="50%"
                  cy="50%"
                  innerRadius={80}
                  outerRadius={120}
                  paddingAngle={8}
                  dataKey="value"
                  stroke="transparent"
                >
                  {salesByPaymentMethod.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[(index + 2) % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    borderColor: 'hsl(var(--border))',
                    borderRadius: '12px',
                    boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                    border: '1px solid hsl(var(--border))',
                    padding: '12px'
                  }}
                  itemStyle={{ color: 'hsl(var(--foreground))', fontWeight: 'bold' }}
                  formatter={(value) => [formatPrice(Number(value)), 'Amount']}
                />
                <Legend
                  verticalAlign="bottom"
                  align="center"
                  wrapperStyle={{ paddingTop: '20px', fontSize: '13px' }}
                  iconType="circle"
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="flex flex-col md:col-span-1 lg:col-span-2 border-border/50 bg-card/50 backdrop-blur-sm shadow-lg shadow-black/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-bold">Top 5 Products</CardTitle>
            <CardDescription className="text-sm">Best performing items by quantity</CardDescription>
          </CardHeader>
          <CardContent className="h-[450px] pt-6">
            <ResponsiveContainer width="100%" height={400}>
              <BarChart
                data={topProducts}
                layout="vertical"
                margin={{ left: 0, right: 30, top: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border)/0.5)" />
                <XAxis type="number" hide />
                <YAxis
                  dataKey="name"
                  type="category"
                  width={140}
                  style={{ fontSize: '12px', fontWeight: 500, fill: 'hsl(var(--foreground)/0.7)' }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  cursor={{ fill: 'hsl(var(--primary) / 0.05)' }}
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    borderColor: 'hsl(var(--border))',
                    borderRadius: '12px',
                    boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                    border: '1px solid hsl(var(--border))',
                    padding: '12px'
                  }}
                  itemStyle={{ color: 'hsl(var(--primary))', fontWeight: 'bold' }}
                />
                <Bar
                  dataKey="quantity"
                  fill="hsl(var(--primary))"
                  radius={[0, 8, 8, 0]}
                  barSize={32}
                  className="drop-shadow-[0_0_8px_rgba(34,197,94,0.3)]"
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}