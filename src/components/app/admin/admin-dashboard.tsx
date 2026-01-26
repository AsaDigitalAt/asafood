"use client";

import { useMemo } from 'react';
import { useFirebase, useUser, useMemoFirebase } from "@/firebase";
import { collection, doc, query, where, orderBy, updateDoc } from "firebase/firestore";
import { useCollection } from "@/firebase/firestore/use-collection";
import { useDoc } from "@/firebase/firestore/use-doc";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ShieldAlert } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from '@/hooks/use-toast';
import { subDays } from 'date-fns';

type UserData = {
    id: string;
    email: string;
    role: 'user' | 'admin';
    status: 'active' | 'suspended';
    createdAt: { toDate: () => Date };
    lastLoginAt: { toDate: () => Date };
};

type UsageEvent = {
    id: string;
    action: string;
    status: string;
    timestamp: { toDate: () => Date };
};

interface AdminDashboardProps {
    onBack: () => void;
}

export default function AdminDashboard({ onBack }: AdminDashboardProps) {
    const { firestore } = useFirebase();
    const { user } = useUser();
    const { toast } = useToast();

    const adminRoleRef = useMemoFirebase(() => {
        if (!user) return null;
        return doc(firestore, 'roles_admin', user.uid);
    }, [firestore, user]);
    const { data: adminRole, isLoading: isAdminLoading } = useDoc(adminRoleRef);
    const isAdmin = !!adminRole;

    const usersQuery = useMemoFirebase(() => {
        if (!isAdmin) return null;
        return collection(firestore, 'users');
    }, [firestore, isAdmin]);

    const { data: users, isLoading: areUsersLoading } = useCollection<UserData>(usersQuery);
    
    // Usage Events for all users in last 30 days
    const usageEventsQuery = useMemoFirebase(() => {
        if (!isAdmin) return null;
        const thirtyDaysAgo = subDays(new Date(), 30);
        return query(
            collection(firestore, 'usageEvents'), 
            where('timestamp', '>=', thirtyDaysAgo),
            orderBy('timestamp', 'desc')
        );
    }, [firestore, isAdmin]);
    const { data: usageEvents } = useCollection<UsageEvent>(usageEventsQuery);


    if (isAdminLoading) {
        return <div className="pt-32 text-center">Verificando permissões...</div>;
    }

    if (!isAdmin) {
        return (
            <div className="min-h-screen flex flex-col justify-center items-center text-center p-4">
                 <div className="glass-card max-w-lg w-full p-10 md:p-16 rounded-3xl shadow-2xl opacity-0 animate-fade-up">
                    <div className="text-6xl mb-6 text-red-500/50">
                        <ShieldAlert />
                    </div>
                    <h2 className="text-3xl font-bold text-white mb-2">Acesso Negado</h2>
                    <p className="text-muted-foreground mb-8">Você não tem permissão para acessar esta página.</p>
                    <Button 
                        onClick={onBack}
                        variant="outline"
                        className="rounded-full bg-transparent border-white/20 hover:bg-primary/10 hover:border-primary hover:text-primary h-12 px-8 uppercase font-bold tracking-wider"
                    >
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Voltar
                    </Button>
                </div>
            </div>
        );
    }
    
    const handleStatusChange = async (userId: string, status: 'active' | 'suspended') => {
        const userDocRef = doc(firestore, 'users', userId);
        try {
            await updateDoc(userDocRef, { status });
            toast({ title: 'Sucesso', description: 'Status do usuário atualizado.'});
        } catch (error) {
            toast({ variant: 'destructive', title: 'Erro', description: 'Não foi possível atualizar o status.'});
        }
    };

    const handleRoleChange = async (userId: string, role: 'user' | 'admin') => {
        const userDocRef = doc(firestore, 'users', userId);
        try {
            await updateDoc(userDocRef, { role });
            // Note: For admin role, you'd also need to manage the `roles_admin` collection,
            // which requires backend logic (e.g., a Firebase Function) as clients can't write to it.
            // This UI change only affects the 'role' field in the user document.
            toast({ title: 'Sucesso', description: 'Role do usuário atualizado.'});
        } catch (error) {
            toast({ variant: 'destructive', title: 'Erro', description: 'Não foi possível atualizar o role.'});
        }
    };


    return (
        <div className="max-w-7xl mx-auto px-4 py-24 md:py-32 opacity-0 animate-fade-up">
            <div className="glass-card rounded-3xl p-6 md:p-10 shadow-2xl">
                <header className="text-center mb-12">
                     <h1 className="text-4xl md:text-5xl font-extrabold mb-3">
                        <span className="text-gradient">Painel do </span> 
                        <span className="text-primary">Administrador</span>
                    </h1>
                    <p className="text-lg text-muted-foreground">Gerenciamento de usuários e auditoria.</p>
                </header>
                
                <div className="mb-12">
                    <h2 className="text-2xl font-bold mb-4 text-gradient">Usuários</h2>
                    {areUsersLoading ? <p>Carregando usuários...</p> : (
                         <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Email</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Role</TableHead>
                                    <TableHead>Último Login</TableHead>
                                    <TableHead>Membro Desde</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {users?.map(u => (
                                    <TableRow key={u.id}>
                                        <TableCell>{u.email}</TableCell>
                                        <TableCell>
                                            <Select value={u.status} onValueChange={(value: 'active' | 'suspended') => handleStatusChange(u.id, value)}>
                                                <SelectTrigger className={u.status === 'active' ? 'text-green-400' : 'text-red-400'}>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="active">Active</SelectItem>
                                                    <SelectItem value="suspended">Suspended</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </TableCell>
                                        <TableCell>
                                            <Select value={u.role} onValueChange={(value: 'user' | 'admin') => handleRoleChange(u.id, value)}>
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="user">User</SelectItem>
                                                    <SelectItem value="admin">Admin</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </TableCell>
                                        <TableCell>{u.lastLoginAt?.toDate().toLocaleString()}</TableCell>
                                        <TableCell>{u.createdAt?.toDate().toLocaleDateString()}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                         </Table>
                    )}
                </div>

                <div>
                     <Button onClick={onBack} variant="outline">
                        <ArrowLeft className="mr-2 h-4 w-4" /> Voltar para o Diagnóstico
                    </Button>
                </div>

            </div>
        </div>
    );
}

