import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Search, 
  Eye, 
  Printer, 
  Download, 
  Mail,
  Check,
  X,
  Calendar,
  User,
  Receipt
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useSalesStore, useSettingsStore } from '@/store';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import { generateInvoicePDF, downloadPDF } from '@/lib/pdf-generator';
import { toast } from 'sonner';
import type { Sale } from '@/types';

export default function SalesPage() {
  const { t, i18n } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [activeTab, setActiveTab] = useState('all');
  
  const { sales, cancelSale } = useSalesStore();
  const { settings } = useSettingsStore();
  
  const locale = i18n.language === 'fr' ? 'fr-FR' : i18n.language === 'ar' ? 'ar-SA' : 'en-US';
  
  // Filter sales
  const filteredSales = sales.filter(sale => {
    const matchesSearch = 
      sale.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sale.customer?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sale.seller?.name?.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (activeTab === 'completed') return matchesSearch && sale.status === 'completed';
    if (activeTab === 'pending') return matchesSearch && sale.status === 'pending';
    if (activeTab === 'cancelled') return matchesSearch && sale.status === 'cancelled';
    return matchesSearch;
  });
  
  // Open details dialog
  const openDetailsDialog = (sale: Sale) => {
    setSelectedSale(sale);
    setShowDetailsDialog(true);
  };
  
  // Download invoice
  const handleDownloadInvoice = (sale: Sale) => {
    const doc = generateInvoicePDF({
      sale,
      company: settings.company,
      appName: settings.company.name,
    });
    downloadPDF(doc, `facture-${sale.invoiceNumber}.pdf`);
    toast.success('Facture téléchargée');
  };
  
  // Handle cancel sale
  const handleCancelSale = () => {
    if (selectedSale) {
      cancelSale(selectedSale.id);
      toast.success('Vente annulée');
      setShowDetailsDialog(false);
    }
  };
  
  // Get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="success">{t('sales.completed')}</Badge>;
      case 'pending':
        return <Badge variant="warning">{t('sales.pending')}</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">{t('sales.cancelled')}</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };
  
  // Get payment method label
  const getPaymentMethodLabel = (method: string) => {
    const labels: Record<string, string> = {
      cash: 'Espèces',
      card: 'Carte',
      transfer: 'Virement',
      mixed: 'Mixte',
    };
    return labels[method] || method;
  };
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('sales.title')}</h1>
          <p className="text-muted-foreground">Historique de toutes les ventes</p>
        </div>
      </div>
      
      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total ventes</p>
                <p className="text-2xl font-bold">{sales.length}</p>
              </div>
              <Receipt className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Ventes complétées</p>
                <p className="text-2xl font-bold text-green-600">
                  {sales.filter(s => s.status === 'completed').length}
                </p>
              </div>
              <Check className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Ventes annulées</p>
                <p className="text-2xl font-bold text-red-600">
                  {sales.filter(s => s.status === 'cancelled').length}
                </p>
              </div>
              <X className="w-8 h-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Revenu total</p>
                <p className="text-2xl font-bold">
                  {formatCurrency(
                    sales.filter(s => s.status === 'completed').reduce((sum, s) => sum + s.total, 0),
                    settings.company.currency,
                    locale
                  )}
                </p>
              </div>
              <Receipt className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Sales List */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder={t('app.search')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList>
                <TabsTrigger value="all">Toutes</TabsTrigger>
                <TabsTrigger value="completed">Complétées</TabsTrigger>
                <TabsTrigger value="cancelled">Annulées</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[calc(100vh-28rem)]">
            <table className="w-full">
              <thead className="bg-muted sticky top-0">
                <tr>
                  <th className="text-left p-3 text-sm font-medium">{t('sales.invoiceNumber')}</th>
                  <th className="text-left p-3 text-sm font-medium">{t('sales.date')}</th>
                  <th className="text-left p-3 text-sm font-medium">{t('sales.customer')}</th>
                  <th className="text-left p-3 text-sm font-medium">{t('sales.seller')}</th>
                  <th className="text-right p-3 text-sm font-medium">{t('sales.total')}</th>
                  <th className="text-center p-3 text-sm font-medium">{t('sales.status')}</th>
                  <th className="text-right p-3 text-sm font-medium">{t('app.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {filteredSales.map((sale) => (
                  <tr key={sale.id} className="border-b hover:bg-muted/50">
                    <td className="p-3 font-mono text-sm">{sale.invoiceNumber}</td>
                    <td className="p-3 text-sm">{formatDateTime(sale.createdAt, locale)}</td>
                    <td className="p-3 text-sm">{sale.customer?.name || 'Client comptant'}</td>
                    <td className="p-3 text-sm">{sale.seller?.name}</td>
                    <td className="p-3 text-right font-medium">
                      {formatCurrency(sale.total, settings.company.currency, locale)}
                    </td>
                    <td className="p-3 text-center">{getStatusBadge(sale.status)}</td>
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openDetailsDialog(sale)}>
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDownloadInvoice(sale)}>
                          <Download className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {filteredSales.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <Receipt className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>{t('sales.noSales')}</p>
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
      
      {/* Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t('sales.saleDetails')}</DialogTitle>
          </DialogHeader>
          
          {selectedSale && (
            <div className="space-y-6 py-4">
              {/* Header Info */}
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{t('sales.invoiceNumber')}</p>
                  <p className="text-xl font-bold font-mono">{selectedSale.invoiceNumber}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">{t('sales.date')}</p>
                  <p className="font-medium">{formatDateTime(selectedSale.createdAt, locale)}</p>
                </div>
              </div>
              
              {/* Status & Payment */}
              <div className="flex items-center gap-4">
                {getStatusBadge(selectedSale.status)}
                <Badge variant="outline">{getPaymentMethodLabel(selectedSale.paymentMethod)}</Badge>
              </div>
              
              {/* Customer & Seller */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
                <div>
                  <p className="text-sm text-muted-foreground">{t('sales.customer')}</p>
                  <p className="font-medium">{selectedSale.customer?.name || 'Client comptant'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t('sales.seller')}</p>
                  <p className="font-medium">{selectedSale.seller?.name}</p>
                </div>
              </div>
              
              {/* Items */}
              <div>
                <p className="font-medium mb-3">{t('sales.items')}</p>
                <div className="space-y-2">
                  {selectedSale.items.map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <div>
                        <p className="font-medium">{item.product?.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {item.quantity} x {formatCurrency(item.unitPrice, settings.company.currency, locale)}
                        </p>
                      </div>
                      <p className="font-medium">{formatCurrency(item.total, settings.company.currency, locale)}</p>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Totals */}
              <div className="space-y-2 pt-4 border-t">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t('sales.subtotal')}</span>
                  <span>{formatCurrency(selectedSale.subtotal, settings.company.currency, locale)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t('sales.vat')}</span>
                  <span>{formatCurrency(selectedSale.vatAmount, settings.company.currency, locale)}</span>
                </div>
                <div className="flex justify-between text-lg font-bold">
                  <span>{t('sales.total')}</span>
                  <span className="text-primary">{formatCurrency(selectedSale.total, settings.company.currency, locale)}</span>
                </div>
              </div>
              
              {/* Actions */}
              <div className="flex gap-2 pt-4">
                <Button variant="outline" className="flex-1" onClick={() => handleDownloadInvoice(selectedSale)}>
                  <Download className="w-4 h-4 mr-2" />
                  {t('sales.downloadPdf')}
                </Button>
                <Button variant="outline" className="flex-1">
                  <Printer className="w-4 h-4 mr-2" />
                  {t('sales.printInvoice')}
                </Button>
                {selectedSale.status !== 'cancelled' && (
                  <Button variant="destructive" onClick={handleCancelSale}>
                    <X className="w-4 h-4 mr-2" />
                    {t('sales.cancelSale')}
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
