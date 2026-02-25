import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Package, 
  ArrowUp, 
  ArrowDown, 
  History, 
  Search,
  Plus,
  Minus,
  AlertTriangle,
  Filter
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useProductsStore, useStockMovementsStore, useSettingsStore, useAuthStore } from '@/store';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import { toast } from 'sonner';

export default function StockPage() {
  const { t, i18n } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [showAdjustmentDialog, setShowAdjustmentDialog] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<string>('');
  const [adjustmentType, setAdjustmentType] = useState<'in' | 'out'>('in');
  const [adjustmentQuantity, setAdjustmentQuantity] = useState('');
  const [adjustmentReason, setAdjustmentReason] = useState('');
  
  const { products, updateProduct } = useProductsStore();
  const { movements, addMovement } = useStockMovementsStore();
  const { settings } = useSettingsStore();
  const { currentUser } = useAuthStore();
  
  const locale = i18n.language === 'fr' ? 'fr-FR' : i18n.language === 'ar' ? 'ar-SA' : 'en-US';
  
  // Filter products
  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.sku.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  // Low stock products
  const lowStockProducts = products.filter(p => p.quantity <= p.minQuantity && p.quantity > 0);
  const outOfStockProducts = products.filter(p => p.quantity === 0);
  
  // Handle stock adjustment
  const handleAdjustment = () => {
    if (!selectedProduct || !adjustmentQuantity || !adjustmentReason) {
      toast.error('Veuillez remplir tous les champs');
      return;
    }
    
    const product = products.find(p => p.id === selectedProduct);
    if (!product) return;
    
    const quantity = parseInt(adjustmentQuantity);
    const newQuantity = adjustmentType === 'in' 
      ? product.quantity + quantity 
      : product.quantity - quantity;
    
    if (newQuantity < 0) {
      toast.error('Quantité insuffisante');
      return;
    }
    
    updateProduct(product.id, { quantity: newQuantity });
    addMovement({
      productId: product.id,
      type: adjustmentType,
      quantity,
      reason: adjustmentReason,
      userId: currentUser?.id || '',
    });
    
    toast.success('Ajustement de stock effectué');
    setShowAdjustmentDialog(false);
    setSelectedProduct('');
    setAdjustmentQuantity('');
    setAdjustmentReason('');
  };
  
  // Get product movements
  const getProductMovements = (productId: string) => {
    return movements.filter(m => m.productId === productId).slice(0, 5);
  };
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('stock.title')}</h1>
          <p className="text-muted-foreground">Gérez vos mouvements de stock</p>
        </div>
        <Button onClick={() => setShowAdjustmentDialog(true)}>
          <Plus className="w-4 h-4 mr-2" />
          {t('stock.adjustment')}
        </Button>
      </div>
      
      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total produits</p>
                <p className="text-2xl font-bold">{products.length}</p>
              </div>
              <Package className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Stock faible</p>
                <p className="text-2xl font-bold text-yellow-600">{lowStockProducts.length}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Rupture</p>
                <p className="text-2xl font-bold text-red-600">{outOfStockProducts.length}</p>
              </div>
              <Package className="w-8 h-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Valeur du stock</p>
                <p className="text-2xl font-bold">
                  {formatCurrency(
                    products.reduce((sum, p) => sum + p.purchasePrice * p.quantity, 0),
                    settings.company.currency,
                    locale
                  )}
                </p>
              </div>
              <Package className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Tabs */}
      <Tabs defaultValue="inventory">
        <TabsList>
          <TabsTrigger value="inventory">{t('stock.currentStock')}</TabsTrigger>
          <TabsTrigger value="movements">{t('stock.history')}</TabsTrigger>
          <TabsTrigger value="alerts">{t('stock.lowStockAlert')}</TabsTrigger>
        </TabsList>
        
        <TabsContent value="inventory">
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
                <table className="w-full">
                  <thead className="bg-muted sticky top-0">
                    <tr>
                      <th className="text-left p-3 text-sm font-medium">Produit</th>
                      <th className="text-left p-3 text-sm font-medium">SKU</th>
                      <th className="text-center p-3 text-sm font-medium">Stock actuel</th>
                      <th className="text-center p-3 text-sm font-medium">Seuil min</th>
                      <th className="text-center p-3 text-sm font-medium">Statut</th>
                      <th className="text-right p-3 text-sm font-medium">Valeur</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProducts.map((product) => (
                      <tr key={product.id} className="border-b hover:bg-muted/50">
                        <td className="p-3 font-medium">{product.name}</td>
                        <td className="p-3 text-sm font-mono">{product.sku}</td>
                        <td className="p-3 text-center">
                          <span className={`font-bold ${
                            product.quantity === 0 ? 'text-red-600' : 
                            product.quantity <= product.minQuantity ? 'text-yellow-600' : 'text-green-600'
                          }`}>
                            {product.quantity}
                          </span>
                        </td>
                        <td className="p-3 text-center text-muted-foreground">{product.minQuantity}</td>
                        <td className="p-3 text-center">
                          {product.quantity === 0 ? (
                            <Badge variant="destructive">Rupture</Badge>
                          ) : product.quantity <= product.minQuantity ? (
                            <Badge variant="warning">Faible</Badge>
                          ) : (
                            <Badge variant="success">OK</Badge>
                          )}
                        </td>
                        <td className="p-3 text-right">
                          {formatCurrency(product.purchasePrice * product.quantity, settings.company.currency, locale)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="movements">
          <Card>
            <CardContent className="p-6">
              <ScrollArea className="h-[calc(100vh-24rem)]">
                {movements.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <History className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>{t('stock.noMovements')}</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {movements.map((movement) => {
                      const product = products.find(p => p.id === movement.productId);
                      return (
                        <div key={movement.id} className="flex items-center gap-4 p-4 bg-muted rounded-lg">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            movement.type === 'in' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                          }`}>
                            {movement.type === 'in' ? <ArrowUp className="w-5 h-5" /> : <ArrowDown className="w-5 h-5" />}
                          </div>
                          <div className="flex-1">
                            <p className="font-medium">{product?.name || 'Produit inconnu'}</p>
                            <p className="text-sm text-muted-foreground">{movement.reason}</p>
                          </div>
                          <div className="text-right">
                            <p className={`font-bold ${movement.type === 'in' ? 'text-green-600' : 'text-red-600'}`}>
                              {movement.type === 'in' ? '+' : '-'}{movement.quantity}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {formatDateTime(movement.createdAt, locale)}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="alerts">
          <Card>
            <CardContent className="p-6">
              <div className="space-y-4">
                {outOfStockProducts.map((product) => (
                  <div key={product.id} className="flex items-center gap-4 p-4 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-200">
                    <AlertTriangle className="w-8 h-8 text-red-500" />
                    <div className="flex-1">
                      <p className="font-medium text-red-900">{product.name}</p>
                      <p className="text-sm text-red-600">Rupture de stock - Réapprovisionnement nécessaire</p>
                    </div>
                    <Badge variant="destructive">Rupture</Badge>
                  </div>
                ))}
                {lowStockProducts.map((product) => (
                  <div key={product.id} className="flex items-center gap-4 p-4 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg border border-yellow-200">
                    <AlertTriangle className="w-8 h-8 text-yellow-500" />
                    <div className="flex-1">
                      <p className="font-medium text-yellow-900">{product.name}</p>
                      <p className="text-sm text-yellow-600">
                        Stock faible: {product.quantity} / {product.minQuantity}
                      </p>
                    </div>
                    <Badge variant="warning">Stock faible</Badge>
                  </div>
                ))}
                {lowStockProducts.length === 0 && outOfStockProducts.length === 0 && (
                  <div className="text-center py-12 text-muted-foreground">
                    <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Aucune alerte de stock</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Adjustment Dialog */}
      <Dialog open={showAdjustmentDialog} onOpenChange={setShowAdjustmentDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('stock.adjustment')}</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Produit</Label>
              <select
                value={selectedProduct}
                onChange={(e) => setSelectedProduct(e.target.value)}
                className="w-full h-10 px-3 rounded-md border border-input bg-background"
              >
                <option value="">Sélectionner un produit</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>{p.name} (Stock: {p.quantity})</option>
                ))}
              </select>
            </div>
            
            <div className="space-y-2">
              <Label>Type de mouvement</Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={adjustmentType === 'in' ? 'default' : 'outline'}
                  className="flex-1"
                  onClick={() => setAdjustmentType('in')}
                >
                  <ArrowUp className="w-4 h-4 mr-2" />
                  Entrée
                </Button>
                <Button
                  type="button"
                  variant={adjustmentType === 'out' ? 'default' : 'outline'}
                  className="flex-1"
                  onClick={() => setAdjustmentType('out')}
                >
                  <ArrowDown className="w-4 h-4 mr-2" />
                  Sortie
                </Button>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Quantité</Label>
              <Input
                type="number"
                value={adjustmentQuantity}
                onChange={(e) => setAdjustmentQuantity(e.target.value)}
                placeholder="0"
              />
            </div>
            
            <div className="space-y-2">
              <Label>Motif</Label>
              <Input
                value={adjustmentReason}
                onChange={(e) => setAdjustmentReason(e.target.value)}
                placeholder="Raison de l'ajustement"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAdjustmentDialog(false)}>
              {t('app.cancel')}
            </Button>
            <Button onClick={handleAdjustment}>
              {t('app.save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
