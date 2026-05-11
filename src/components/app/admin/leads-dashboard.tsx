"use client";

import React, { useState } from "react";
import { useFirebase, useUser, useMemoFirebase } from "@/firebase";
import { collection, query, orderBy, doc } from "firebase/firestore";
import { useCollection } from "@/firebase/firestore/use-collection";
import { useDoc } from "@/firebase/firestore/use-doc";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Users, SearchCheck, ExternalLink } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";
import { ReportView, AnalysisReport } from "@/components/app/free-analysis/report-view";

interface LeadsDashboardProps {
    onBack: () => void;
}

export default function LeadsDashboard({ onBack }: LeadsDashboardProps) {
    const { firestore } = useFirebase();
    const { user } = useUser();
    const [selectedReport, setSelectedReport] = useState<AnalysisReport | null>(null);

    // Verificando acesso do usuário atual
    const userDocRef = useMemoFirebase(() => {
        if (!firestore || !user?.uid) return null;
        return doc(firestore, 'users', user.uid);
    }, [firestore, user?.uid]);

    const { data: currentUserData, isLoading: isLoadingUser } = useDoc<any>(userDocRef);

    const isDeveloper = currentUserData?.plan === 'desenvolvedor';

    // Query para a coleção raiz 'leads'
    const leadsQuery = useMemoFirebase(() => {
        if (!firestore || !isDeveloper) return null;
        return query(collection(firestore, "leads"), orderBy("createdAt", "desc"));
    }, [firestore, isDeveloper]);

    const { data: leads, isLoading: isLoadingLeads } = useCollection<any>(leadsQuery);

    if (isLoadingUser || (isDeveloper && isLoadingLeads)) {
        return <div className="min-h-screen flex items-center justify-center text-muted-foreground animate-pulse font-medium text-lg uppercase tracking-widest">Carregando painel de leads...</div>;
    }

    if (!isDeveloper) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4">
                <div className="glass-card rounded-3xl p-8 max-w-md text-center">
                    <h2 className="text-2xl font-black text-red-500 mb-4 uppercase tracking-tight">Acesso Negado</h2>
                    <p className="text-muted-foreground mb-8">Esta área é restrita para administradores da plataforma.</p>
                    <Button onClick={onBack} variant="outline" className="rounded-full w-full">Voltar</Button>
                </div>
            </div>
        );
    }

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
                        Voltar para os Leads
                    </Button>
                </div>
                <ReportView report={selectedReport} showReset={false} />
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-4 py-24 md:py-32 opacity-0 animate-fade-up">
            <div className="glass-card rounded-3xl p-6 md:p-10 shadow-2xl">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-10 gap-6">
                    <div className="flex items-center gap-4">
                        <Button onClick={onBack} variant="ghost" size="icon" className="rounded-full hover:bg-white/10 shrink-0">
                            <ArrowLeft className="w-5 h-5 text-foreground" />
                        </Button>
                        <div>
                            <h1 className="text-3xl font-black tracking-tighter text-foreground flex items-center gap-3">
                                <Users className="w-8 h-8 text-primary" />
                                Central de Leads
                            </h1>
                            <p className="text-muted-foreground mt-1">
                                Gerencie contatos de Análises Gratuitas
                            </p>
                        </div>
                    </div>
                    <div className="flex gap-4">
                        <div className="bg-primary/10 border border-primary/20 rounded-2xl px-6 py-3 flex items-center gap-4">
                            <SearchCheck className="w-8 h-8 text-primary" />
                            <div>
                                <div className="text-2xl font-black text-foreground leading-none">{leads?.length || 0}</div>
                                <div className="text-xs font-bold text-primary uppercase tracking-widest mt-1">Leads Captados</div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-black/20 border border-white/10 rounded-2xl overflow-hidden backdrop-blur-xl">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow className="border-white/10 hover:bg-transparent">
                                    <TableHead className="font-bold text-muted-foreground uppercase tracking-wider text-xs">Lead</TableHead>
                                    <TableHead className="font-bold text-muted-foreground uppercase tracking-wider text-xs">Contato</TableHead>
                                    <TableHead className="font-bold text-muted-foreground uppercase tracking-wider text-xs">Link iFood</TableHead>
                                    <TableHead className="font-bold text-muted-foreground uppercase tracking-wider text-xs text-center">Nota</TableHead>
                                    <TableHead className="font-bold text-muted-foreground uppercase tracking-wider text-xs text-right">Data</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {leads?.map((lead: any) => {
                                    const nota = lead.report?.avaliacaoGeral?.nota;
                                    const notaColor = nota >= 8 ? 'text-emerald-400' : nota >= 6 ? 'text-amber-400' : 'text-red-400';

                                    return (
                                        <TableRow 
                                            key={lead.id} 
                                            className="border-white/5 hover:bg-white/5 cursor-pointer transition-colors"
                                            onClick={() => setSelectedReport({ ...lead.report, id: lead.id })}
                                        >
                                            <TableCell>
                                                <div className="font-bold text-foreground">{lead.name || "Sem Nome"}</div>
                                                <div className="text-xs text-muted-foreground mt-0.5 max-w-[200px] truncate" title={lead.restaurantName}>
                                                    {lead.restaurantName || "---"}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-muted-foreground font-medium whitespace-nowrap">
                                                {lead.phone || "---"}
                                            </TableCell>
                                            <TableCell>
                                                {lead.ifoodLink ? (
                                                    <a 
                                                        href={lead.ifoodLink} 
                                                        target="_blank" 
                                                        rel="noopener noreferrer" 
                                                        className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:text-primary/80 transition-colors"
                                                        onClick={(e) => e.stopPropagation()}
                                                    >
                                                        Acessar Loja
                                                        <ExternalLink className="w-3 h-3" />
                                                    </a>
                                                ) : (
                                                    <span className="text-muted-foreground">---</span>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-center">
                                                {nota !== undefined ? (
                                                    <span className={`font-black ${notaColor}`}>
                                                        {nota.toFixed(1)}
                                                    </span>
                                                ) : (
                                                    <span className="text-muted-foreground">---</span>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-right text-muted-foreground whitespace-nowrap">
                                                {lead.createdAt ? format(lead.createdAt.toDate(), 'dd/MM/yyyy HH:mm') : '---'}
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                                {(!leads || leads.length === 0) && (
                                    <TableRow className="border-0 hover:bg-transparent">
                                        <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                                            Nenhum lead captado ainda.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </div>
            </div>
        </div>
    );
}
