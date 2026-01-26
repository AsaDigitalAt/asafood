'use client';

import { useFirebase, useUser, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import { useCollection } from '@/firebase/firestore/use-collection';
import { FormState } from '@/app/actions/generate-diagnosis';
import { Card } from '@/components/ui/card';
import { format } from 'date-fns';
import EmptyStateView from '@/components/app/empty-state-view';
import { Rocket, ArrowRight } from 'lucide-react';
import LoadingScreen from '../loading-screen';

interface ActionPlanListProps {
    onSelectReport: (report: FormState) => void;
    onBack: () => void;
}

type DiagnosisReport = FormState & {
    createdAt: { toDate: () => Date };
};

const getStatusClass = (status?: string) => {
    const s = status ? status.toLowerCase() : '';
    if (s.includes('critico') || s.includes('ruim') || s.includes('risco')) return 'danger-bg !text-red-400 border-red-500/30';
    if (s.includes('atenção') || s.includes('medio')) return 'warning-bg !text-amber-400 border-amber-500/30';
    if (s.includes('bom') || s.includes('otimo') || s.includes('ideal')) return 'success-bg !text-green-400 border-green-500/30';
    return 'warning-bg !text-amber-400 border-amber-500/30';
};


export default function ActionPlanList({ onSelectReport, onBack }: ActionPlanListProps) {
    const { firestore } = useFirebase();
    const { user } = useUser();

    const reportsQuery = useMemoFirebase(() => {
        if (!user || !firestore) return null;
        return query(collection(firestore, `users/${user.uid}/diagnosisReports`), orderBy('createdAt', 'desc'));
    }, [firestore, user]);

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
                        onClick={() => onSelectReport(report)}
                    >
                        <div className="flex justify-between items-center">
                            <div>
                                <h3 className="text-xl font-bold text-white group-hover:text-primary transition-colors">{report.nome}</h3>
                                <p className="text-sm text-muted-foreground">
                                    Gerado em: {report.createdAt ? format(report.createdAt.toDate(), 'dd/MM/yyyy HH:mm') : 'Data desconhecida'}
                                </p>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className={`py-1 px-3 rounded-full text-xs font-bold border ${getStatusClass(report.statusGeral)}`}>
                                    {report.statusGeral}
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
