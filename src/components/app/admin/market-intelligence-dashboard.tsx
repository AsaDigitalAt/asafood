"use client";

import React, { useState } from "react";
import { useFirebase, useMemoFirebase } from "@/firebase";
import { collection, query, orderBy, doc, updateDoc } from "firebase/firestore";
import { useCollection } from "@/firebase/firestore/use-collection";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Star, ExternalLink, Trash2 } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";
import { ReportView, AnalysisReport } from "@/components/app/free-analysis/report-view";

interface MarketIntelligenceDashboardProps {
    onBack: () => void;
}

export default function MarketIntelligenceDashboard({ onBack }: MarketIntelligenceDashboardProps) {
    const { firestore } = useFirebase();
    const [selectedReport, setSelectedReport] = useState<AnalysisReport | null>(null);
    
    const marketQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(
            collection(firestore, 'global_market_analysis'),
            orderBy('createdAt', 'desc')
        );
    }, [firestore]);

    const { data: analyses, isLoading } = useCollection<any>(marketQuery);
    const [stateFilter, setStateFilter] = useState<string>("Todos");
    const [foodFilter, setFoodFilter] = useState<string>("Todos");

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
                        Voltar
                    </Button>
                </div>
                <ReportView report={selectedReport} showReset={false} />
            </div>
        );
    }

    if (isLoading) {
        return <div className="min-h-screen flex justify-center items-center"><div className="w-20 h-20 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div></div>;
    }

    const states = ["Todos", ...Array.from(new Set(analyses?.map(a => a.state).filter(Boolean)))];
    const foods = ["Todos", ...Array.from(new Set(analyses?.map(a => a.foodType).filter(Boolean)))];

    const filteredAnalyses = analyses?.filter(a => {
        if (a.hidden) return false;
        if (stateFilter !== "Todos" && a.state !== stateFilter) return false;
        if (foodFilter !== "Todos" && a.foodType !== foodFilter) return false;
        return true;
    }) || [];

    const handleDelete = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        if (window.confirm("Tem certeza que deseja remover este restaurante da visualização? Ele será mantido no banco para evitar buscas duplicadas.")) {
            try {
                await updateDoc(doc(firestore!, 'global_market_analysis', id), { hidden: true });
            } catch (error) {
                console.error("Erro ao ocultar:", error);
                alert("Erro ao remover o restaurante.");
            }
        }
    };

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
                                <span className="text-gradient">Inteligência de </span>
                                <span className="text-primary">Mercado</span>
                            </h1>
                            <p className="text-lg text-muted-foreground">Métricas globais de restaurantes rastreados.</p>
                        </div>
                    </div>
                </header>

                <div className="space-y-6">
                     <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                         <div className="flex gap-4 flex-wrap">
                            <select 
                                className="bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-white/80 outline-none focus:border-primary/50 transition-colors"
                                value={stateFilter} 
                                onChange={e => setStateFilter(e.target.value)}
                            >
                                {states.map((s: any) => <option key={s} value={s}>{s === "Todos" ? "Todos os Estados" : s}</option>)}
                            </select>
                            <select 
                                className="bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-white/80 outline-none focus:border-primary/50 transition-colors"
                                value={foodFilter} 
                                onChange={e => setFoodFilter(e.target.value)}
                            >
                                {foods.map((f: any) => <option key={f} value={f}>{f === "Todos" ? "Todas as Categorias" : f}</option>)}
                            </select>
                         </div>
                         <div className="text-sm font-medium text-muted-foreground bg-white/5 px-4 py-2 rounded-xl border border-white/10 shrink-0">
                            <span className="font-bold text-foreground">{filteredAnalyses.length}</span> {filteredAnalyses.length === 1 ? 'restaurante encontrado' : 'restaurantes encontrados'}
                         </div>
                     </div>

                     {filteredAnalyses.length === 0 ? (
                         <div className="text-center py-12 text-muted-foreground bg-white/5 rounded-2xl border border-white/10">
                             Nenhuma análise de mercado encontrada para os filtros selecionados.
                         </div>
                     ) : (
                         <div className="overflow-x-auto rounded-xl border border-white/10 bg-black/20">
                            <Table>
                                <TableHeader className="bg-black/40">
                                    <TableRow className="border-white/10 hover:bg-transparent">
                                        <TableHead className="text-white/60 font-bold uppercase tracking-wider text-xs">Restaurante</TableHead>
                                        <TableHead className="text-white/60 font-bold uppercase tracking-wider text-xs">Categoria</TableHead>
                                        <TableHead className="text-white/60 font-bold uppercase tracking-wider text-xs text-center">Menor R$</TableHead>
                                        <TableHead className="text-white/60 font-bold uppercase tracking-wider text-xs text-center">Médio R$</TableHead>
                                        <TableHead className="text-white/60 font-bold uppercase tracking-wider text-xs text-center">Maior R$</TableHead>
                                        <TableHead className="text-white/60 font-bold uppercase tracking-wider text-xs text-center">Nota / Avaliações</TableHead>
                                        <TableHead className="text-white/60 font-bold uppercase tracking-wider text-xs text-right">Data</TableHead>
                                        <TableHead className="w-[50px]"></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredAnalyses.map(a => (
                                        <TableRow 
                                            key={a.id} 
                                            className="border-white/5 hover:bg-white/5 cursor-pointer transition-colors"
                                            onClick={() => {
                                                if(a.aiAnalysis) setSelectedReport({...a.aiAnalysis, id: a.id});
                                            }}
                                        >
                                            <TableCell className="font-bold text-foreground">
                                                <div className="flex items-center gap-2">
                                                    {a.restaurantName || "Sem Nome"}
                                                    {a.ifoodLink && (
                                                        <button 
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                window.open(a.ifoodLink, '_blank');
                                                            }}
                                                            className="text-muted-foreground hover:text-primary transition-colors"
                                                            title="Ver no iFood"
                                                        >
                                                            <ExternalLink className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                </div>
                                                <div className="text-xs text-muted-foreground mt-0.5">{a.location || a.state}</div>
                                            </TableCell>
                                            <TableCell>
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-primary/10 text-primary border border-primary/20 whitespace-nowrap">
                                                    {a.foodType || "Desconhecido"}
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-center font-medium">R$ {a.rawMetrics?.cheapestProduct?.toFixed(2) || '0.00'}</TableCell>
                                            <TableCell className="text-center font-bold text-emerald-400">R$ {a.rawMetrics?.averagePrice?.toFixed(2) || '0.00'}</TableCell>
                                            <TableCell className="text-center font-medium text-rose-500">R$ {a.rawMetrics?.mostExpensiveProduct?.toFixed(2) || '0.00'}</TableCell>
                                            <TableCell className="text-center">
                                                <div className="font-bold text-foreground">{a.rawMetrics?.ifoodScore || 'N/A'} <Star className="w-3 h-3 inline text-amber-400 mb-0.5" /></div>
                                                <div className="text-[10px] text-muted-foreground">{a.rawMetrics?.totalReviews || 0} av.</div>
                                            </TableCell>
                                            <TableCell className="text-right text-muted-foreground whitespace-nowrap text-xs">
                                                {a.createdAt ? format(a.createdAt.toDate(), 'dd/MM/yyyy') : '---'}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <button 
                                                    onClick={(e) => handleDelete(e, a.id)}
                                                    className="p-2 text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors"
                                                    title="Remover Restaurante"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </TableCell>
                                        </TableRow>
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
