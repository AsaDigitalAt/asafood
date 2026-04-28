'use client';

import { useFirebase, useUser, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import { useCollection } from '@/firebase/firestore/use-collection';
import { doc } from 'firebase/firestore';
import { Card } from '@/components/ui/card';
import { format } from 'date-fns';
import EmptyStateView from '@/components/app/empty-state-view';
import { SearchCheck, ArrowRight, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface MyAnalysesListProps {
    onSelectAnalysis: (analysis: any) => void;
    onBack: () => void;
}

export default function MyAnalysesList({ onSelectAnalysis, onBack }: MyAnalysesListProps) {
    const { firestore } = useFirebase();
    const { user } = useUser();

    // Busca as análises do usuário logado, mais recentes primeiro
    const analysesQuery = useMemoFirebase(() => {
        if (!firestore || !user) return null;
        return query(
            collection(firestore, `users/${user.uid}/analyses`),
            orderBy('createdAt', 'desc')
        );
    }, [firestore, user]);

    const { data: analyses, isLoading } = useCollection<any>(analysesQuery);

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
            <div className="flex items-center mb-12">
                <Button onClick={onBack} variant="outline" size="icon" className="h-12 w-12 rounded-full mr-6">
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <div className="text-left">
                    <h1 className="text-4xl md:text-5xl font-extrabold mb-2 text-white">
                        <span className="text-gradient">Minhas</span>{' '}
                        <span className="text-primary">Análises</span>
                    </h1>
                    <p className="text-lg text-muted-foreground">Aqui está o histórico de todas as suas análises gerais geradas.</p>
                </div>
            </div>
            
            <div className="space-y-6">
                {analyses.map((analysis: any) => {
                    const nota = analysis.report?.avaliacaoGeral?.nota;
                    const notaColor = nota >= 8 ? 'text-emerald-400' : nota >= 6 ? 'text-amber-400' : 'text-red-400';

                    return (
                        <Card
                            key={analysis.id}
                            className="p-6 glass-card hover:border-primary transition-all cursor-pointer group"
                            onClick={() => onSelectAnalysis(analysis.report)}
                        >
                            <div className="flex justify-between items-center">
                                <div>
                                    <h3 className="text-xl font-bold text-foreground group-hover:text-primary transition-colors text-white">
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
                                            <span className="text-xs text-white/30 block">NOTA</span>
                                        </div>
                                    )}
                                    <ArrowRight className="w-5 h-5 text-slate-500 group-hover:text-primary transition-transform group-hover:translate-x-1" />
                                </div>
                            </div>
                        </Card>
                    );
                })}
            </div>
        </div>
    );
}
