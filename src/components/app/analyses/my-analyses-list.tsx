'use client';

import { useState } from 'react';
import { useFirebase, useUser, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, updateDoc } from 'firebase/firestore';
import { useCollection } from '@/firebase/firestore/use-collection';
import { useDoc } from '@/firebase/firestore/use-doc';
import { doc } from 'firebase/firestore';
import { Card } from '@/components/ui/card';
import { format } from 'date-fns';
import EmptyStateView from '@/components/app/empty-state-view';
import { SearchCheck, ArrowRight, ArrowLeft, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface MyAnalysesListProps {
    onSelectAnalysis: (analysis: any) => void;
    onBack: () => void;
}

export default function MyAnalysesList({ onSelectAnalysis, onBack }: MyAnalysesListProps) {
    const { firestore } = useFirebase();
    const { user } = useUser();
    const [isEditing, setIsEditing] = useState(false);
    const [reportToDelete, setReportToDelete] = useState<any | null>(null);

    const userDocRef = useMemoFirebase(() => {
        if (!user || !firestore) return null;
        return doc(firestore, 'users', user.uid);
    }, [firestore, user]);
    const { data: userProfile } = useDoc<any>(userDocRef);

    // Busca as análises do usuário logado, mais recentes primeiro
    const analysesQuery = useMemoFirebase(() => {
        if (!firestore || !user) return null;
        return query(
            collection(firestore, `users/${user.uid}/analyses`),
            orderBy('createdAt', 'desc')
        );
    }, [firestore, user]);

    const { data: allAnalyses, isLoading } = useCollection<any>(analysesQuery);
    const analyses = allAnalyses?.filter((a: any) => !a.deleted) ?? [];

    const isDeveloper = userProfile?.plan === "desenvolvedor";

    const handleDelete = async () => {
        if (!firestore || !user || !reportToDelete) return;
        try {
            const reportRef = doc(firestore, `users/${user.uid}/analyses`, reportToDelete.id);
            await updateDoc(reportRef, { deleted: true });
            setReportToDelete(null);
        } catch (error) {
            console.error("Erro ao deletar análise:", error);
        }
    };

    if (isLoading) {
        return (
            <div className="fixed inset-0 bg-background/90 backdrop-blur-lg z-[100] flex justify-center items-center">
                <div className="w-20 h-20 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
            </div>
        );
    }

    if (!analyses || analyses.length === 0) {
        return (
            <EmptyStateView 
                icon={<SearchCheck className="w-16 h-16" />} 
                title="Minhas Análises" 
                description="Suas análises gerais geradas ficarão salvas nesta área exclusiva." 
                onBack={onBack} 
            />
        );
    }

    return (
        <div className="max-w-4xl mx-auto px-4 py-24 md:py-32 opacity-0 animate-fade-up">
            <div className="flex items-start md:items-center justify-between flex-col md:flex-row gap-4 mb-12">
                <div className="flex items-center">
                    <Button onClick={onBack} variant="outline" size="icon" className="h-12 w-12 rounded-full mr-6 shrink-0">
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div className="text-left">
                        <h1 className="text-4xl md:text-5xl font-extrabold mb-2 text-foreground">
                            <span className="text-gradient">Minhas</span>{' '}
                            <span className="text-primary">Análises</span>
                        </h1>
                        <p className="text-lg text-muted-foreground">Aqui está o histórico de todas as suas análises gerais geradas.</p>
                    </div>
                </div>
                {isDeveloper && analyses.length > 0 && (
                    <Button 
                        variant={isEditing ? "default" : "outline"}
                        onClick={() => setIsEditing(!isEditing)}
                        className="rounded-full font-bold self-end md:self-auto shrink-0"
                    >
                        {isEditing ? "Concluir Edição" : "Editar Lista"}
                    </Button>
                )}
            </div>
            
            <div className="space-y-6">
                {analyses.map((analysis: any) => {
                    const nota = analysis.report?.avaliacaoGeral?.nota;
                    const notaColor = nota >= 8 ? 'text-emerald-400' : nota >= 6 ? 'text-amber-400' : 'text-red-400';

                    return (
                        <Card
                            key={analysis.id}
                            className={`p-6 glass-card hover:border-primary transition-all cursor-pointer group ${isEditing ? 'border-red-500/20 hover:border-red-500/50' : ''}`}
                            onClick={() => {
                                if (isEditing) {
                                    setReportToDelete(analysis);
                                } else {
                                    onSelectAnalysis({ ...analysis.report, id: analysis.id });
                                }
                            }}
                        >
                            <div className="flex justify-between items-center">
                                <div>
                                    <h3 className="text-xl font-bold text-foreground group-hover:text-red-600 transition-colors">
                                        {analysis.restaurantName || "Restaurante"}
                                    </h3>
                                    <p className="text-sm text-muted-foreground">
                                        Gerada em: {analysis.createdAt ? format(analysis.createdAt.toDate(), 'dd/MM/yyyy HH:mm') : 'Data desconhecida'}
                                    </p>
                                </div>
                                <div className="flex items-center gap-6">
                                    {nota !== undefined && (
                                        <div className="text-right">
                                            <span className={`text-2xl font-black ${notaColor}`}>
                                                {nota.toFixed(1)}
                                            </span>
                                            <span className="text-xs text-muted-foreground block">NOTA</span>
                                        </div>
                                    )}
                                    {isEditing ? (
                                        <div className="p-2 hover:bg-red-500/10 rounded-full transition-colors group/trash pointer-events-none">
                                            <Trash2 className="w-5 h-5 text-red-400 group-hover/trash:text-red-500 transition-colors" />
                                        </div>
                                    ) : (
                                        <ArrowRight className="w-5 h-5 text-slate-500 group-hover:text-primary transition-transform group-hover:translate-x-1" />
                                    )}
                                </div>
                            </div>
                        </Card>
                    );
                })}
            </div>

            <AlertDialog open={!!reportToDelete} onOpenChange={(open) => !open && setReportToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Tem certeza que deseja apagar?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta ação removerá a análise da sua lista. 
                            A análise de <span className="font-bold text-foreground">{reportToDelete?.restaurantName || "Restaurante"}</span> não aparecerá mais aqui, mas ainda estará disponível para a nossa equipe de suporte.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-red-600 text-white hover:bg-red-700">
                            Apagar Análise
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
