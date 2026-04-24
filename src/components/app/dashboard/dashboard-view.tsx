'use client'

import type { FormState } from "@/app/actions/generate-diagnosis"
import { ActionChecklist } from "./action-checklist"
import { DiscountAnalysis } from "./discount-analysis"
import { FunnelMetrics } from "./funnel-metrics"
import { ProblemsList } from "./problems-list"
import { PrioritiesList } from "./priorities-list"
import { Button } from "@/components/ui/button"
import { MessageSquare, Download } from "lucide-react"

interface DashboardViewProps {
    data: FormState
}

const getStatusClass = (status?: string) => {
    const s = status ? status.toLowerCase() : '';
    if (s.includes('critico') || s.includes('ruim') || s.includes('risco')) return 'danger-bg !text-red-400 border-red-500/30';
    if (s.includes('atenção') || s.includes('medio')) return 'warning-bg !text-amber-400 border-amber-500/30';
    if (s.includes('bom') || s.includes('otimo') || s.includes('ideal')) return 'success-bg !text-green-400 border-green-500/30';
    return 'warning-bg !text-amber-400 border-amber-500/30';
};

export function DashboardView({ data }: DashboardViewProps) {
    if (!data || !data.nome) {
        return <div className="pt-32 text-center text-muted-foreground">Carregando dados do dashboard...</div>;
    }

    return (
        <div className="max-w-5xl mx-auto px-4 py-24 md:py-32 opacity-0 animate-fade-up">
            <div className="glass-card rounded-3xl p-6 md:p-10 shadow-2xl">
                <header className="text-center mb-12">
                    {data.statusGeral && (
                        <div className={`inline-block py-2 px-6 rounded-full font-bold text-sm uppercase tracking-widest mb-6 border ${getStatusClass(data.statusGeral)}`}>
                            Status Geral: {data.statusGeral}
                        </div>
                    )}
                    <h1 className="text-4xl md:text-5xl font-extrabold mb-3">
                        <span className="text-gradient">Diagnóstico de </span> 
                        <span className="text-primary">{data.nome}</span>
                    </h1>
                    <p className="text-lg text-muted-foreground">Análise completa baseada nos dados enviados.</p>
                </header>

                <div className="space-y-12">
                    <FunnelMetrics conversions={data.conversions} />
                    <DiscountAnalysis discounts={data.discounts} />
                    <ProblemsList problems={data.problems} />
                    <PrioritiesList priorities={data.priorities} />
                    <ActionChecklist actions={data.actions} />

                    {data.aiGeneratedPlan && (
                         <div className="glass-card border border-primary/20 rounded-2xl p-6 md:p-8">
                            <h3 className="text-2xl font-bold text-center mb-6 text-gradient">Plano de Ação Detalhado (IA)</h3>
                            <div className="prose prose-invert prose-p:text-muted-foreground prose-strong:text-white max-w-none whitespace-pre-wrap">
                                <p>{data.aiGeneratedPlan}</p>
                            </div>
                        </div>
                    )}
                    
                    <div className="flex flex-col sm:flex-row justify-center items-center gap-4 pt-8 print:hidden">
                         <Button
                            size="lg"
                            variant="outline"
                            className="h-14 px-10 rounded-full font-bold uppercase tracking-wider border-white/20 hover:bg-white/10"
                            onClick={() => window.print()}
                         >
                            <Download className="mr-3 h-5 w-5" />
                            Exportar PDF
                         </Button>
                         <Button
                            size="lg"
                            className="h-14 px-10 rounded-full font-bold uppercase tracking-wider bg-green-600 hover:bg-green-700 text-white"
                            onClick={() => window.open('https://wa.me/556193788529', '_blank')}
                         >
                            <MessageSquare className="mr-3 h-5 w-5" />
                            Falar com Especialista
                         </Button>
                    </div>
                </div>
            </div>
        </div>
    )
}
