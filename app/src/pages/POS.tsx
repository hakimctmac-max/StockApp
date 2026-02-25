import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Search, 
  Scan, 
  ShoppingCart, 
  Trash2, 
  Plus, 
  Minus, 
  CreditCard, 
  Banknote, 
  ArrowRightLeft,
  Check,
  X,
  Printer,
  User,
  Calculator,
  Package,
  Mail
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useProductsStore, useSalesStore, useCustomersStore, useSettingsStore, useAuthStore } from '@/store';
import { formatCurrency } from '@/lib/utils';
import { generateInvoicePDF, downloadPDF } from '@/lib/pdf-generator';
import { toast } from 'sonner';
import type { Product, Customer } from '@/types';

export default function POSPage() {
  const { t, i18n } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'transfer' | 'mixed'>('cash');
  const [paidAmount, setPaidAmount] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showCustomerDialog, setShowCustomerDialog] = useState(false);
  const [showInvoiceDialog, setShowInvoiceDialog] = useState(false);
  const [lastSale, setLastSale] = useState<any>(null);
  
  const { products, categories } = useProductsStore();
  const { cart, addToCart, removeFromCart, updateCartItem, clearCart, getCartTotal, addSale } = useSalesStore();
  const { customers } = useCustomersStore();
  const { settings } = useSettingsStore();
  const { currentUser } = useAuthStore();
  const searchInputRef = useRef<HTMLInputElement>(null);
  
  const locale = i18n.language === 'fr' ? 'fr-FR' : i18n.language === 'ar' ? 'ar-SA' : 'en-US';
  
  // Focus search on mount
  useEffect(() => {
    searchInputRef.current?.focus();
  }, []);
  
  // Handle barcode scan simulation
  const handleBarcodeScan = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && searchQuery) {
      const product = products.find(p => p.barcode === searchQuery || p.sku === searchQuery);
      if (product) {
        addProductToCart(product);
        setSearchQuery('');
      }
    }
  };
  
  // Filter products
  const filteredProducts = products.filter(product => {
    const matchesSearch = 
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.barcode?.includes(searchQuery);
    const matchesCategory = selectedCategory === 'all' || product.categoryId === selectedCategory;
    return matchesSearch && matchesCategory && product.quantity > 0;
  });
  
  // Add product to cart
  const addProductToCart = (product: Product) => {
    if (product.quantity <= 0) {
      toast.error(t('pos.insufficientStock', { product: product.name }));
      return;
    }
    
    const existingItem = cart.find(item => item.productId === product.id);
    if (existingItem && existingItem.quantity >= product.quantity) {
      toast.error(t('pos.insufficientStock', { product: product.name }));
      return;
    }
    
    addToCart({
      id: Math.random().toString(36).substr(2, 9),
      productId: product.id,
      product,
      quantity: 1,
      unitPrice: product.salePrice,
      total: product.salePrice,
    });
    
    toast.success(`${product.name} ajouté au panier`);
  };
  
  // Update quantity
  const updateQuantity = (productId: string, delta: number) => {
    const item = cart.find(i => i.productId === productId);
    if (!item) return;
    
    const product = products.find(p => p.id === productId);
    if (!product) return;
    
    const newQuantity = item.quantity + delta;
    if (newQuantity <= 0) {
      removeFromCart(productId);
    } else if (newQuantity > product.quantity) {
      toast.error(t('pos.insufficientStock', { product: product.name }));
    } else {
      updateCartItem(productId, newQuantity);
    }
  };
  
  // Calculate totals
  const subtotal = getCartTotal();
  const vatAmount = (subtotal * settings.company.vatRate) / 100;
  const total = subtotal + vatAmount;
  const change = Math.max(0, parseFloat(paidAmount || '0') - total);
  
  // Complete sale
  const completeSale = () => {
    if (cart.length === 0) {
      toast.error('Le panier est vide');
      return;
    }
    
    const paid = parseFloat(paidAmount || '0');
    if (paid < total && paymentMethod !== 'mixed') {
      toast.error('Le montant payé est insuffisant');
      return;
    }
    
    const sale = addSale({
      customerId: selectedCustomer?.id,
      items: cart,
      subtotal,
      vatAmount,
      total,
      paymentMethod,
      paidAmount: paid,
      change,
      sellerId: currentUser?.id || '',
      status: 'completed',
    });
    
    setLastSale(sale);
    setShowPaymentDialog(false);
    setShowInvoiceDialog(true);
    clearCart();
    setPaidAmount('');
    setSelectedCustomer(null);
    
    toast.success(t('pos.saleCompleted'));
  };
  
  // Download invoice
  const handleDownloadInvoice = () => {
    if (lastSale) {
      const doc = generateInvoicePDF({
        sale: lastSale,
        company: settings.company,
        appName: settings.company.name,
      });
      downloadPDF(doc, `facture-${lastSale.invoiceNumber}.pdf`);
    }
  };
  
  // Quick amount buttons
  const quickAmounts = [5, 10, 20, 50, 100, 200];
  
  return (
    <div className="h-[calc(100vh-8rem)] flex gap-4">
      {/* Products Section */}
      <div className="flex-1 flex flex-col gap-4">
        {/* Search and Filter */}
        <Card>
          <CardContent className="p-4">
            <div className="flex gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  ref={searchInputRef}
                  placeholder={t('pos.searchProduct')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={handleBarcodeScan}
                  className="pl-10"
                />
              </div>
              <Button variant="outline" size="icon">
                <Scan className="w-4 h-4" />
              </Button>
            </div>
            
            {/* Category Tabs */}
            <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="mt-4">
              <TabsList className="w-full flex-wrap h-auto">
                <TabsTrigger value="all">Tous</TabsTrigger>
                {categories.map(cat => (
                  <TabsTrigger key={cat.id} value={cat.id}>{cat.name}</TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </CardContent>
        </Card>
        
        {/* Products Grid */}
        <Card className="flex-1">
          <CardContent className="p-4">
            <ScrollArea className="h-[calc(100vh-20rem)]">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                {filteredProducts.map((product) => (
                  <button
                    key={product.id}
                    onClick={() => addProductToCart(product)}
                    className="p-3 border rounded-lg hover:border-primary hover:shadow-md transition-all text-left bg-card"
                  >
                    <div className="aspect-square bg-muted rounded-md mb-2 flex items-center justify-center">
                      {product.image ? (
                        <img src={product.image} alt={product.name} className="w-full h-full object-cover rounded-md" />
                      ) : (
                        <Package className="w-8 h-8 text-muted-foreground" />
                      )}
                    </div>
                    <p className="font-medium text-sm truncate">{product.name}</p>
                    <p className="text-primary font-bold text-sm">
                      {formatCurrency(product.salePrice, settings.company.currency, locale)}
                    </p>
                    <p className="text-xs text-muted-foreground">Stock: {product.quantity}</p>
                  </button>
                ))}
              </div>
              
              {filteredProducts.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Aucun produit trouvé</p>
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
      
      {/* Cart Section */}
      <Card className="w-96 flex flex-col">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="w-5 h-5" />
              {t('pos.cart')}
            </CardTitle>
            <Badge variant="secondary">{cart.length} articles</Badge>
          </div>
          
          {/* Customer Selection */}
          <Button
            variant="outline"
            className="w-full mt-2 justify-start"
            onClick={() => setShowCustomerDialog(true)}
          >
            <User className="w-4 h-4 mr-2" />
            {selectedCustomer ? selectedCustomer.name : 'Sélectionner un client'}
          </Button>
        </CardHeader>
        
        <CardContent className="flex-1 overflow-hidden">
          <ScrollArea className="h-[calc(100vh-28rem)]">
            {cart.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <ShoppingCart className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>{t('pos.emptyCart')}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {cart.map((item) => (
                  <div key={item.id} className="flex items-center gap-3 p-2 bg-muted rounded-lg">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{item.product?.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatCurrency(item.unitPrice, settings.company.currency, locale)}
                      </p>
                    </div>
                    
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => updateQuantity(item.productId, -1)}
                      >
                        <Minus className="w-3 h-3" />
                      </Button>
                      <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => updateQuantity(item.productId, 1)}
                      >
                        <Plus className="w-3 h-3" />
                      </Button>
                    </div>
                    
                    <div className="text-right min-w-[80px]">
                      <p className="font-medium text-sm">
                        {formatCurrency(item.total, settings.company.currency, locale)}
                      </p>
                    </div>
                    
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-red-500"
                      onClick={() => removeFromCart(item.productId)}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
        
        <CardFooter className="flex-col gap-3 border-t pt-4">
          {/* Totals */}
          <div className="w-full space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{t('pos.subtotal')}</span>
              <span>{formatCurrency(subtotal, settings.company.currency, locale)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{t('pos.vat', { rate: settings.company.vatRate })}</span>
              <span>{formatCurrency(vatAmount, settings.company.currency, locale)}</span>
            </div>
            <Separator />
            <div className="flex justify-between text-lg font-bold">
              <span>{t('pos.total')}</span>
              <span className="text-primary">{formatCurrency(total, settings.company.currency, locale)}</span>
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="flex gap-2 w-full">
            <Button
              variant="outline"
              className="flex-1"
              onClick={clearCart}
              disabled={cart.length === 0}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              {t('pos.clearCart')}
            </Button>
            <Button
              className="flex-[2]"
              size="lg"
              onClick={() => setShowPaymentDialog(true)}
              disabled={cart.length === 0}
            >
              <Check className="w-4 h-4 mr-2" />
              {t('pos.completeSale')}
            </Button>
          </div>
        </CardFooter>
      </Card>
      
      {/* Payment Dialog */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t('pos.payment')}</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Payment Method */}
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant={paymentMethod === 'cash' ? 'default' : 'outline'}
                onClick={() => setPaymentMethod('cash')}
                className="flex-col h-20"
              >
                <Banknote className="w-6 h-6 mb-1" />
                {t('pos.cash')}
              </Button>
              <Button
                variant={paymentMethod === 'card' ? 'default' : 'outline'}
                onClick={() => setPaymentMethod('card')}
                className="flex-col h-20"
              >
                <CreditCard className="w-6 h-6 mb-1" />
                {t('pos.card')}
              </Button>
              <Button
                variant={paymentMethod === 'transfer' ? 'default' : 'outline'}
                onClick={() => setPaymentMethod('transfer')}
                className="flex-col h-20"
              >
                <ArrowRightLeft className="w-6 h-6 mb-1" />
                {t('pos.transfer')}
              </Button>
              <Button
                variant={paymentMethod === 'mixed' ? 'default' : 'outline'}
                onClick={() => setPaymentMethod('mixed')}
                className="flex-col h-20"
              >
                <Calculator className="w-6 h-6 mb-1" />
                {t('pos.mixed')}
              </Button>
            </div>
            
            {/* Total Display */}
            <div className="text-center p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">{t('pos.total')}</p>
              <p className="text-3xl font-bold text-primary">
                {formatCurrency(total, settings.company.currency, locale)}
              </p>
            </div>
            
            {/* Paid Amount */}
            <div className="space-y-2">
              <label className="text-sm font-medium">{t('pos.paidAmount')}</label>
              <Input
                type="number"
                value={paidAmount}
                onChange={(e) => setPaidAmount(e.target.value)}
                placeholder="0.00"
                className="text-2xl text-center"
              />
              <div className="flex gap-2 flex-wrap">
                {quickAmounts.map((amount) => (
                  <Button
                    key={amount}
                    variant="outline"
                    size="sm"
                    onClick={() => setPaidAmount(amount.toString())}
                  >
                    {amount}
                  </Button>
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPaidAmount(total.toFixed(2))}
                >
                  Exact
                </Button>
              </div>
            </div>
            
            {/* Change */}
            {parseFloat(paidAmount || '0') > 0 && (
              <div className="flex justify-between items-center p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
                <span className="font-medium">{t('pos.change')}</span>
                <span className="text-xl font-bold text-green-600">
                  {formatCurrency(change, settings.company.currency, locale)}
                </span>
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPaymentDialog(false)}>
              <X className="w-4 h-4 mr-2" />
              {t('app.cancel')}
            </Button>
            <Button onClick={completeSale}>
              <Check className="w-4 h-4 mr-2" />
              {t('pos.completeSale')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Customer Selection Dialog */}
      <Dialog open={showCustomerDialog} onOpenChange={setShowCustomerDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Sélectionner un client</DialogTitle>
          </DialogHeader>
          <ScrollArea className="h-64">
            <div className="space-y-2">
              <Button
                variant={selectedCustomer === null ? 'default' : 'outline'}
                className="w-full justify-start"
                onClick={() => {
                  setSelectedCustomer(null);
                  setShowCustomerDialog(false);
                }}
              >
                Client comptant
              </Button>
              {customers.map((customer) => (
                <Button
                  key={customer.id}
                  variant={selectedCustomer?.id === customer.id ? 'default' : 'outline'}
                  className="w-full justify-start"
                  onClick={() => {
                    setSelectedCustomer(customer);
                    setShowCustomerDialog(false);
                  }}
                >
                  <div className="text-left">
                    <p className="font-medium">{customer.name}</p>
                    <p className="text-xs text-muted-foreground">{customer.phone}</p>
                  </div>
                </Button>
              ))}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
      
      {/* Invoice Dialog */}
      <Dialog open={showInvoiceDialog} onOpenChange={setShowInvoiceDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('pos.invoiceGenerated')}</DialogTitle>
          </DialogHeader>
          
          <div className="text-center py-6">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-green-600" />
            </div>
            <p className="text-lg font-medium">Vente terminée avec succès!</p>
            <p className="text-muted-foreground">
              Facture N°: {lastSale?.invoiceNumber}
            </p>
          </div>
          
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={handleDownloadInvoice}>
              <Printer className="w-4 h-4 mr-2" />
              {t('pos.printInvoice')}
            </Button>
            <Button variant="outline" className="flex-1">
              <Mail className="w-4 h-4 mr-2" />
              {t('pos.sendByEmail')}
            </Button>
          </div>
          
          <DialogFooter>
            <Button onClick={() => setShowInvoiceDialog(false)} className="w-full">
              Nouvelle vente
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
