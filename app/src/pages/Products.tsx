import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  Upload, 
  Download, 
  Package,
  AlertTriangle,
  Barcode,
  Image as ImageIcon,
  MoreHorizontal,
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useProductsStore, useSuppliersStore, useSettingsStore } from '@/store';
import { formatCurrency, generateSKU, generateBarcode, exportToCSV } from '@/lib/utils';
import { toast } from 'sonner';
import type { Product } from '@/types';

export default function ProductsPage() {
  const { t, i18n } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [activeTab, setActiveTab] = useState('all');
  
  const { products, categories, addProduct, updateProduct, deleteProduct, addCategory } = useProductsStore();
  const { suppliers } = useSuppliersStore();
  const { settings } = useSettingsStore();
  
  const locale = i18n.language === 'fr' ? 'fr-FR' : i18n.language === 'ar' ? 'ar-SA' : 'en-US';
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    barcode: '',
    categoryId: '',
    purchasePrice: '',
    salePrice: '',
    quantity: '',
    minQuantity: '5',
    supplierId: '',
    image: '',
  });
  
  // Filter products
  const filteredProducts = products.filter(product => {
    const matchesSearch = 
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.barcode?.includes(searchQuery);
    
    if (activeTab === 'low') return matchesSearch && product.quantity <= product.minQuantity && product.quantity > 0;
    if (activeTab === 'out') return matchesSearch && product.quantity === 0;
    if (activeTab === 'all') return matchesSearch;
    return matchesSearch && product.categoryId === activeTab;
  });
  
  // Reset form
  const resetForm = () => {
    setFormData({
      name: '',
      sku: generateSKU('PRD', products.length + 1),
      barcode: generateBarcode(),
      categoryId: '',
      purchasePrice: '',
      salePrice: '',
      quantity: '',
      minQuantity: '5',
      supplierId: '',
      image: '',
    });
  };
  
  // Open add dialog
  const openAddDialog = () => {
    resetForm();
    setShowAddDialog(true);
  };
  
  // Open edit dialog
  const openEditDialog = (product: Product) => {
    setSelectedProduct(product);
    setFormData({
      name: product.name,
      sku: product.sku,
      barcode: product.barcode || '',
      categoryId: product.categoryId,
      purchasePrice: product.purchasePrice.toString(),
      salePrice: product.salePrice.toString(),
      quantity: product.quantity.toString(),
      minQuantity: product.minQuantity.toString(),
      supplierId: product.supplierId || '',
      image: product.image || '',
    });
    setShowEditDialog(true);
  };
  
  // Open delete dialog
  const openDeleteDialog = (product: Product) => {
    setSelectedProduct(product);
    setShowDeleteDialog(true);
  };
  
  // Handle save
  const handleSave = () => {
    if (!formData.name || !formData.sku || !formData.purchasePrice || !formData.salePrice) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }
    
    const productData = {
      name: formData.name,
      sku: formData.sku,
      barcode: formData.barcode,
      categoryId: formData.categoryId,
      purchasePrice: parseFloat(formData.purchasePrice),
      salePrice: parseFloat(formData.salePrice),
      quantity: parseInt(formData.quantity) || 0,
      minQuantity: parseInt(formData.minQuantity) || 5,
      supplierId: formData.supplierId || undefined,
      image: formData.image,
    };
    
    if (showEditDialog && selectedProduct) {
      updateProduct(selectedProduct.id, productData);
      toast.success(t('products.productUpdated'));
      setShowEditDialog(false);
    } else {
      addProduct(productData);
      toast.success(t('products.productCreated'));
      setShowAddDialog(false);
    }
  };
  
  // Handle delete
  const handleDelete = () => {
    if (selectedProduct) {
      deleteProduct(selectedProduct.id);
      toast.success(t('products.productDeleted'));
      setShowDeleteDialog(false);
    }
  };
  
  // Export to CSV
  const handleExport = () => {
    const data = filteredProducts.map(p => ({
      SKU: p.sku,
      Nom: p.name,
      Categorie: p.category?.name || '',
      'Prix achat': p.purchasePrice,
      'Prix vente': p.salePrice,
      Quantite: p.quantity,
      'Seuil alerte': p.minQuantity,
      Fournisseur: p.supplier?.name || '',
    }));
    exportToCSV(data, `produits-${new Date().toISOString().split('T')[0]}.csv`);
    toast.success('Export réussi');
  };
  
  // Get stock status
  const getStockStatus = (product: Product) => {
    if (product.quantity === 0) return { label: t('products.outOfStock'), variant: 'destructive' as const };
    if (product.quantity <= product.minQuantity) return { label: t('products.lowStock'), variant: 'warning' as const };
    return { label: t('products.inStock'), variant: 'success' as const };
  };
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('products.title')}</h1>
          <p className="text-muted-foreground">Gérez votre catalogue de produits</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExport}>
            <Download className="w-4 h-4 mr-2" />
            {t('products.exportExcel')}
          </Button>
          <Button variant="outline">
            <Upload className="w-4 h-4 mr-2" />
            {t('products.importExcel')}
          </Button>
          <Button onClick={openAddDialog}>
            <Plus className="w-4 h-4 mr-2" />
            {t('products.addProduct')}
          </Button>
        </div>
      </div>
      
      {/* Stats Cards */}
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
                <p className="text-2xl font-bold text-yellow-600">
                  {products.filter(p => p.quantity <= p.minQuantity && p.quantity > 0).length}
                </p>
              </div>
              <AlertTriangle className="w-8 h-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Rupture de stock</p>
                <p className="text-2xl font-bold text-red-600">
                  {products.filter(p => p.quantity === 0).length}
                </p>
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
              <Barcode className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Products Table */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder={t('app.search')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            
            {/* Filter Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList>
                <TabsTrigger value="all">Tous</TabsTrigger>
                <TabsTrigger value="low">Stock faible</TabsTrigger>
                <TabsTrigger value="out">Rupture</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardHeader>
        
        <CardContent>
          <ScrollArea className="h-[calc(100vh-24rem)]">
            <table className="w-full">
              <thead className="bg-muted sticky top-0">
                <tr>
                  <th className="text-left p-3 text-sm font-medium">{t('products.name')}</th>
                  <th className="text-left p-3 text-sm font-medium">{t('products.sku')}</th>
                  <th className="text-left p-3 text-sm font-medium">{t('products.category')}</th>
                  <th className="text-right p-3 text-sm font-medium">{t('products.purchasePrice')}</th>
                  <th className="text-right p-3 text-sm font-medium">{t('products.salePrice')}</th>
                  <th className="text-center p-3 text-sm font-medium">{t('products.quantity')}</th>
                  <th className="text-center p-3 text-sm font-medium">{t('app.status')}</th>
                  <th className="text-right p-3 text-sm font-medium">{t('app.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((product) => {
                  const status = getStockStatus(product);
                  return (
                    <tr key={product.id} className="border-b hover:bg-muted/50">
                      <td className="p-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center">
                            {product.image ? (
                              <img src={product.image} alt={product.name} className="w-full h-full object-cover rounded-lg" />
                            ) : (
                              <Package className="w-5 h-5 text-muted-foreground" />
                            )}
                          </div>
                          <span className="font-medium">{product.name}</span>
                        </div>
                      </td>
                      <td className="p-3 text-sm font-mono">{product.sku}</td>
                      <td className="p-3 text-sm">{product.category?.name || '-'}</td>
                      <td className="p-3 text-right text-sm">
                        {formatCurrency(product.purchasePrice, settings.company.currency, locale)}
                      </td>
                      <td className="p-3 text-right text-sm font-medium">
                        {formatCurrency(product.salePrice, settings.company.currency, locale)}
                      </td>
                      <td className="p-3 text-center text-sm">{product.quantity}</td>
                      <td className="p-3 text-center">
                        <Badge variant={status.variant === 'success' ? 'default' : status.variant}>
                          {status.label}
                        </Badge>
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditDialog(product)}
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-red-500"
                            onClick={() => openDeleteDialog(product)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            
            {filteredProducts.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Aucun produit trouvé</p>
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
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {showEditDialog ? t('products.editProduct') : t('products.addProduct')}
            </DialogTitle>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t('products.name')} *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Nom du produit"
                />
              </div>
              <div className="space-y-2">
                <Label>{t('products.sku')} *</Label>
                <Input
                  value={formData.sku}
                  onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                  placeholder="SKU"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t('products.barcode')}</Label>
                <Input
                  value={formData.barcode}
                  onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                  placeholder="Code-barres"
                />
              </div>
              <div className="space-y-2">
                <Label>{t('products.category')}</Label>
                <select
                  value={formData.categoryId}
                  onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                  className="w-full h-10 px-3 rounded-md border border-input bg-background"
                >
                  <option value="">Sélectionner une catégorie</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t('products.purchasePrice')} *</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.purchasePrice}
                  onChange={(e) => setFormData({ ...formData, purchasePrice: e.target.value })}
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-2">
                <Label>{t('products.salePrice')} *</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.salePrice}
                  onChange={(e) => setFormData({ ...formData, salePrice: e.target.value })}
                  placeholder="0.00"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t('products.quantity')}</Label>
                <Input
                  type="number"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                  placeholder="0"
                />
              </div>
              <div className="space-y-2">
                <Label>{t('products.minQuantity')}</Label>
                <Input
                  type="number"
                  value={formData.minQuantity}
                  onChange={(e) => setFormData({ ...formData, minQuantity: e.target.value })}
                  placeholder="5"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>{t('products.supplier')}</Label>
              <select
                value={formData.supplierId}
                onChange={(e) => setFormData({ ...formData, supplierId: e.target.value })}
                className="w-full h-10 px-3 rounded-md border border-input bg-background"
              >
                <option value="">Sélectionner un fournisseur</option>
                {suppliers.map((sup) => (
                  <option key={sup.id} value={sup.id}>{sup.name}</option>
                ))}
              </select>
            </div>
            
            <div className="space-y-2">
              <Label>{t('products.image')}</Label>
              <Input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onloadend = () => {
                      setFormData({ ...formData, image: reader.result as string });
                    };
                    reader.readAsDataURL(file);
                  }
                }}
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
            <DialogTitle>{t('products.deleteProduct')}</DialogTitle>
          </DialogHeader>
          <p className="py-4">{t('products.confirmDelete')}</p>
          <p className="font-medium">{selectedProduct?.name}</p>
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
    </div>
  );
}
