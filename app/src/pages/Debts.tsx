import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Search, 
  Plus, 
  Wallet, 
  User,
  Calendar,
  AlertTriangle,
  Check,
  Clock,
  DollarSign
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useDebtsStore, useCustomersStore, useSettingsStore } from '@/store';
import { formatCurrency, formatDate } from '@/lib/utils';
import { toast } from 'sonner';
import type { Debt } from '@/types';

// Mock debts data
const mockDebts: Debt[] = [
  {
    id: '1',
    customerId: '1',
    customer: { id: '1', name: 'Client A', phone: '', totalPurchases: 0, balance: 0, createdAt: new Date() },
    amount: 500,
    paid: 200,
    remaining: 300,
    dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
    status: 'partial',
    createdAt: new Date(),
  },
  {
    id: '2',
    customerId: '2',
    customer: { id: '2', name: 'Client B', phone: '', totalPurchases: 0, balance: 0, createdAt: new Date() },
    amount: 1000,
    paid: 0,
    remaining: 1000,
    dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 14),
    status: 'pending',
    createdAt: new Date(),
  },
  {
    id: '3',
    customerId: '3',
    customer: { id: '3', name: 'Client C', phone: '', totalPurchases: 0, balance: 0, createdAt: new Date() },
    amount: 750,
    paid: 750,
    remaining: 0,
    dueDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5),
    status: 'paid',
    createdAt: new Date(),
  },
];

export default function DebtsPage() {
  const { t, i18n } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [selectedDebt, setSelectedDebt] = useState<Debt | null>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [activeTab, setActiveTab] = useState('pending');
  
  const { customers } = useCustomersStore();
  const { settings } = useSettingsStore();
  
  const locale = i18n.language === 'fr' ? 'fr-FR' : i18n.language === 'ar' ? 'ar-SA' : 'en-US';
  
  // Filter debts
  const filteredDebts = mockDebts.filter(debt => {
    const matchesSearch = debt.customer?.name?.toLowerCase().includes(searchQuery.toLowerCase());
    if (activeTab === 'pending') return matchesSearch && debt.status === 'pending';
    if (activeTab === 'partial') return matchesSearch && debt.status === 'partial';
    if (activeTab === 'paid') return matchesSearch && debt.status === 'paid';
    if (activeTab === 'overdue') {
      return matchesSearch && debt.dueDate && new Date(debt.dueDate) < new Date() && debt.status !== 'paid';
    }
    return matchesSearch;
  });
  
  // Get status badge
  const getStatusBadge = (debt: Debt) => {
    if (debt.status === 'paid') {
      return <Badge variant="success" className="bg-green-100 text-green-800">{t('debts.paid')}</Badge>;
    }
    if (debt.dueDate && new Date(debt.dueDate) < new Date()) {
      return <Badge variant="destructive">{t('debts.overdue')}</Badge>;
    }
    if (debt.status === 'partial') {
      return <Badge variant="warning">{t('debts.partial')}</Badge>;
    }
    return <Badge variant="secondary">{t('debts.pending')}</Badge>;
  };
  
  // Open payment dialog
  const openPaymentDialog = (debt: Debt) => {
    setSelectedDebt(debt);
    setPaymentAmount(debt.remaining.toString());
    setShowPaymentDialog(true);
  };
  
  // Handle payment
  const handlePayment = () => {
    if (!paymentAmount || parseFloat(paymentAmount) <= 0) {
      toast.error('Veuillez entrer un montant valide');
      return;
    }
    toast.success('Paiement enregistré avec succès');
    setShowPaymentDialog(false);
    setPaymentAmount('');
  };
  
  // Stats
  const totalDebt = mockDebts.filter(d => d.status !== 'paid').reduce((sum, d) => sum + d.remaining, 0);
  const overdueDebt = mockDebts.filter(d => d.dueDate && new Date(d.dueDate) < new Date() && d.status !== 'paid')
    .reduce((sum, d) => sum + d.remaining, 0);
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('debts.title')}</h1>
          <p className="text-muted-foreground">Gérez les dettes de vos clients</p>
        </div>
      </div>
      
      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total dettes</p>
                <p className="text-2xl font-bold">
                  {formatCurrency(totalDebt, settings.company.currency, locale)}
                </p>
              </div>
              <Wallet className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Dettes en retard</p>
                <p className="text-2xl font-bold text-red-600">
                  {formatCurrency(overdueDebt, settings.company.currency, locale)}
                </p>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Clients débiteurs</p>
                <p className="text-2xl font-bold">
                  {new Set(mockDebts.filter(d => d.status !== 'paid').map(d => d.customerId)).size}
                </p>
              </div>
              <User className="w-8 h-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Dettes payées</p>
                <p className="text-2xl font-bold text-green-600">
                  {mockDebts.filter(d => d.status === 'paid').length}
                </p>
              </div>
              <Check className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Debts List */}
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
                <TabsTrigger value="pending">{t('debts.pending')}</TabsTrigger>
                <TabsTrigger value="partial">{t('debts.partial')}</TabsTrigger>
                <TabsTrigger value="overdue">{t('debts.overdue')}</TabsTrigger>
                <TabsTrigger value="paid">{t('debts.paid')}</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[calc(100vh-28rem)]">
            <div className="space-y-3">
              {filteredDebts.map((debt) => (
                <div key={debt.id} className="flex items-center justify-between p-4 bg-muted rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                      <User className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{debt.customer?.name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        {getStatusBadge(debt)}
                        {debt.dueDate && (
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            Échéance: {formatDate(debt.dueDate, locale)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <p className="text-lg font-bold">
                      {formatCurrency(debt.remaining, settings.company.currency, locale)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Sur {formatCurrency(debt.amount, settings.company.currency, locale)}
                    </p>
                  </div>
                  
                  {debt.status !== 'paid' && (
                    <Button size="sm" onClick={() => openPaymentDialog(debt)}>
                      <DollarSign className="w-4 h-4 mr-1" />
                      Payer
                    </Button>
                  )}
                </div>
              ))}
              
              {filteredDebts.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  <Wallet className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Aucune dette trouvée</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
      
      {/* Payment Dialog */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ajouter un paiement</DialogTitle>
          </DialogHeader>
          
          {selectedDebt && (
            <div className="space-y-4 py-4">
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">Client</p>
                <p className="font-medium">{selectedDebt.customer?.name}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">Reste à payer</p>
                  <p className="text-xl font-bold text-primary">
                    {formatCurrency(selectedDebt.remaining, settings.company.currency, locale)}
                  </p>
                </div>
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">Montant total</p>
                  <p className="text-xl font-bold">
                    {formatCurrency(selectedDebt.amount, settings.company.currency, locale)}
                  </p>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Montant du paiement</Label>
                <Input
                  type="number"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  placeholder="0.00"
                />
              </div>
              
              <div className="space-y-2">
                <Label>Mode de paiement</Label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full h-10 px-3 rounded-md border border-input bg-background"
                >
                  <option value="cash">Espèces</option>
                  <option value="card">Carte bancaire</option>
                  <option value="transfer">Virement</option>
                </select>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPaymentDialog(false)}>
              {t('app.cancel')}
            </Button>
            <Button onClick={handlePayment}>
              <Check className="w-4 h-4 mr-2" />
              Enregistrer le paiement
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
