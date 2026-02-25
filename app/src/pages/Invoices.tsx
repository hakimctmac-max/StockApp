import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Search, 
  Eye, 
  Printer, 
  Download, 
  Mail,
  FileText,
  Calendar,
  Check
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useSalesStore, useSettingsStore } from '@/store';
import { formatCurrency, formatDate } from '@/lib/utils';
import { generateInvoicePDF, downloadPDF } from '@/lib/pdf-generator';
import { toast } from 'sonner';

export default function InvoicesPage() {
  const { t, i18n } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [showInvoiceDialog, setShowInvoiceDialog] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  
  const { sales } = useSalesStore();
  const { settings } = useSettingsStore();
  
  const locale = i18n.language === 'fr' ? 'fr-FR' : i18n.language === 'ar' ? 'ar-SA' : 'en-US';
  
  // Filter completed sales (invoices)
  const invoices = sales.filter(s => s.status === 'completed');
  
  const filteredInvoices = invoices.filter(invoice =>
    invoice.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
    invoice.customer?.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  // View invoice
  const viewInvoice = (invoice: any) => {
    setSelectedInvoice(invoice);
    setShowInvoiceDialog(true);
  };
  
  // Download invoice
  const handleDownload = (invoice: any) => {
    const doc = generateInvoicePDF({
      sale: invoice,
      company: settings.company,
      appName: settings.company.name,
    });
    downloadPDF(doc, `facture-${invoice.invoiceNumber}.pdf`);
    toast.success('Facture téléchargée');
  };
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('invoices.title')}</h1>
          <p className="text-muted-foreground">Gérez et consultez vos factures</p>
        </div>
      </div>
      
      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total factures</p>
                <p className="text-2xl font-bold">{invoices.length}</p>
              </div>
              <FileText className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Ce mois</p>
                <p className="text-2xl font-bold">
                  {invoices.filter(i => {
                    const date = new Date(i.createdAt);
                    const now = new Date();
                    return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
                  }).length}
                </p>
              </div>
              <Calendar className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Montant total</p>
                <p className="text-2xl font-bold">
                  {formatCurrency(
                    invoices.reduce((sum, i) => sum + i.total, 0),
                    settings.company.currency,
                    locale
                  )}
                </p>
              </div>
              <Check className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Invoices List */}
      <Card>
        <CardHeader>
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder={t('app.search')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[calc(100vh-26rem)]">
            <table className="w-full">
              <thead className="bg-muted sticky top-0">
                <tr>
                  <th className="text-left p-3 text-sm font-medium">{t('invoices.invoiceNumber')}</th>
                  <th className="text-left p-3 text-sm font-medium">{t('invoices.date')}</th>
                  <th className="text-left p-3 text-sm font-medium">{t('invoices.billTo')}</th>
                  <th className="text-right p-3 text-sm font-medium">{t('invoices.total')}</th>
                  <th className="text-right p-3 text-sm font-medium">{t('app.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {filteredInvoices.map((invoice) => (
                  <tr key={invoice.id} className="border-b hover:bg-muted/50">
                    <td className="p-3 font-mono text-sm">{invoice.invoiceNumber}</td>
                    <td className="p-3 text-sm">{formatDate(invoice.createdAt, locale)}</td>
                    <td className="p-3 text-sm">{invoice.customer?.name || 'Client comptant'}</td>
                    <td className="p-3 text-right font-medium">
                      {formatCurrency(invoice.total, settings.company.currency, locale)}
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => viewInvoice(invoice)}>
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDownload(invoice)}>
                          <Download className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {filteredInvoices.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Aucune facture trouvée</p>
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
      
      {/* Invoice Preview Dialog */}
      <Dialog open={showInvoiceDialog} onOpenChange={setShowInvoiceDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Aperçu de la facture</DialogTitle>
          </DialogHeader>
          
          {selectedInvoice && (
            <div className="bg-white dark:bg-gray-900 p-8 rounded-lg border">
              {/* Invoice Header */}
              <div className="flex justify-between items-start mb-8">
                <div>
                  <h2 className="text-2xl font-bold text-primary">{settings.company.name}</h2>
                  <p className="text-sm text-muted-foreground">{settings.company.address}</p>
                  <p className="text-sm text-muted-foreground">{settings.company.phone}</p>
                  <p className="text-sm text-muted-foreground">{settings.company.email}</p>
                </div>
                <div className="text-right">
                  <h1 className="text-3xl font-bold">FACTURE</h1>
                  <p className="text-lg font-mono mt-2">{selectedInvoice.invoiceNumber}</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {formatDate(selectedInvoice.createdAt, locale)}
                  </p>
                </div>
              </div>
              
              {/* Bill To */}
              <div className="mb-8">
                <p className="text-sm font-medium text-muted-foreground uppercase">Facturé à</p>
                <p className="font-medium">{selectedInvoice.customer?.name || 'Client comptant'}</p>
                {selectedInvoice.customer?.address && (
                  <p className="text-sm text-muted-foreground">{selectedInvoice.customer.address}</p>
                )}
                {selectedInvoice.customer?.phone && (
                  <p className="text-sm text-muted-foreground">{selectedInvoice.customer.phone}</p>
                )}
              </div>
              
              {/* Items Table */}
              <table className="w-full mb-8">
                <thead className="bg-muted">
                  <tr>
                    <th className="text-left p-3 text-sm font-medium">Description</th>
                    <th className="text-center p-3 text-sm font-medium">Qté</th>
                    <th className="text-right p-3 text-sm font-medium">Prix unitaire</th>
                    <th className="text-right p-3 text-sm font-medium">Montant</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedInvoice.items.map((item: any) => (
                    <tr key={item.id} className="border-b">
                      <td className="p-3">{item.product?.name}</td>
                      <td className="p-3 text-center">{item.quantity}</td>
                      <td className="p-3 text-right">
                        {formatCurrency(item.unitPrice, settings.company.currency, locale)}
                      </td>
                      <td className="p-3 text-right">
                        {formatCurrency(item.total, settings.company.currency, locale)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {/* Totals */}
              <div className="flex justify-end">
                <div className="w-64 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Sous-total</span>
                    <span>{formatCurrency(selectedInvoice.subtotal, settings.company.currency, locale)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">TVA ({settings.company.vatRate}%)</span>
                    <span>{formatCurrency(selectedInvoice.vatAmount, settings.company.currency, locale)}</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold border-t pt-2">
                    <span>Total</span>
                    <span className="text-primary">
                      {formatCurrency(selectedInvoice.total, settings.company.currency, locale)}
                    </span>
                  </div>
                </div>
              </div>
              
              {/* Footer */}
              <div className="mt-12 pt-8 border-t text-center text-sm text-muted-foreground">
                <p>Merci pour votre confiance!</p>
                <p className="mt-1">Généré par {settings.company.name}</p>
              </div>
            </div>
          )}
          
          <div className="flex gap-2 mt-4">
            <Button className="flex-1" onClick={() => selectedInvoice && handleDownload(selectedInvoice)}>
              <Download className="w-4 h-4 mr-2" />
              Télécharger PDF
            </Button>
            <Button variant="outline" className="flex-1">
              <Printer className="w-4 h-4 mr-2" />
              Imprimer
            </Button>
            <Button variant="outline" className="flex-1">
              <Mail className="w-4 h-4 mr-2" />
              Envoyer
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
