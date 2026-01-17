import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, ShoppingCart, TrendingUp, BarChart3, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SalesMetricsCardsProps {
  totalSales: number;
  totalOrders: number;
  averageOrderValue: number;
  totalProfit: number;
  formatPrice: (price: number) => string;
}

export function SalesMetricsCards({
  totalSales,
  totalOrders,
  averageOrderValue,
  totalProfit,
  formatPrice,
}: SalesMetricsCardsProps) {
  const cards = [
    {
      title: 'Total Sales',
      value: formatPrice(totalSales),
      icon: DollarSign,
      trend: '+12.5%',
      trendUp: true,
      color: 'bg-emerald-500/10 text-emerald-500',
      gradient: 'from-emerald-500/20 to-transparent'
    },
    {
      title: 'Total Orders',
      value: totalOrders.toString(),
      icon: ShoppingCart,
      trend: '+5.2%',
      trendUp: true,
      color: 'bg-blue-500/10 text-blue-500',
      gradient: 'from-blue-500/20 to-transparent'
    },
    {
      title: 'Average Order',
      value: formatPrice(averageOrderValue),
      icon: BarChart3,
      trend: '-2.1%',
      trendUp: false,
      color: 'bg-amber-500/10 text-amber-500',
      gradient: 'from-amber-500/20 to-transparent'
    },
    {
      title: 'Total Profit',
      value: formatPrice(totalProfit),
      icon: TrendingUp,
      trend: '+8.4%',
      trendUp: true,
      color: 'bg-primary/10 text-primary',
      gradient: 'from-primary/20 to-transparent'
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {cards.map((card, index) => (
        <Card key={index} className="overflow-hidden border-border/50 bg-card/50 backdrop-blur-sm hover:border-primary/50 transition-all duration-300 group">
          <div className={cn("absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none", card.gradient)} />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">{card.title}</CardTitle>
            <div className={cn("p-2 rounded-xl transition-colors duration-300", card.color)}>
              <card.icon className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-3xl font-bold tracking-tight mb-1">{card.value}</div>
            <div className="flex items-center gap-1.5 text-xs">
              <span className={cn(
                "flex items-center font-medium",
                card.trendUp ? "text-emerald-500" : "text-rose-500"
              )}>
                {card.trendUp ? <ArrowUpRight className="h-3 w-3 mr-0.5" /> : <ArrowDownRight className="h-3 w-3 mr-0.5" />}
                {card.trend}
              </span>
              <span className="text-muted-foreground">vs last period</span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}