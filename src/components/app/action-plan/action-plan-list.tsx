'use client';

import { useState } from 'react';
import { useFirebase, useUser, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, updateDoc } from 'firebase/firestore';
import { useCollection } from '@/firebase/firestore/use-collection';
import { useDoc } from '@/firebase/firestore/use-doc';
import { doc } from 'firebase/firestore';
import { FormState } from '@/app/actions/generate-diagnosis';
import { Card } from '@/components/ui/card';
import { format } from 'date-fns';
import EmptyStateView from '@/components/app/empty-state-view';
import { Rocket, ArrowRight, ArrowLeft, Trash2, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { mapPlanV3ToFormState, mapSaudeGeral } from '@/lib/diagnosticPlanMapper';
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

interface ActionPlanListProps {
    onSelectReport: (report: FormState) => void;
    onBack: () => void;
}

type DiagnosisReport = any & {
    createdAt: { toDate: () => Date };
};

const getStatusClass = (saudeGeral?: string) => {
    if (saudeGeral === 'critico') return 'danger-bg !text-foreground border-secondary';
    if (saudeGeral === 'misto') return 'warning-bg !text-amber-400 border-amber-500/30';
    if (saudeGeral === 'saudavel') return 'success-bg !text-green-400 border-green-500/30';
    return 'warning-bg !text-amber-400 border-amber-500/30';
};

export default function ActionPlanList({ onSelectReport, onBack }: ActionPlanListProps) {
    const { firestore } = useFirebase();
    const { user } = useUser();
    const [isEditing, setIsEditing] = useState(false);
    const [reportToDelete, setReportToDelete] = useState<any | null>(null);

    // Primeiro, pegamos o tenantId do perfil do usuário
    const userDocRef = useMemoFirebase(() => {
        if (!user || !firestore) return null;
        return doc(firestore, 'users', user.uid);
    }, [firestore, user]);
    const { data: userProfile } = useDoc<any>(userDocRef);

    // Busca os diagnósticos do tenant, mais recentes primeiro
    // Filtragem por status=completed feita client-side (evita índice composto)
    const reportsQuery = useMemoFirebase(() => {
        if (!firestore || !userProfile?.tenantId) return null;
        return query(
            collection(firestore, `tenants/${userProfile.tenantId}/diagnostics`),
            orderBy('createdAt', 'desc')
        );
    }, [firestore, userProfile?.tenantId]);

    const { data: allReports, isLoading } = useCollection<DiagnosisReport>(reportsQuery);
    const reports = allReports?.filter((r: any) => r.status === 'completed' && !r.deleted) ?? [];

    const isDeveloper = userProfile?.plan === "desenvolvedor";

    const handleDelete = async () => {
        if (!firestore || !userProfile?.tenantId || !reportToDelete) return;
        try {
            const reportRef = doc(firestore, `tenants/${userProfile.tenantId}/diagnostics`, reportToDelete.id);
            await updateDoc(reportRef, { deleted: true });
            setReportToDelete(null);
        } catch (error) {
            console.error("Erro ao deletar diagnóstico:", error);
        }
    };

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
        // Usa o mapper compartilhado para converter o schema v3 → FormState
        const plan = report.result?.plan ?? {};
        const nome = report.input?.restaurantName || report.nome || '';
        onSelectReport(mapPlanV3ToFormState(plan, nome, report.id));
    };

    return (
        <div className="max-w-4xl mx-auto px-4 py-24 md:py-32 opacity-0 animate-fade-up">
            <div className="flex items-start md:items-center justify-between flex-col md:flex-row gap-4 mb-12">
                <div className="flex items-center">
                    <Button onClick={onBack} variant="outline" size="icon" className="h-12 w-12 rounded-full mr-6 shrink-0">
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div className="text-left">
                        <h1 className="text-4xl md:text-5xl font-extrabold mb-2">
                            <span className="text-gradient">Meus Planos</span>{' '}
                            <span className="text-primary">de Ação</span>
                        </h1>
                        <p className="text-lg text-muted-foreground">Aqui está o histórico de todos os seus diagnósticos gerados.</p>
                    </div>
                </div>
                {isDeveloper && reports.length > 0 && (
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
                {reports.map((report: any) => {
                    const saudeGeral = report.result?.plan?.funilVendas?.saudeGeral;
                    const statusLabel = mapSaudeGeral(saudeGeral);
                    
                    const totalActions = report.result?.plan?.planoDeAcaoCompleto?.length || 0;
                    const checkedCount = report.checkedActions?.length || 0;
                    const isCompleted = totalActions > 0 && checkedCount === totalActions;
                    const percentage = totalActions > 0 ? Math.round((checkedCount / totalActions) * 100) : 0;

                    return (
                        <Card
                            key={report.id}
                            className={`p-6 glass-card hover:border-primary transition-all cursor-pointer group ${isEditing ? 'border-red-500/20 hover:border-red-500/50' : ''}`}
                            onClick={() => {
                                if (isEditing) {
                                    setReportToDelete(report);
                                } else {
                                    handleSelect(report);
                                }
                            }}
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
                                    <div className={`py-1 px-3 rounded-full text-xs font-bold border ${getStatusClass(saudeGeral)}`}>
                                        {statusLabel}
                                    </div>
                                    {isCompleted ? (
                                        <div className="flex items-center gap-1.5 text-green-500 font-bold text-xs bg-green-500/10 px-2.5 py-1 rounded-full border border-green-500/20" title="Plano 100% executado">
                                            <CheckCircle2 className="w-4 h-4" />
                                            <span>Pronto</span>
                                        </div>
                                    ) : totalActions > 0 ? (
                                        <div className="flex items-center gap-1.5 text-blue-500 font-bold text-xs bg-blue-500/10 px-2.5 py-1 rounded-full border border-blue-500/20" title={`${percentage}% executado`}>
                                            <span>{percentage}%</span>
                                        </div>
                                    ) : null}
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
                            Esta ação removerá o diagnóstico da sua lista. 
                            O diagnóstico de <span className="font-bold text-foreground">{reportToDelete?.input?.restaurantName || reportToDelete?.nome}</span> não aparecerá mais aqui, mas ainda estará disponível para a nossa equipe de suporte.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-red-600 text-white hover:bg-red-700">
                            Apagar Diagnóstico
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
