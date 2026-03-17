'use client';

import { useFirebase, useUser, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, where } from 'firebase/firestore';
import { useCollection } from '@/firebase/firestore/use-collection';
import { useDoc } from '@/firebase/firestore/use-doc';
import { doc } from 'firebase/firestore';
import { FormState } from '@/app/actions/generate-diagnosis';
import { Card } from '@/components/ui/card';
import { format } from 'date-fns';
import EmptyStateView from '@/components/app/empty-state-view';
import { Rocket, ArrowRight } from 'lucide-react';

interface ActionPlanListProps {
    onSelectReport: (report: FormState) => void;
    onBack: () => void;
}

type DiagnosisReport = any & {
    createdAt: { toDate: () => Date };
};

const getStatusClass = (status?: string) => {
    const s = status ? status.toLowerCase() : '';
    if (s.includes('critico') || s.includes('ruim') || s.includes('risco')) return 'danger-bg !text-foreground border-secondary';
    if (s.includes('atenção') || s.includes('medio')) return 'warning-bg !text-amber-400 border-amber-500/30';
    if (s.includes('bom') || s.includes('otimo') || s.includes('ideal')) return 'success-bg !text-green-400 border-green-500/30';
    return 'warning-bg !text-amber-400 border-amber-500/30';
};

export default function ActionPlanList({ onSelectReport, onBack }: ActionPlanListProps) {
    const { firestore } = useFirebase();
    const { user } = useUser();

    // Primeiro, pegamos o tenantId do perfil do usuário
    const userDocRef = useMemoFirebase(() => {
        if (!user || !firestore) return null;
        return doc(firestore, 'users', user.uid);
    }, [firestore, user]);
    const { data: userProfile } = useDoc<any>(userDocRef);

    // Depois, buscamos os diagnósticos do tenant
    const reportsQuery = useMemoFirebase(() => {
        if (!firestore || !userProfile?.tenantId) return null;
        return query(
            collection(firestore, `tenants/${userProfile.tenantId}/diagnostics`),
            orderBy('createdAt', 'desc')
        );
    }, [firestore, userProfile?.tenantId]);

    const { data: reports, isLoading } = useCollection<DiagnosisReport>(reportsQuery);

    if (isLoading) {
        return (
            <div className="fixed inset-0 bg-background/90 backdrop-blur-lg z-[100] flex justify-center items-center">
                <div className="w-20 h-20 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
            </div>
        );
    }

    if (!reports || reports.length === 0) {
        return <EmptyStateView icon={<Rocket className="w-16 h-16" />} title="Meu Plano de Ação" description="Seus planos gerados ficarão salvos nesta área exclusiva." onBack={onBack} />;
    }

    const handleSelect = (report: any) => {
        // Mapeia o formato do Firestore para o FormState esperado pela DashboardView
        const mappedReport: FormState = {
            nome: report.input?.restaurantName || report.nome,
            statusGeral: report.result?.statusGeral || report.statusGeral || "Concluído",
            conversions: report.result?.conversions || report.conversions || {},
            discounts: report.result?.discounts || report.discounts || {},
            problems: report.result?.problems || report.problems || [],
            actions: report.result?.actions || report.actions || [],
            priorities: report.result?.priorities || report.priorities || [],
            aiGeneratedPlan: report.result?.plan || report.aiGeneratedPlan || null
        };
        onSelectReport(mappedReport);
    }

    return (
        <div className="max-w-4xl mx-auto px-4 py-24 md:py-32 opacity-0 animate-fade-up">
            <div className="text-center mb-12">
                 <h1 className="text-4xl md:text-5xl font-extrabold mb-3">
                    <span className="text-gradient">Meus Planos</span> 
                    <span className="text-primary"> de Ação</span>
                </h1>
                <p className="text-lg text-muted-foreground">Aqui está o histórico de todos os seus diagnósticos gerados.</p>
            </div>
            <div className="space-y-6">
                {reports.map((report: any) => (
                    <Card 
                        key={report.id} 
                        className="p-6 glass-card hover:border-primary transition-all cursor-pointer group" 
                        onClick={() => handleSelect(report)}
                    >
                        <div className="flex justify-between items-center">
                            <div>
                                <h3 className="text-xl font-bold text-foreground group-hover:text-primary transition-colors">
                                    {report.input?.restaurantName || report.nome}
                                </h3>
                                <p className="text-sm text-muted-foreground">
                                    Gerado em: {report.createdAt ? format(report.createdAt.toDate(), 'dd/MM/yyyy HH:mm') : 'Data desconhecida'}
                                </p>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className={`py-1 px-3 rounded-full text-xs font-bold border ${getStatusClass(report.result?.statusGeral || report.statusGeral)}`}>
                                    {report.result?.statusGeral || report.statusGeral || "Finalizado"}
                                </div>
                                <ArrowRight className="w-5 h-5 text-slate-500 group-hover:text-primary transition-transform group-hover:translate-x-1" />
                            </div>
                        </div>
                    </Card>
                ))}
            </div>
        </div>
    );
}
