import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  UserCircle, 
  Mail, 
  Shield,
  Check,
  X
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuthStore } from '@/store';
import { formatDate } from '@/lib/utils';
import { toast } from 'sonner';
import type { User, UserRole } from '@/types';

// Mock users data - in real app, this would come from the store
const mockUsers: User[] = [
  {
    id: '1',
    name: 'Admin User',
    email: 'admin@businesspro.com',
    role: 'admin',
    isActive: true,
    createdAt: new Date(),
    lastLogin: new Date(),
  },
  {
    id: '2',
    name: 'Seller User',
    email: 'seller@businesspro.com',
    role: 'seller',
    isActive: true,
    createdAt: new Date(),
    lastLogin: new Date(),
  },
  {
    id: '3',
    name: 'Manager User',
    email: 'manager@businesspro.com',
    role: 'manager',
    isActive: true,
    createdAt: new Date(),
    lastLogin: new Date(),
  },
];

export default function UsersPage() {
  const { t, i18n } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>(mockUsers);
  
  const { currentUser } = useAuthStore();
  
  const locale = i18n.language === 'fr' ? 'fr-FR' : i18n.language === 'ar' ? 'ar-SA' : 'en-US';
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'seller' as UserRole,
    password: '',
    isActive: true,
  });
  
  // Filter users
  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  // Reset form
  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      role: 'seller',
      password: '',
      isActive: true,
    });
  };
  
  // Open dialogs
  const openAddDialog = () => {
    resetForm();
    setShowAddDialog(true);
  };
  
  const openEditDialog = (user: User) => {
    setSelectedUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      role: user.role,
      password: '',
      isActive: user.isActive,
    });
    setShowEditDialog(true);
  };
  
  const openDeleteDialog = (user: User) => {
    setSelectedUser(user);
    setShowDeleteDialog(true);
  };
  
  // Handle save
  const handleSave = () => {
    if (!formData.name || !formData.email) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }
    
    if (showEditDialog && selectedUser) {
      setUsers(users.map(u => u.id === selectedUser.id ? { ...u, ...formData } : u));
      toast.success(t('users.userUpdated'));
      setShowEditDialog(false);
    } else {
      const newUser: User = {
        id: Math.random().toString(36).substr(2, 9),
        name: formData.name,
        email: formData.email,
        role: formData.role,
        isActive: formData.isActive,
        createdAt: new Date(),
      };
      setUsers([...users, newUser]);
      toast.success(t('users.userCreated'));
      setShowAddDialog(false);
    }
  };
  
  // Handle delete
  const handleDelete = () => {
    if (selectedUser) {
      if (selectedUser.id === currentUser?.id) {
        toast.error(t('users.cannotDeleteSelf'));
        return;
      }
      setUsers(users.filter(u => u.id !== selectedUser.id));
      toast.success(t('users.userDeleted'));
      setShowDeleteDialog(false);
    }
  };
  
  // Get role badge
  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'admin':
        return <Badge variant="destructive">{t('users.admin')}</Badge>;
      case 'manager':
        return <Badge variant="warning">{t('users.manager')}</Badge>;
      case 'seller':
        return <Badge variant="default">{t('users.seller')}</Badge>;
      default:
        return <Badge>{role}</Badge>;
    }
  };
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('users.title')}</h1>
          <p className="text-muted-foreground">Gérez les utilisateurs et leurs permissions</p>
        </div>
        <Button onClick={openAddDialog}>
          <Plus className="w-4 h-4 mr-2" />
          {t('users.addUser')}
        </Button>
      </div>
      
      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total utilisateurs</p>
                <p className="text-2xl font-bold">{users.length}</p>
              </div>
              <UserCircle className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Administrateurs</p>
                <p className="text-2xl font-bold">{users.filter(u => u.role === 'admin').length}</p>
              </div>
              <Shield className="w-8 h-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Vendeurs</p>
                <p className="text-2xl font-bold">{users.filter(u => u.role === 'seller').length}</p>
              </div>
              <UserCircle className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Actifs</p>
                <p className="text-2xl font-bold text-green-600">{users.filter(u => u.isActive).length}</p>
              </div>
              <Check className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Users List */}
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
                  <th className="text-left p-3 text-sm font-medium">{t('users.name')}</th>
                  <th className="text-left p-3 text-sm font-medium">{t('users.email')}</th>
                  <th className="text-left p-3 text-sm font-medium">{t('users.role')}</th>
                  <th className="text-center p-3 text-sm font-medium">{t('users.status')}</th>
                  <th className="text-left p-3 text-sm font-medium">{t('users.lastLogin')}</th>
                  <th className="text-right p-3 text-sm font-medium">{t('app.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="border-b hover:bg-muted/50">
                    <td className="p-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                          <span className="font-medium text-primary">{user.name.charAt(0)}</span>
                        </div>
                        <span className="font-medium">{user.name}</span>
                        {user.id === currentUser?.id && (
                          <Badge variant="outline" className="text-xs">Vous</Badge>
                        )}
                      </div>
                    </td>
                    <td className="p-3 text-sm">{user.email}</td>
                    <td className="p-3">{getRoleBadge(user.role)}</td>
                    <td className="p-3 text-center">
                      {user.isActive ? (
                        <Badge variant="success" className="bg-green-100 text-green-800">{t('users.active')}</Badge>
                      ) : (
                        <Badge variant="secondary">{t('users.inactive')}</Badge>
                      )}
                    </td>
                    <td className="p-3 text-sm text-muted-foreground">
                      {user.lastLogin ? formatDate(user.lastLogin, locale) : 'Jamais'}
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openEditDialog(user)}>
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="text-red-500"
                          onClick={() => openDeleteDialog(user)}
                          disabled={user.id === currentUser?.id}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {filteredUsers.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <UserCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Aucun utilisateur trouvé</p>
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
              {showEditDialog ? t('users.editUser') : t('users.addUser')}
            </DialogTitle>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>{t('users.name')} *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Nom complet"
              />
            </div>
            
            <div className="space-y-2">
              <Label>{t('users.email')} *</Label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="email@exemple.com"
              />
            </div>
            
            {!showEditDialog && (
              <div className="space-y-2">
                <Label>{t('app.password')} *</Label>
                <Input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Mot de passe"
                />
              </div>
            )}
            
            <div className="space-y-2">
              <Label>{t('users.role')}</Label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
                className="w-full h-10 px-3 rounded-md border border-input bg-background"
              >
                <option value="admin">{t('users.admin')}</option>
                <option value="manager">{t('users.manager')}</option>
                <option value="seller">{t('users.seller')}</option>
              </select>
            </div>
            
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="w-4 h-4"
              />
              <Label htmlFor="isActive" className="cursor-pointer">{t('users.active')}</Label>
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
            <DialogTitle>{t('users.deleteUser')}</DialogTitle>
          </DialogHeader>
          <p className="py-4">{t('users.confirmDelete')}</p>
          <p className="font-medium">{selectedUser?.name}</p>
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
