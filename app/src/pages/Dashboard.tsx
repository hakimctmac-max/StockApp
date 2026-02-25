import { useTranslation } from 'react-i18next';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Package, 
  ShoppingCart, 
  Users, 
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  Plus,
  Receipt
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useAuthStore, useProductsStore, useSalesStore, useSettingsStore } from '@/store';
import { formatCurrency, formatDate, formatNumber } from '@/lib/utils';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from 'recharts';

export default function DashboardPage() {
  const { t, i18n } = useTranslation();
  const { currentUser } = useAuthStore();
  const { products, getLowStockProducts } = useProductsStore();
  const { sales, getTodaySales, getWeekSales, getMonthSales, getCartTotal } = useSalesStore();
  const { settings } = useSettingsStore();
  
  const locale = i18n.language === 'fr' ? 'fr-FR' : i18n.language === 'ar' ? 'ar-SA' : 'en-US';
  
  // Calculate stats
  const todaySales = getTodaySales();
  const weekSales = getWeekSales();
  const monthSales = getMonthSales();
  
  const todayRevenue = todaySales.reduce((sum, s) => sum + s.total, 0);
  const weekRevenue = weekSales.reduce((sum, s) => sum + s.total, 0);
  const monthRevenue = monthSales.reduce((sum, s) => sum + s.total, 0);
  
  const totalRevenue = sales
    .filter((s) => s.status === 'completed')
    .reduce((sum, s) => sum + s.total, 0);
  
  const totalProfit = sales
    .filter((s) => s.status === 'completed')
    .reduce((sum, s) => {
      const itemsCost = s.items.reduce(
        (cost, item) => cost + (item.product?.purchasePrice || 0) * item.quantity,
        0
      );
      return sum + (s.total - itemsCost - s.vatAmount);
    }, 0);
  
  const lowStockProducts = getLowStockProducts();
  const outOfStockProducts = products.filter((p) => p.quantity === 0);
  
  const totalStockValue = products.reduce(
    (sum, p) => sum + p.purchasePrice * p.quantity,
    0
  );
  
  // Top products
  const productSales: Record<string, { name: string; quantity: number; revenue: number }> = {};
  sales.forEach((sale) => {
    if (sale.status === 'completed') {
      sale.items.forEach((item) => {
        if (productSales[item.productId]) {
          productSales[item.productId].quantity += item.quantity;
          productSales[item.productId].revenue += item.total;
        } else if (item.product) {
          productSales[item.productId] = {
            name: item.product.name,
            quantity: item.quantity,
            revenue: item.total,
          };
        }
      });
    }
  });
  
  const topProducts = Object.values(productSales)
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 5);
  
  // Chart data (last 7 days)
  const salesChartData = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    const daySales = sales.filter(
      (s) =>
        new Date(s.createdAt).toISOString().split('T')[0] === dateStr &&
        s.status === 'completed'
    );
    salesChartData.push({
      date: formatDate(date, locale, { day: 'numeric', month: 'short' }),
      sales: daySales.length,
      revenue: daySales.reduce((sum, s) => sum + s.total, 0),
    });
  }
  
  // Category distribution
  const categoryData: Record<string, number> = {};
  products.forEach((p) => {
    const catName = p.category?.name || 'Sans catégorie';
    categoryData[catName] = (categoryData[catName] || 0) + p.quantity;
  });
  
  const pieData = Object.entries(categoryData)
    .map(([name, value]) => ({ name, value }))
    .slice(0, 5);
  
  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];
  
  const statCards = [
    {
      title: t('dashboard.todaySales'),
      value: formatCurrency(todayRevenue, settings.company.currency, locale),
      change: '+12%',
      trend: 'up',
      icon: DollarSign,
      color: 'bg-blue-500',
    },
    {
      title: t('dashboard.weekSales'),
      value: formatCurrency(weekRevenue, settings.company.currency, locale),
      change: '+8%',
      trend: 'up',
      icon: TrendingUp,
      color: 'bg-green-500',
    },
    {
      title: t('dashboard.monthSales'),
      value: formatCurrency(monthRevenue, settings.company.currency, locale),
      change: '-3%',
      trend: 'down',
      icon: ShoppingCart,
      color: 'bg-purple-500',
    },
    {
      title: t('dashboard.totalRevenue'),
      value: formatCurrency(totalRevenue, settings.company.currency, locale),
      change: '+15%',
      trend: 'up',
      icon: Receipt,
      color: 'bg-orange-500',
    },
  ];
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {t('dashboard.welcome')}, {currentUser?.name?.split(' ')[0]}!
          </h1>
          <p className="text-muted-foreground mt-1">
            {t('dashboard.welcomeMessage', { name: currentUser?.name?.split(' ')[0] })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Calendar className="w-4 h-4 mr-2" />
            {formatDate(new Date(), locale)}
          </Button>
        </div>
      </div>
      
      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat, index) => (
          <Card key={index}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                  <p className="text-2xl font-bold mt-1">{stat.value}</p>
                  <div className="flex items-center gap-1 mt-1">
                    {stat.trend === 'up' ? (
                      <ArrowUpRight className="w-4 h-4 text-green-500" />
                    ) : (
                      <ArrowDownRight className="w-4 h-4 text-red-500" />
                    )}
                    <span className={stat.trend === 'up' ? 'text-green-500' : 'text-red-500'}>
                      {stat.change}
                    </span>
                    <span className="text-muted-foreground text-sm">vs hier</span>
                  </div>
                </div>
                <div className={`${stat.color} p-3 rounded-lg`}>
                  <stat.icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Sales Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>{t('dashboard.salesChart')}</CardTitle>
            <CardDescription>Évolution des ventes sur les 7 derniers jours</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={salesChartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="date" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip 
                  formatter={(value: number) => formatCurrency(value, settings.company.currency, locale)}
                  contentStyle={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)' }}
                />
                <Bar dataKey="revenue" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        
        {/* Category Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Répartition par catégorie</CardTitle>
            <CardDescription>Stock par catégorie</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-4 space-y-2">
              {pieData.map((entry, index) => (
                <div key={entry.name} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                    <span>{entry.name}</span>
                  </div>
                  <span className="font-medium">{entry.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Bottom Row */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Top Products */}
        <Card>
          <CardHeader>
            <CardTitle>{t('dashboard.topProducts')}</CardTitle>
            <CardDescription>Les produits les plus vendus</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topProducts.length > 0 ? (
                topProducts.map((product, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium text-sm">{product.name}</p>
                        <p className="text-xs text-muted-foreground">{product.quantity} vendus</p>
                      </div>
                    </div>
                    <span className="font-medium text-sm">
                      {formatCurrency(product.revenue, settings.company.currency, locale)}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground text-center py-4">{t('dashboard.noData')}</p>
              )}
            </div>
          </CardContent>
        </Card>
        
        {/* Stock Alerts */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>{t('dashboard.lowStockAlert')}</CardTitle>
              <CardDescription>Produits nécessitant attention</CardDescription>
            </div>
            <Badge variant="destructive" className="h-6">
              {lowStockProducts.length + outOfStockProducts.length}
            </Badge>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {outOfStockProducts.slice(0, 3).map((product) => (
                <div key={product.id} className="flex items-center gap-3 p-2 bg-red-50 dark:bg-red-950/20 rounded-lg">
                  <AlertTriangle className="w-5 h-5 text-red-500" />
                  <div className="flex-1">
                    <p className="font-medium text-sm">{product.name}</p>
                    <p className="text-xs text-red-600">Rupture de stock</p>
                  </div>
                </div>
              ))}
              {lowStockProducts.slice(0, 3 - outOfStockProducts.length).map((product) => (
                <div key={product.id} className="flex items-center gap-3 p-2 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg">
                  <Package className="w-5 h-5 text-yellow-500" />
                  <div className="flex-1">
                    <p className="font-medium text-sm">{product.name}</p>
                    <p className="text-xs text-yellow-600">
                      Stock faible: {product.quantity} / {product.minQuantity}
                    </p>
                  </div>
                </div>
              ))}
              {lowStockProducts.length === 0 && outOfStockProducts.length === 0 && (
                <p className="text-muted-foreground text-center py-4">Aucune alerte</p>
              )}
            </div>
          </CardContent>
        </Card>
        
        {/* Quick Actions & Stock Value */}
        <Card>
          <CardHeader>
            <CardTitle>{t('dashboard.quickActions')}</CardTitle>
            <CardDescription>Actions rapides disponibles</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" className="w-full" size="sm">
                <Plus className="w-4 h-4 mr-2" />
                {t('dashboard.newSale')}
              </Button>
              <Button variant="outline" className="w-full" size="sm">
                <Package className="w-4 h-4 mr-2" />
                {t('dashboard.addProduct')}
              </Button>
            </div>
            
            <div className="pt-4 border-t">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">{t('dashboard.stockValue')}</span>
                <span className="font-bold">
                  {formatCurrency(totalStockValue, settings.company.currency, locale)}
                </span>
              </div>
              <Progress value={75} className="h-2" />
              <p className="text-xs text-muted-foreground mt-2">
                {products.length} produits en stock
              </p>
            </div>
            
            <div className="pt-2 border-t">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Bénéfice total</span>
                <span className="font-bold text-green-600">
                  {formatCurrency(totalProfit, settings.company.currency, locale)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Marge moyenne</span>
                <span className="font-medium">
                  {totalRevenue > 0 ? ((totalProfit / totalRevenue) * 100).toFixed(1) : 0}%
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
