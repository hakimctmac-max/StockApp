import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  Users, 
  Phone, 
  Mail, 
  MapPin,
  ShoppingCart,
  Wallet
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useCustomersStore, useSettingsStore, useDebtsStore } from '@/store';
import { formatCurrency } from '@/lib/utils';
import { toast } from 'sonner';
import type { Customer } from '@/types';

export default function CustomersPage() {
  const { t, i18n } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  
  const { customers, addCustomer, updateCustomer, deleteCustomer } = useCustomersStore();
  const { debts } = useDebtsStore();
  const { settings } = useSettingsStore();
  
  const locale = i18n.language === 'fr' ? 'fr-FR' : i18n.language === 'ar' ? 'ar-SA' : 'en-US';
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
  });
  
  // Filter customers
  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    customer.phone.includes(searchQuery) ||
    (customer.email && customer.email.toLowerCase().includes(searchQuery.toLowerCase()))
  );
  
  // Get customer debts
  const getCustomerDebts = (customerId: string) => {
    return debts.filter(d => d.customerId === customerId && d.status !== 'paid');
  };
  
  // Reset form
  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      address: '',
      city: '',
    });
  };
  
  // Open dialogs
  const openAddDialog = () => {
    resetForm();
    setShowAddDialog(true);
  };
  
  const openEditDialog = (customer: Customer) => {
    setSelectedCustomer(customer);
    setFormData({
      name: customer.name,
      email: customer.email || '',
      phone: customer.phone,
      address: customer.address || '',
      city: customer.city || '',
    });
    setShowEditDialog(true);
  };
  
  const openDeleteDialog = (customer: Customer) => {
    setSelectedCustomer(customer);
    setShowDeleteDialog(true);
  };
  
  const openDetailsDialog = (customer: Customer) => {
    setSelectedCustomer(customer);
    setShowDetailsDialog(true);
  };
  
  // Handle save
  const handleSave = () => {
    if (!formData.name || !formData.phone) {
      toast.error('Veuillez remplir les champs obligatoires');
      return;
    }
    
    const customerData = {
      ...formData,
      totalPurchases: 0,
      balance: 0,
    };
    
    if (showEditDialog && selectedCustomer) {
      updateCustomer(selectedCustomer.id, customerData);
      toast.success(t('customers.customerUpdated'));
      setShowEditDialog(false);
    } else {
      addCustomer(customerData);
      toast.success(t('customers.customerCreated'));
      setShowAddDialog(false);
    }
  };
  
  // Handle delete
  const handleDelete = () => {
    if (selectedCustomer) {
      deleteCustomer(selectedCustomer.id);
      toast.success(t('customers.customerDeleted'));
      setShowDeleteDialog(false);
    }
  };
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('customers.title')}</h1>
          <p className="text-muted-foreground">Gérez vos clients</p>
        </div>
        <Button onClick={openAddDialog}>
          <Plus className="w-4 h-4 mr-2" />
          {t('customers.addCustomer')}
        </Button>
      </div>
      
      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total clients</p>
                <p className="text-2xl font-bold">{customers.length}</p>
              </div>
              <Users className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total achats clients</p>
                <p className="text-2xl font-bold">
                  {formatCurrency(
                    customers.reduce((sum, c) => sum + c.totalPurchases, 0),
                    settings.company.currency,
                    locale
                  )}
                </p>
              </div>
              <ShoppingCart className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Dettes clients</p>
                <p className="text-2xl font-bold text-red-600">
                  {formatCurrency(
                    debts.filter(d => d.status !== 'paid').reduce((sum, d) => sum + d.remaining, 0),
                    settings.company.currency,
                    locale
                  )}
                </p>
              </div>
              <Wallet className="w-8 h-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Clients avec dettes</p>
                <p className="text-2xl font-bold">
                  {new Set(debts.filter(d => d.status !== 'paid').map(d => d.customerId)).size}
                </p>
              </div>
              <Users className="w-8 h-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Customers List */}
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
          <ScrollArea className="h-[calc(100vh-28rem)]">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredCustomers.map((customer) => {
                const customerDebts = getCustomerDebts(customer.id);
                const hasDebts = customerDebts.length > 0;
                
                return (
                  <Card key={customer.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => openDetailsDialog(customer)}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                            <Users className="w-6 h-6 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium">{customer.name}</p>
                            {hasDebts && (
                              <Badge variant="warning" className="text-xs">
                                Dette: {formatCurrency(customerDebts.reduce((s, d) => s + d.remaining, 0), settings.company.currency, locale)}
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" size="icon" onClick={() => openEditDialog(customer)}>
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="text-red-500" onClick={() => openDeleteDialog(customer)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      
                      <div className="mt-4 space-y-2">
                        <div className="flex items-center gap-2 text-sm">
                          <Phone className="w-4 h-4 text-muted-foreground" />
                          <span>{customer.phone}</span>
                        </div>
                        {customer.email && (
                          <div className="flex items-center gap-2 text-sm">
                            <Mail className="w-4 h-4 text-muted-foreground" />
                            <span className="truncate">{customer.email}</span>
                          </div>
                        )}
                        {customer.city && (
                          <div className="flex items-center gap-2 text-sm">
                            <MapPin className="w-4 h-4 text-muted-foreground" />
                            <span>{customer.city}</span>
                          </div>
                        )}
                      </div>
                      
                      <div className="mt-4 pt-4 border-t flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Total achats</span>
                        <span className="font-bold">
                          {formatCurrency(customer.totalPurchases, settings.company.currency, locale)}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
            
            {filteredCustomers.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Aucun client trouvé</p>
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
      
      {/* Add/Edit Dialog */}
      <Dialog open={showAddDialog || showEditDialog} onOpenChange={(open) => {
        if (!open) {
          setShowAddDialog(false);
          setShowEditDialog(false);
        }
      }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {showEditDialog ? t('customers.editCustomer') : t('customers.addCustomer')}
            </DialogTitle>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>{t('customers.name')} *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Nom du client"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t('customers.phone')} *</Label>
                <Input
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+33 1 23 45 67 89"
                />
              </div>
              <div className="space-y-2">
                <Label>{t('customers.email')}</Label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="email@exemple.com"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>{t('customers.address')}</Label>
              <Input
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Adresse"
              />
            </div>
            
            <div className="space-y-2">
              <Label>{t('customers.city')}</Label>
              <Input
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                placeholder="Ville"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowAddDialog(false);
              setShowEditDialog(false);
            }}>
              {t('app.cancel')}
            </Button>
            <Button onClick={handleSave}>
              {t('app.save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Delete Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('customers.deleteCustomer')}</DialogTitle>
          </DialogHeader>
          <p className="py-4">{t('customers.confirmDelete')}</p>
          <p className="font-medium">{selectedCustomer?.name}</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              {t('app.cancel')}
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              {t('app.delete')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{t('customers.customerDetails')}</DialogTitle>
          </DialogHeader>
          
          {selectedCustomer && (
            <div className="space-y-4 py-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                  <Users className="w-8 h-8 text-primary" />
                </div>
                <div>
                  <p className="text-xl font-bold">{selectedCustomer.name}</p>
                  <p className="text-muted-foreground">Client depuis {new Date(selectedCustomer.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                  <Phone className="w-5 h-5 text-muted-foreground" />
                  <span>{selectedCustomer.phone}</span>
                </div>
                {selectedCustomer.email && (
                  <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                    <Mail className="w-5 h-5 text-muted-foreground" />
                    <span>{selectedCustomer.email}</span>
                  </div>
                )}
                {(selectedCustomer.address || selectedCustomer.city) && (
                  <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                    <MapPin className="w-5 h-5 text-muted-foreground" />
                    <span>{[selectedCustomer.address, selectedCustomer.city].filter(Boolean).join(', ')}</span>
                  </div>
                )}
              </div>
              
              <div className="pt-4 border-t space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Total des achats</span>
                  <span className="text-xl font-bold text-primary">
                    {formatCurrency(selectedCustomer.totalPurchases, settings.company.currency, locale)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Solde</span>
                  <span className={`font-bold ${selectedCustomer.balance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {formatCurrency(selectedCustomer.balance, settings.company.currency, locale)}
                  </span>
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button className="flex-1" onClick={() => {
                  setShowDetailsDialog(false);
                  openEditDialog(selectedCustomer);
                }}>
                  <Edit2 className="w-4 h-4 mr-2" />
                  Modifier
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
