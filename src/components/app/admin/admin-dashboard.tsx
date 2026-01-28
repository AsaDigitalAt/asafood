"use client";

import { useMemo } from 'react';
import { useFirebase, useUser, useMemoFirebase, errorEmitter, FirestorePermissionError } from "@/firebase";
import { collection, doc, query, updateDoc, serverTimestamp } from "firebase/firestore";
import { useCollection } from "@/firebase/firestore/use-collection";
import { useDoc } from "@/firebase/firestore/use-doc";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ShieldAlert } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { User } from 'firebase/auth';
import { cn } from '@/lib/utils';

type UserProfile = {
    id: string;
    email: string;
    plan: 'convidado' | 'plano_unico' | 'plano_duplo' | 'plano_acelerador' | 'desenvolvedor';
    planStatus: 'active' | 'inactive' | 'past_due';
    createdAt: { toDate: () => Date };
    lastLoginAt: { toDate: () => Date };
    usage: {
        reportsThisCycle: number;
        cycleStart: { toDate: () => Date };
    }
};

interface AdminDashboardProps {
    onBack: () => void;
}

const planLabels: Record<UserProfile['plan'], string> = {
  convidado: "Convidado",
  plano_unico: "Plano Único",
  plano_duplo: "Plano Duplo",
  plano_acelerador: "Plano Acelerador",
  desenvolvedor: "Desenvolvedor",
};

const planStatusLabels: Record<UserProfile['planStatus'], string> = {
  active: "Ativo",
  inactive: "Inativo",
  past_due: "Pendente",
};

export default function AdminDashboard({ onBack }: AdminDashboardProps) {
    const { firestore } = useFirebase();
    const { user } = useUser();

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

    const { data: users, isLoading: areUsersLoading } = useCollection<UserProfile>(usersQuery);

    if (isAdminLoading) {
        return <div className="pt-32 text-center">Verificando permissões...</div>;
    }

    if (!isAdmin) {
        return (
            <div className="min-h-screen flex flex-col justify-center items-center text-center p-4">
                 <div className="glass-card max-w-lg w-full p-10 md:p-16 rounded-3xl shadow-2xl opacity-0 animate-fade-up">
                    <div className="text-6xl mb-6 text-destructive/50">
                        <ShieldAlert />
                    </div>
                    <h2 className="text-3xl font-bold text-foreground mb-2">Acesso Negado</h2>
                    <p className="text-muted-foreground mb-8">Você não tem permissão para acessar esta página.</p>
                    <Button 
                        onClick={onBack}
                        variant="outline"
                        className="rounded-full bg-transparent border-foreground/20 hover:bg-primary/10 hover:border-primary hover:text-primary h-12 px-8 uppercase font-bold tracking-wider"
                    >
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Voltar
                    </Button>
                </div>
            </div>
        );
    }
    
    const handleFieldChange = (userId: string, field: 'plan' | 'planStatus', value: string) => {
        const userDocRef = doc(firestore, 'users', userId);
        updateDoc(userDocRef, { [field]: value }).catch((serverError) => {
            const permissionError = new FirestorePermissionError({
                path: userDocRef.path,
                operation: 'update',
                requestResourceData: { [field]: value },
            });
            errorEmitter.emit('permission-error', permissionError);
        });
    };

    return (
        <div className="max-w-7xl mx-auto px-4 py-24 md:py-32 opacity-0 animate-fade-up">
            <div className="glass-card rounded-3xl p-6 md:p-10 shadow-2xl">
                <header className="text-center mb-12">
                     <h1 className="text-4xl md:text-5xl font-extrabold mb-3">
                        <span className="text-gradient">Painel do </span> 
                        <span className="text-primary">Administrador</span>
                    </h1>
                    <p className="text-lg text-muted-foreground">Gerenciamento de usuários e planos.</p>
                </header>
                
                <div className="mb-12">
                    <h2 className="text-2xl font-bold mb-4 text-gradient">Usuários</h2>
                    {areUsersLoading ? <p>Carregando usuários...</p> : (
                         <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Email</TableHead>
                                    <TableHead>Plano</TableHead>
                                    <TableHead>Status do Plano</TableHead>
                                    <TableHead>Uso no Ciclo</TableHead>
                                    <TableHead>Último Login</TableHead>
                                    <TableHead>Membro Desde</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {users?.map(u => (
                                    <TableRow key={u.id}>
                                        <TableCell>{u.email}</TableCell>
                                        <TableCell>
                                            <Select value={u.plan} onValueChange={(value) => handleFieldChange(u.id, 'plan', value)}>
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {Object.entries(planLabels).map(([key, label]) => (
                                                        <SelectItem key={key} value={key}>{label}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </TableCell>
                                        <TableCell>
                                            <Select value={u.planStatus} onValueChange={(value) => handleFieldChange(u.id, 'planStatus', value)}>
                                                <SelectTrigger className={cn(
                                                    u.planStatus === 'active' && 'success-text',
                                                    u.planStatus !== 'active' && 'danger-text'
                                                )}>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {Object.entries(planStatusLabels).map(([key, label]) => (
                                                        <SelectItem key={key} value={key}>{label}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </TableCell>
                                        <TableCell>{u.usage?.reportsThisCycle ?? 0}</TableCell>
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
