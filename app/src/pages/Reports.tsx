import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  TrendingUp, 
  Download, 
  Printer, 
  Calendar,
  FileText,
  Package,
  ShoppingCart,
  DollarSign,
  Users,
  Boxes
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useSalesStore, useProductsStore, useSettingsStore, useAuthStore } from '@/store';
import { formatCurrency, formatDate } from '@/lib/utils';
import { 
  generateSalesReportPDF, 
  generateInventoryReportPDF, 
  generateProfitReportPDF,
  generateTopProductsReportPDF,
  downloadPDF 
} from '@/lib/pdf-generator';
import { toast } from 'sonner';
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

export default function ReportsPage() {
  const { t, i18n } = useTranslation();
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [activeTab, setActiveTab] = useState('sales');
  
  const { sales } = useSalesStore();
  const { products } = useProductsStore();
  const { settings } = useSettingsStore();
  const { currentUser } = useAuthStore();
  
  const locale = i18n.language === 'fr' ? 'fr-FR' : i18n.language === 'ar' ? 'ar-SA' : 'en-US';
  
  // Filter sales by date
  const getFilteredSales = () => {
    if (!startDate && !endDate) return sales;
    return sales.filter(sale => {
      const saleDate = new Date(sale.createdAt);
      const start = startDate ? new Date(startDate) : null;
      const end = endDate ? new Date(endDate) : null;
      if (start && saleDate < start) return false;
      if (end && saleDate > end) return false;
      return true;
    });
  };
  
  const filteredSales = getFilteredSales();
  
  // Calculate stats
  const totalRevenue = filteredSales
    .filter(s => s.status === 'completed')
    .reduce((sum, s) => sum + s.total, 0);
  
  const totalProfit = filteredSales
    .filter(s => s.status === 'completed')
    .reduce((sum, s) => {
      const itemsCost = s.items.reduce(
        (cost, item) => cost + (item.product?.purchasePrice || 0) * item.quantity,
        0
      );
      return sum + (s.total - itemsCost - s.vatAmount);
    }, 0);
  
  // Sales chart data
  const salesByDate: Record<string, number> = {};
  filteredSales.forEach(sale => {
    const date = new Date(sale.createdAt).toISOString().split('T')[0];
    salesByDate[date] = (salesByDate[date] || 0) + sale.total;
  });
  
  const salesChartData = Object.entries(salesByDate)
    .map(([date, amount]) => ({ date, amount }))
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-30);
  
  // Top products
  const productSales: Record<string, { name: string; quantity: number; revenue: number }> = {};
  filteredSales.forEach(sale => {
    sale.items.forEach(item => {
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
  });
  
  const topProducts = Object.values(productSales)
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 10);
  
  // Payment methods
  const paymentMethods: Record<string, number> = {};
  filteredSales.forEach(sale => {
    paymentMethods[sale.paymentMethod] = (paymentMethods[sale.paymentMethod] || 0) + sale.total;
  });
  
  const paymentData = Object.entries(paymentMethods).map(([name, value]) => ({
    name: name === 'cash' ? 'Espèces' : name === 'card' ? 'Carte' : name === 'transfer' ? 'Virement' : 'Mixte',
    value
  }));
  
  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'];
  
  // Download report
  const handleDownload = () => {
    const filters = { startDate: startDate ? new Date(startDate) : undefined, endDate: endDate ? new Date(endDate) : undefined };
    
    switch (activeTab) {
      case 'sales':
        const salesDoc = generateSalesReportPDF(filteredSales, settings.company, filters, locale);
        downloadPDF(salesDoc, `rapport-ventes-${new Date().toISOString().split('T')[0]}.pdf`);
        break;
      case 'inventory':
        const invDoc = generateInventoryReportPDF(products, settings.company, locale);
        downloadPDF(invDoc, `rapport-inventaire-${new Date().toISOString().split('T')[0]}.pdf`);
        break;
      case 'profits':
        const profitDoc = generateProfitReportPDF(filteredSales, products, settings.company, filters, locale);
        downloadPDF(profitDoc, `rapport-benefices-${new Date().toISOString().split('T')[0]}.pdf`);
        break;
      case 'top-products':
        const topDoc = generateTopProductsReportPDF(filteredSales, products, settings.company, locale);
        downloadPDF(topDoc, `rapport-top-produits-${new Date().toISOString().split('T')[0]}.pdf`);
        break;
    }
    toast.success('Rapport téléchargé');
  };
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('reports.title')}</h1>
          <p className="text-muted-foreground">Analysez vos performances</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleDownload}>
            <Download className="w-4 h-4 mr-2" />
            {t('reports.downloadPdf')}
          </Button>
        </div>
      </div>
      
      {/* Date Filter */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4 items-end">
            <div className="space-y-2 flex-1">
              <Label>{t('reports.startDate')}</Label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="space-y-2 flex-1">
              <Label>{t('reports.endDate')}</Label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
            <Button variant="outline" onClick={() => { setStartDate(''); setEndDate(''); }}>
              Réinitialiser
            </Button>
          </div>
        </CardContent>
      </Card>
      
      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Ventes</p>
                <p className="text-2xl font-bold">{filteredSales.filter(s => s.status === 'completed').length}</p>
              </div>
              <ShoppingCart className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Revenu</p>
                <p className="text-2xl font-bold">
                  {formatCurrency(totalRevenue, settings.company.currency, locale)}
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Bénéfice</p>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(totalProfit, settings.company.currency, locale)}
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Marge</p>
                <p className="text-2xl font-bold">
                  {totalRevenue > 0 ? ((totalProfit / totalRevenue) * 100).toFixed(1) : 0}%
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Report Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-4 w-full">
          <TabsTrigger value="sales">{t('reports.salesReport')}</TabsTrigger>
          <TabsTrigger value="profits">{t('reports.profitReport')}</TabsTrigger>
          <TabsTrigger value="inventory">{t('reports.inventoryReport')}</TabsTrigger>
          <TabsTrigger value="top-products">{t('reports.topProductsReport')}</TabsTrigger>
        </TabsList>
        
        <TabsContent value="sales" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Évolution des ventes</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={salesChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tickFormatter={(date) => new Date(date).toLocaleDateString(locale, { day: 'numeric', month: 'short' })} />
                  <YAxis tickFormatter={(value) => formatCurrency(value, settings.company.currency, locale)} />
                  <Tooltip formatter={(value: number) => formatCurrency(value, settings.company.currency, locale)} />
                  <Line type="monotone" dataKey="amount" stroke="#3b82f6" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Répartition par mode de paiement</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={paymentData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="value"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {paymentData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => formatCurrency(value, settings.company.currency, locale)} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="profits" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Analyse des bénéfices</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="text-center p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">Revenu total</p>
                  <p className="text-xl font-bold">{formatCurrency(totalRevenue, settings.company.currency, locale)}</p>
                </div>
                <div className="text-center p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">Coût total</p>
                  <p className="text-xl font-bold">{formatCurrency(totalRevenue - totalProfit, settings.company.currency, locale)}</p>
                </div>
                <div className="text-center p-4 bg-green-50 dark:bg-green-950/20 rounded-lg">
                  <p className="text-sm text-muted-foreground">Bénéfice net</p>
                  <p className="text-xl font-bold text-green-600">{formatCurrency(totalProfit, settings.company.currency, locale)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="inventory" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>État du stock</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 gap-4 mb-6">
                <div className="text-center p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">Total produits</p>
                  <p className="text-xl font-bold">{products.length}</p>
                </div>
                <div className="text-center p-4 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg">
                  <p className="text-sm text-muted-foreground">Stock faible</p>
                  <p className="text-xl font-bold text-yellow-600">
                    {products.filter(p => p.quantity <= p.minQuantity && p.quantity > 0).length}
                  </p>
                </div>
                <div className="text-center p-4 bg-red-50 dark:bg-red-950/20 rounded-lg">
                  <p className="text-sm text-muted-foreground">Rupture</p>
                  <p className="text-xl font-bold text-red-600">
                    {products.filter(p => p.quantity === 0).length}
                  </p>
                </div>
                <div className="text-center p-4 bg-green-50 dark:bg-green-950/20 rounded-lg">
                  <p className="text-sm text-muted-foreground">Valeur stock</p>
                  <p className="text-xl font-bold text-green-600">
                    {formatCurrency(
                      products.reduce((sum, p) => sum + p.purchasePrice * p.quantity, 0),
                      settings.company.currency,
                      locale
                    )}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="top-products" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Produits les plus vendus</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={topProducts.slice(0, 10)} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={150} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="quantity" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
