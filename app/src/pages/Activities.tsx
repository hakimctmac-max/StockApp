import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Search, 
  Activity, 
  LogIn, 
  LogOut, 
  Plus, 
  Edit, 
  Trash2,
  ShoppingCart,
  Package,
  Settings,
  User
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useActivityLogsStore } from '@/store';
import { formatDateTime } from '@/lib/utils';

// Mock activity data
const mockActivities = [
  {
    id: '1',
    userId: '1',
    user: { name: 'Admin User' },
    action: 'login',
    entityType: 'auth',
    details: {},
    ipAddress: '192.168.1.1',
    createdAt: new Date(Date.now() - 1000 * 60 * 5),
  },
  {
    id: '2',
    userId: '2',
    user: { name: 'Seller User' },
    action: 'sale',
    entityType: 'sale',
    details: { invoiceNumber: 'INV-202401-0001', total: 150.00 },
    ipAddress: '192.168.1.2',
    createdAt: new Date(Date.now() - 1000 * 60 * 30),
  },
  {
    id: '3',
    userId: '1',
    user: { name: 'Admin User' },
    action: 'create',
    entityType: 'product',
    details: { productName: 'Nouveau Produit' },
    ipAddress: '192.168.1.1',
    createdAt: new Date(Date.now() - 1000 * 60 * 60),
  },
  {
    id: '4',
    userId: '3',
    user: { name: 'Manager User' },
    action: 'update',
    entityType: 'stock',
    details: { productName: 'Produit A', quantity: 10 },
    ipAddress: '192.168.1.3',
    createdAt: new Date(Date.now() - 1000 * 60 * 120),
  },
  {
    id: '5',
    userId: '2',
    user: { name: 'Seller User' },
    action: 'logout',
    entityType: 'auth',
    details: {},
    ipAddress: '192.168.1.2',
    createdAt: new Date(Date.now() - 1000 * 60 * 180),
  },
];

export default function ActivitiesPage() {
  const { t, i18n } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  
  const locale = i18n.language === 'fr' ? 'fr-FR' : i18n.language === 'ar' ? 'ar-SA' : 'en-US';
  
  // Filter activities
  const filteredActivities = mockActivities.filter(activity =>
    activity.user?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    activity.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
    activity.entityType.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  // Get action icon
  const getActionIcon = (action: string) => {
    switch (action) {
      case 'login':
        return <LogIn className="w-5 h-5 text-green-500" />;
      case 'logout':
        return <LogOut className="w-5 h-5 text-orange-500" />;
      case 'create':
        return <Plus className="w-5 h-5 text-blue-500" />;
      case 'update':
        return <Edit className="w-5 h-5 text-yellow-500" />;
      case 'delete':
        return <Trash2 className="w-5 h-5 text-red-500" />;
      case 'sale':
        return <ShoppingCart className="w-5 h-5 text-purple-500" />;
      default:
        return <Activity className="w-5 h-5 text-gray-500" />;
    }
  };
  
  // Get entity icon
  const getEntityIcon = (entityType: string) => {
    switch (entityType) {
      case 'product':
        return <Package className="w-4 h-4" />;
      case 'sale':
        return <ShoppingCart className="w-4 h-4" />;
      case 'stock':
        return <Package className="w-4 h-4" />;
      case 'settings':
        return <Settings className="w-4 h-4" />;
      case 'auth':
        return <User className="w-4 h-4" />;
      default:
        return <Activity className="w-4 h-4" />;
    }
  };
  
  // Get action label
  const getActionLabel = (action: string) => {
    const labels: Record<string, string> = {
      login: 'Connexion',
      logout: 'Déconnexion',
      create: 'Création',
      update: 'Modification',
      delete: 'Suppression',
      sale: 'Vente',
    };
    return labels[action] || action;
  };
  
  // Get entity label
  const getEntityLabel = (entityType: string) => {
    const labels: Record<string, string> = {
      product: 'Produit',
      sale: 'Vente',
      stock: 'Stock',
      settings: 'Paramètres',
      auth: 'Authentification',
    };
    return labels[entityType] || entityType;
  };
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('activities.title')}</h1>
          <p className="text-muted-foreground">Journal d'activité des utilisateurs</p>
        </div>
      </div>
      
      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Activités aujourd'hui</p>
                <p className="text-2xl font-bold">{mockActivities.length}</p>
              </div>
              <Activity className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Connexions</p>
                <p className="text-2xl font-bold text-green-600">
                  {mockActivities.filter(a => a.action === 'login').length}
                </p>
              </div>
              <LogIn className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Ventes</p>
                <p className="text-2xl font-bold text-purple-600">
                  {mockActivities.filter(a => a.action === 'sale').length}
                </p>
              </div>
              <ShoppingCart className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Modifications</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {mockActivities.filter(a => a.action === 'update').length}
                </p>
              </div>
              <Edit className="w-8 h-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Activities List */}
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
            <div className="space-y-3">
              {filteredActivities.map((activity) => (
                <div key={activity.id} className="flex items-start gap-4 p-4 bg-muted rounded-lg">
                  <div className="w-10 h-10 bg-background rounded-full flex items-center justify-center shrink-0">
                    {getActionIcon(activity.action)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium">{activity.user?.name}</span>
                      <Badge variant="outline" className="text-xs">
                        {getActionLabel(activity.action)}
                      </Badge>
                      <Badge variant="secondary" className="text-xs flex items-center gap-1">
                        {getEntityIcon(activity.entityType)}
                        {getEntityLabel(activity.entityType)}
                      </Badge>
                    </div>
                    
                    {activity.details && Object.keys(activity.details).length > 0 && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {activity.details.invoiceNumber && `Facture: ${activity.details.invoiceNumber}`}
                        {activity.details.productName && `Produit: ${activity.details.productName}`}
                        {activity.details.total && ` - ${activity.details.total}€`}
                        {activity.details.quantity && ` - Quantité: ${activity.details.quantity}`}
                      </p>
                    )}
                    
                    <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                      <span>{formatDateTime(activity.createdAt, locale)}</span>
                      <span>IP: {activity.ipAddress}</span>
                    </div>
                  </div>
                </div>
              ))}
              
              {filteredActivities.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  <Activity className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Aucune activité trouvée</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
