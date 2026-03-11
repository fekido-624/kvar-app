"use client";

import { useEffect, useState } from 'react';
import { PageHeader } from '@/components/layout/page-header';
import { User } from '@/lib/types';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MoreHorizontal, Edit, Trash2, UserPlus, Shield, User as UserIcon } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/components/auth-context';
import { useToast } from '@/hooks/use-toast';
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle 
} from '@/components/ui/alert-dialog';

export default function UserListingPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [userToDelete, setUserToDelete] = useState<string | null>(null);
  const { user: currentUser } = useAuth();
  const { toast } = useToast();

  const loadUsers = async () => {
    const response = await fetch('/api/users', { cache: 'no-store' });
    if (!response.ok) return;
    const data = await response.json();
    setUsers(data.users ?? []);
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleDelete = async () => {
    if (userToDelete) {
      if (userToDelete === currentUser?.id) {
        toast({
          title: "Operasi Dihalang",
          description: "Anda tidak boleh memadam akaun sendiri semasa masih log masuk.",
          variant: "destructive"
        });
        setUserToDelete(null);
        return;
      }

      const response = await fetch(`/api/users/${userToDelete}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        toast({
          title: 'Padam Gagal',
          description: 'Tidak dapat memadam akaun yang dipilih.',
          variant: 'destructive',
        });
        setUserToDelete(null);
        return;
      }

      await loadUsers();
      toast({
        title: "Pengguna Dipadam",
        description: "Akaun pengguna berjaya dipadam.",
      });
      setUserToDelete(null);
    }
  };

  const toggleRole = async (user: User) => {
    if (user.id === currentUser?.id) {
      toast({
        title: "Operasi Dihalang",
        description: "Anda tidak boleh mengubah peranan sendiri.",
        variant: "destructive"
      });
      return;
    }
    const newRole = user.role === 'admin' ? 'user' : 'admin';

    const response = await fetch(`/api/users/${user.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: newRole }),
    });

    if (!response.ok) {
      toast({
        title: 'Kemaskini Peranan Gagal',
        description: 'Tidak dapat mengemaskini peranan buat masa ini.',
        variant: 'destructive',
      });
      return;
    }

    await loadUsers();
    toast({
      title: "Peranan Dikemaskini",
      description: `Peranan ${user.firstName} ditukar kepada ${newRole}.`,
    });
  };

  return (
    <div className="animate-fade-in">
      <PageHeader 
        title="Pengurusan Pengguna" 
        description="Lihat dan urus semua kelayakan akses sistem."
        actions={
          <Button asChild className="gap-2">
            <Link href="/admin/users/create">
              <UserPlus size={18} />
              Tambah Pengguna
            </Link>
          </Button>
        }
      />

      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30">
              <TableHead className="w-[250px]">Nama</TableHead>
              <TableHead>Nama Pengguna</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Peranan</TableHead>
              <TableHead>Dicipta</TableHead>
              <TableHead className="text-right">Tindakan</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                  Tiada pengguna dijumpai.
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => (
                <TableRow key={user.id} className="hover:bg-accent/5">
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
                        {user.firstName[0]}{user.lastName[0]}
                      </div>
                      <div>
                        {user.firstName} {user.lastName}
                        {user.id === currentUser?.id && (
                          <span className="ml-2 text-[10px] bg-secondary px-1.5 py-0.5 rounded uppercase tracking-wider font-bold">Anda</span>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-xs">{user.username}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <Badge variant={user.role === 'admin' ? 'default' : 'secondary'} className="gap-1 px-2 py-0.5">
                      {user.role === 'admin' ? <Shield size={12} /> : <UserIcon size={12} />}
                      {user.role}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Tindakan</DropdownMenuLabel>
                        <DropdownMenuItem asChild>
                          <Link href={`/admin/users/edit/${user.id}`} className="cursor-pointer">
                            <Edit className="mr-2 h-4 w-4" /> Edit Profil
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          className="cursor-pointer"
                          onClick={() => toggleRole(user)}
                        >
                          <Shield className="mr-2 h-4 w-4" /> 
                          {user.role === 'admin' ? 'Batalkan Admin' : 'Jadikan Admin'}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          className="text-destructive focus:bg-destructive/10 cursor-pointer"
                          onClick={() => setUserToDelete(user.id)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" /> Padam Akaun
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={!!userToDelete} onOpenChange={() => setUserToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Anda pasti?</AlertDialogTitle>
            <AlertDialogDescription>
              Tindakan ini tidak boleh diundur. Akaun pengguna akan dipadam secara kekal
              dan akses mereka ke platform akan dibuang.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Padam Akaun
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}