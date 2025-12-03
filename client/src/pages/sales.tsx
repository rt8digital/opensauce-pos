import React from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { MainLayout } from '@/components/layout/main-layout';
import { SalesChart } from '@/components/analytics/sales-chart';
import { useCurrency } from '@/contexts/currency-context';
import { useAuth } from '@/contexts/auth-context';
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
import {
  AlertCircle,
  DollarSign,
  ShoppingCart,
  TrendingUp,
  Calendar,
  Download
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { Order, OrderItemWithName, Product } from '@shared/schema';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export default function Sales() {
  const [dateRange, setDateRange] = React.useState({
    start: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0],
  });
  const { formatPrice } = useCurrency();

  const { data: orders = [], isLoading: isLoadingOrders } = useQuery<Order[]>({
    queryKey: ['/api/orders'],
  });

  const { data: products = [], isLoading: isLoadingProducts } = useQuery<Product[]>({
    queryKey: ['/api/products'],
  });

  const filteredOrders = React.useMemo(() => {
    return orders.filter(order => {
      const orderDate = new Date(order.createdAt).toISOString().split('T')[0];
      return orderDate >= dateRange.start && orderDate <= dateRange.end;
    });
  }, [orders, dateRange]);

  const totalSales = filteredOrders.reduce((sum, order) => sum + Number(order.total), 0);
  const totalOrders = filteredOrders.length;
  const averageOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0;

  const salesByCategory = React.useMemo(() => {
    const categoryMap = new Map<string, number>();
    filteredOrders.forEach(order => {
      order.items.forEach((item: OrderItemWithName) => {
        const product = products.find(p => p.id === item.productId);
        const category = product?.category || 'Unknown';
        const amount = Number(item.price) * item.quantity;
        categoryMap.set(category, (categoryMap.get(category) || 0) + amount);
      });
    });
    return Array.from(categoryMap.entries()).map(([name, value]) => ({ name, value }));
  }, [filteredOrders, products]);

  const salesByPaymentMethod = React.useMemo(() => {
    const methodMap = new Map<string, number>();
    filteredOrders.forEach(order => {
      methodMap.set(order.paymentMethod, (methodMap.get(order.paymentMethod) || 0) + Number(order.total));
    });
    return Array.from(methodMap.entries()).map(([name, value]) => ({ name, value }));
  }, [filteredOrders]);

  const topProducts = React.useMemo(() => {
    const productMap = new Map<string, number>();
    filteredOrders.forEach(order => {
      order.items.forEach((item: OrderItemWithName) => {
        productMap.set(item.productName, (productMap.get(item.productName) || 0) + item.quantity);
      });
    });
    return Array.from(productMap.entries())
      .map(([name, quantity]) => ({ name, quantity }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);
  }, [filteredOrders]);

  const handleExportPDF = () => {
    window.print();
  };

  if (isLoadingOrders || isLoadingProducts) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-screen">
          <AlertCircle className="mr-2 h-6 w-6 animate-spin" />
          Loading...
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="container mx-auto py-8 print:p-0">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 print:hidden">
          <h1 className="text-2xl font-bold">Sales Analytics</h1>
          <div className="flex flex-wrap gap-2 items-center">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <Input
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                className="w-[120px] text-xs md:text-sm"
              />
              <span className="text-xs md:text-sm">to</span>
              <Input
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                className="w-[120px] text-xs md:text-sm"
              />
            </div>
            <Button size="sm" className="text-xs md:text-sm" onClick={handleExportPDF} variant="outline">
              <Download className="mr-1 h-3 w-3 md:mr-2 md:h-4 md:w-4" />
              <span className="hidden xs:inline">Export PDF</span>
              <span className="xs:hidden">PDF</span>
            </Button>
          </div>
        </div>

        {/* Print Header */}
        <div className="hidden print:block mb-8 text-center">
          <h1 className="text-3xl font-bold">Sales Report</h1>
          <p className="text-muted-foreground">
            {new Date(dateRange.start).toLocaleDateString()} - {new Date(dateRange.end).toLocaleDateString()}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatPrice(totalSales)}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalOrders}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Order</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatPrice(averageOrderValue)}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 print:break-inside-avoid">
          <Card className="col-span-1">
            <CardHeader>
              <CardTitle>Sales Over Time</CardTitle>
              <CardDescription>Daily sales data visualization</CardDescription>
            </CardHeader>
            <CardContent>
              <SalesChart orders={filteredOrders} />
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-6 print:break-inside-avoid">
          <Card>
            <CardHeader>
              <CardTitle>Sales by Category</CardTitle>
            </CardHeader>
            <CardContent className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={salesByCategory}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {salesByCategory.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatPrice(Number(value))} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Payment Methods</CardTitle>
            </CardHeader>
            <CardContent className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={salesByPaymentMethod}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {salesByPaymentMethod.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatPrice(Number(value))} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Top Products</CardTitle>
            </CardHeader>
            <CardContent className="h-[250px] md:h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topProducts} layout="vertical" margin={{ left: 40, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={100} style={{ fontSize: '10px' }} tick={{ dx: -10 }} />
                  <Tooltip formatter={(value) => [value, 'Quantity']} />
                  <Bar dataKey="quantity" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Recent Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order ID</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Payment Method</TableHead>
                  <TableHead>Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.slice(0, 10).map((order) => (
                  <TableRow key={order.id}>
                    <TableCell>#{order.id}</TableCell>
                    <TableCell>
                      {new Date(order.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>{order.items.length} items</TableCell>
                    <TableCell>{order.paymentMethod}</TableCell>
                    <TableCell>{formatPrice(Number(order.total))}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
