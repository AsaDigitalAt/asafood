"use client";

import React, { useState } from "react";
import { useFirebase, useUser, useMemoFirebase } from "@/firebase";
import { collection, doc, query, orderBy } from "firebase/firestore";
import { useCollection } from "@/firebase/firestore/use-collection";
import { useDoc } from "@/firebase/firestore/use-doc";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ShieldAlert, Users, Rocket, SearchCheck, ChevronDown, ChevronUp, Calculator, BarChart3, Star } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";
import { ReportView, AnalysisReport } from "@/components/app/free-analysis/report-view";
import { DashboardView } from "@/components/app/dashboard/dashboard-view";
import type { FormState } from "@/app/actions/generate-diagnosis";
import { mapPlanV3ToFormState } from "@/lib/diagnosticPlanMapper";

interface DeveloperDashboardProps {
    onBack: () => void;
}

const planLabels: Record<string, string> = {
    convidado: "Convidado",
    plano_unico: "Plano Essencial",
    plano_duplo: "Plano Performance",
    plano_acelerador: "Plano Acelerador",
    desenvolvedor: "Desenvolvedor",
};

function UserGenerationsViewer({ targetUser, onSelectReport, onSelectDiagnosis }: { targetUser: any, onSelectReport: (report: AnalysisReport) => void, onSelectDiagnosis: (diagnosis: FormState) => void }) {
    const { firestore } = useFirebase();
    
    // Analyses
    const analysesQuery = useMemoFirebase(() => {
        if (!firestore || !targetUser?.id) return null;
        return query(
            collection(firestore, `users/${targetUser.id}/analyses`),
            orderBy('createdAt', 'desc')
        );
    }, [firestore, targetUser?.id]);
    const { data: allAnalyses, isLoading: isAnalysesLoading } = useCollection<any>(analysesQuery);
    const analyses = allAnalyses?.filter((a: any) => !a.deleted) ?? [];

    // Diagnostics
    const diagnosticsQuery = useMemoFirebase(() => {
        if (!firestore || !targetUser?.tenantId) return null;
        return query(
            collection(firestore, `tenants/${targetUser.tenantId}/diagnostics`),
            orderBy('createdAt', 'desc')
        );
    }, [firestore, targetUser?.tenantId]);
    const { data: diagnostics, isLoading: isDiagnosticsLoading } = useCollection<any>(diagnosticsQuery);

    // Precificações
    const pricingsQuery = useMemoFirebase(() => {
        if (!firestore || !targetUser?.id) return null;
        return query(
            collection(firestore, `users/${targetUser.id}/priceCalculations`),
            orderBy('createdAt', 'desc')
        );
    }, [firestore, targetUser?.id]);
    const { data: pricings, isLoading: isPricingsLoading } = useCollection<any>(pricingsQuery);

    if (isAnalysesLoading || isDiagnosticsLoading || isPricingsLoading) {
        return <div className="p-8 text-center text-muted-foreground animate-pulse">Carregando dados...</div>;
    }

    const hasAnalyses = analyses && analyses.length > 0;
    const hasDiagnostics = diagnostics && diagnostics.length > 0;
    const hasPricings = pricings && pricings.length > 0;

    if (!hasAnalyses && !hasDiagnostics && !hasPricings) {
        return <div className="p-8 text-center text-muted-foreground font-medium">Nenhum registro gerado por este usuário.</div>;
    }

    return (
        <div className="p-6 md:p-8 bg-black/40 border-y border-white/10 shadow-inner space-y-10">
            {/* Análises */}
            {hasAnalyses && (
                <div>
                    <h4 className="text-sm font-black text-white/60 uppercase tracking-widest mb-6 flex items-center gap-2">
                        <SearchCheck className="w-4 h-4" />
                        Histórico de Análises
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {analyses.map((analysis: any) => {
                            const nota = analysis.report?.avaliacaoGeral?.nota;
                            const notaColor = nota >= 8 ? 'text-emerald-400' : nota >= 6 ? 'text-amber-400' : 'text-red-400';
                            return (
                                <div 
                                    key={analysis.id} 
                                    onClick={() => onSelectReport({ ...analysis.report, id: analysis.id })}
                                    className="bg-white/5 border border-white/10 rounded-2xl p-5 cursor-pointer hover:border-primary/50 hover:bg-white/10 transition-all duration-300 group"
                                >
                                    <div className="flex justify-between items-start mb-3">
                                        <span className="font-bold text-white group-hover:text-primary transition-colors pr-2">
                                            {analysis.restaurantName || "Restaurante Sem Nome"}
                                        </span>
                                        {nota !== undefined && (
                                            <div className="text-right shrink-0">
                                                <span className={`text-xl font-black ${notaColor} block leading-none`}>
                                                    {nota.toFixed(1)}
                                                </span>
                                                <span className="text-[9px] text-white/40 font-bold uppercase tracking-widest">Nota</span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="text-xs font-medium text-white/50">
                                        {analysis.createdAt ? format(analysis.createdAt.toDate(), 'dd/MM/yyyy HH:mm') : 'Data desconhecida'}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Diagnósticos */}
            {hasDiagnostics && (
                <div>
                    <h4 className="text-sm font-black text-white/60 uppercase tracking-widest mb-6 flex items-center gap-2">
                        <BarChart3 className="w-4 h-4" />
                        Histórico de Diagnósticos
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {diagnostics.map((diag: any) => {
                            const plan = diag.result?.plan ?? {};
                            const nome = diag.nome || diag.input?.restaurantName || "Sem Nome";
                            return (
                                <div 
                                    key={diag.id} 
                                    onClick={() => onSelectDiagnosis(mapPlanV3ToFormState(plan, nome, diag.id))}
                                    className="bg-white/5 border border-white/10 rounded-2xl p-5 cursor-pointer hover:border-primary/50 hover:bg-white/10 transition-all duration-300 group"
                                >
                                    <div className="flex justify-between items-start mb-3">
                                        <span className="font-bold text-white group-hover:text-primary transition-colors pr-2">
                                            {nome}
                                        </span>
                                    </div>
                                    <div className="text-xs font-medium text-white/50">
                                        {diag.createdAt ? format(diag.createdAt.toDate(), 'dd/MM/yyyy HH:mm') : 'Data desconhecida'}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Precificações */}
            {hasPricings && (
                <div>
                    <h4 className="text-sm font-black text-white/60 uppercase tracking-widest mb-6 flex items-center gap-2">
                        <Calculator className="w-4 h-4" />
                        Histórico de Precificações
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {pricings.map((calc: any) => (
                            <div key={calc.id} className="bg-white/5 border border-white/10 rounded-2xl p-5 cursor-default group">
                                <div className="flex justify-between items-start mb-3">
                                    <span className="font-bold text-white group-hover:text-primary transition-colors pr-2">
                                        {calc.productName || "Sem Nome"}
                                    </span>
                                    <div className="text-right shrink-0">
                                        <span className="text-xl font-black text-emerald-400 block leading-none">
                                            R$ {(calc.calculationData?.output?.precoSugerido ?? 0).toFixed(2).replace('.', ',')}
                                        </span>
                                        <span className="text-[9px] text-white/40 font-bold uppercase tracking-widest">Sugerido</span>
                                    </div>
                                </div>
                                <div className="text-xs font-medium text-white/50">
                                    {calc.createdAt ? format(calc.createdAt.toDate(), 'dd/MM/yyyy HH:mm') : 'Data desconhecida'}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}


export default function DeveloperDashboard({ onBack }: DeveloperDashboardProps) {
    const { firestore } = useFirebase();
    const { user } = useUser();
    const [expandedUserId, setExpandedUserId] = useState<string | null>(null);
    const [selectedReport, setSelectedReport] = useState<AnalysisReport | null>(null);
    const [selectedDiagnosis, setSelectedDiagnosis] = useState<FormState | null>(null);

    // Verificando acesso do usuário atual
    const userDocRef = useMemoFirebase(() => {
        if (!user || !firestore) return null;
        return doc(firestore, 'users', user.uid);
    }, [firestore, user]);
    
    const { data: userProfile, isLoading: isProfileLoading } = useDoc<any>(userDocRef);
    const isDeveloper = userProfile?.plan === "desenvolvedor" || userProfile?.role === "developer";

    // Busca todos os usuários
    const usersQuery = useMemoFirebase(() => {
        if (!isDeveloper || !firestore) return null;
        return collection(firestore, 'users');
    }, [firestore, isDeveloper]);

    const { data: users, isLoading: areUsersLoading } = useCollection<any>(usersQuery);

    if (isProfileLoading) {
        return (
            <div className="fixed inset-0 bg-background/90 backdrop-blur-lg z-[100] flex justify-center items-center">
                <div className="w-20 h-20 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
            </div>
        );
    }

    if (!isDeveloper) {
        return (
            <div className="min-h-screen flex flex-col justify-center items-center text-center p-4">
                <div className="glass-card max-w-lg w-full p-10 md:p-16 rounded-3xl shadow-2xl animate-fade-up">
                    <div className="text-6xl mb-6 text-destructive flex justify-center">
                        <ShieldAlert />
                    </div>
                    <h2 className="text-3xl font-bold text-foreground mb-2">Acesso Negado</h2>
                    <p className="text-muted-foreground mb-8">Esta página é restrita apenas para desenvolvedores.</p>
                    <Button onClick={onBack} variant="outline" className="rounded-full">
                        <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
                    </Button>
                </div>
            </div>
        );
    }

    const totalUsers = users?.length || 0;
    const totalDiagnostics = users?.reduce((acc, u) => acc + (Number(u?.usage?.diagnosticsUsed) || 0), 0) || 0;
    const totalAnalyses = users?.reduce((acc, u) => acc + (Number(u?.usage?.freeAnalysisUsed) || 0), 0) || 0;
    const totalPricings = users?.reduce((acc, u) => acc + (Number(u?.usage?.productsUsed) || 0), 0) || 0;

    if (selectedReport) {
        return (
            <div className="relative z-[60] bg-background min-h-screen">
                <div className="absolute top-24 md:top-32 left-4 md:left-10 z-[70] print:hidden">
                    <Button
                        onClick={() => setSelectedReport(null)}
                        variant="outline"
                        className="rounded-full bg-black/20 border-white/20 hover:bg-primary/10 hover:border-primary hover:text-primary h-12 px-6 uppercase font-bold tracking-wider text-white"
                    >
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Voltar para o Painel
                    </Button>
                </div>
                <ReportView report={selectedReport} showReset={false} />
            </div>
        );
    }

    if (selectedDiagnosis) {
        return (
            <div className="relative z-[60] bg-background min-h-screen">
                <div className="absolute top-24 md:top-32 left-4 md:left-10 z-[70] print:hidden">
                    <Button
                        onClick={() => setSelectedDiagnosis(null)}
                        variant="outline"
                        className="rounded-full bg-black/20 border-white/20 hover:bg-primary/10 hover:border-primary hover:text-primary h-12 px-6 uppercase font-bold tracking-wider text-white"
                    >
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Voltar para o Painel
                    </Button>
                </div>
                <DashboardView data={selectedDiagnosis} />
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-4 py-24 md:py-32 opacity-0 animate-fade-up">
            <div className="glass-card rounded-3xl p-6 md:p-10 shadow-2xl">
                <header className="flex flex-col md:flex-row items-start md:items-center justify-between mb-12 gap-4">
                    <div className="flex items-center gap-6">
                        <Button onClick={onBack} variant="outline" size="icon" className="h-12 w-12 rounded-full shrink-0">
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                        <div>
                            <h1 className="text-4xl md:text-5xl font-extrabold mb-2">
                                <span className="text-gradient">Painel do </span>
                                <span className="text-primary">Desenvolvedor</span>
                            </h1>
                            <p className="text-lg text-muted-foreground">Gestão completa e métricas da plataforma.</p>
                        </div>
                    </div>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-6 flex items-center gap-4">
                        <div className="p-4 bg-primary/10 rounded-xl text-primary">
                            <Users className="w-8 h-8" />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Total de Usuários</p>
                            <p className="text-3xl font-black text-foreground">{totalUsers}</p>
                        </div>
                    </div>
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-6 flex items-center gap-4">
                        <div className="p-4 bg-blue-500/10 rounded-xl text-blue-500">
                            <Rocket className="w-8 h-8" />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Diagnósticos</p>
                            <p className="text-3xl font-black text-foreground">{totalDiagnostics}</p>
                        </div>
                    </div>
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-6 flex items-center gap-4">
                        <div className="p-4 bg-emerald-500/10 rounded-xl text-emerald-500">
                            <SearchCheck className="w-8 h-8" />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Análises Gerais</p>
                            <p className="text-3xl font-black text-foreground">{totalAnalyses}</p>
                        </div>
                    </div>
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-6 flex items-center gap-4">
                        <div className="p-4 bg-purple-500/10 rounded-xl text-purple-500">
                            <Calculator className="w-8 h-8" />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Precificações</p>
                            <p className="text-3xl font-black text-foreground">{totalPricings}</p>
                        </div>
                    </div>
                </div>

                <div className="mb-8">
                    <h2 className="text-2xl font-bold mb-6 text-gradient">Todos os Usuários</h2>
                    {areUsersLoading ? (
                        <div className="flex justify-center py-10">
                            <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
                        </div>
                    ) : (
                        <div className="overflow-x-auto rounded-xl border border-white/10 bg-black/20">
                            <Table>
                                <TableHeader className="bg-black/40">
                                    <TableRow className="border-white/10 hover:bg-transparent">
                                        <TableHead className="text-white/60 font-bold uppercase tracking-wider text-xs">Usuário / Email</TableHead>
                                        <TableHead className="text-white/60 font-bold uppercase tracking-wider text-xs">Telefone</TableHead>
                                        <TableHead className="text-white/60 font-bold uppercase tracking-wider text-xs">Plano</TableHead>
                                        <TableHead className="text-white/60 font-bold uppercase tracking-wider text-xs text-center">Diagnósticos</TableHead>
                                        <TableHead className="text-white/60 font-bold uppercase tracking-wider text-xs text-center">Análises</TableHead>
                                        <TableHead className="text-white/60 font-bold uppercase tracking-wider text-xs text-center">Precificações</TableHead>
                                        <TableHead className="text-white/60 font-bold uppercase tracking-wider text-xs text-right">Data de Entrada</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {users?.map(u => (
                                        <React.Fragment key={u.id}>
                                            <TableRow 
                                                className={`border-white/5 hover:bg-white/5 cursor-pointer transition-colors ${expandedUserId === u.id ? 'bg-white/5' : ''}`}
                                                onClick={() => setExpandedUserId(expandedUserId === u.id ? null : u.id)}
                                            >
                                                <TableCell>
                                                    <div className="flex items-center gap-3">
                                                        {expandedUserId === u.id ? (
                                                            <ChevronUp className="w-4 h-4 text-primary shrink-0" />
                                                        ) : (
                                                            <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
                                                        )}
                                                        <div>
                                                            <div className="font-bold text-foreground">{u.name || "Sem Nome"}</div>
                                                            <div className="text-xs text-muted-foreground">{u.email}</div>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-muted-foreground">
                                                    {u.phone || u.telefone || "---"}
                                                </TableCell>
                                                <TableCell>
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-primary/10 text-primary border border-primary/20 whitespace-nowrap">
                                                        {planLabels[u.plan] || u.plan || "Sem Plano"}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="text-center font-bold text-foreground">
                                                    {u.usage?.diagnosticsUsed || 0}
                                                </TableCell>
                                                <TableCell className="text-center font-bold text-foreground">
                                                    {u.usage?.freeAnalysisUsed || 0}
                                                </TableCell>
                                                <TableCell className="text-center font-bold text-foreground">
                                                    {u.usage?.productsUsed || 0}
                                                </TableCell>
                                                <TableCell className="text-right text-muted-foreground whitespace-nowrap">
                                                    {u.createdAt ? format(u.createdAt.toDate(), 'dd/MM/yyyy') : '---'}
                                                </TableCell>
                                            </TableRow>
                                            {expandedUserId === u.id && (
                                                <TableRow className="border-0 hover:bg-transparent">
                                                    <TableCell colSpan={7} className="p-0">
                                                        <UserGenerationsViewer targetUser={u} onSelectReport={setSelectedReport} onSelectDiagnosis={setSelectedDiagnosis} />
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </React.Fragment>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
