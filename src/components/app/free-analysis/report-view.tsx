"use client";

import Image from "next/image";
import { 
  Sparkles, 
  AlertTriangle, 
  CheckCircle2, 
  User, 
  MessageSquare, 
  UtensilsCrossed, 
  BarChart3, 
  Target, 
  Trophy, 
  RefreshCw 
} from "lucide-react";
import { StarRating } from "@/components/app/dashboard/star-rating";

export interface AnalysisReport {
  id?: string;
  nomeRestaurante?: string;
  diagnosticoPrincipal?: string;
  avaliacaoGeral?: { nota: number | null; contexto: string };
  pontosFortesIdentificados?: { titulo: string; descricao: string }[];
  gargalosIdentificados?: { titulo: string; descricao: string; mecanismoDeImpacto?: string; impacto: "alto" | "medio" | "baixo" }[];
  analiseDetalhada?: { perfil?: string; avaliacoes?: string; cardapio?: string };
  planoDeCorrecao?: { prioridade: "urgente" | "importante" | "recomendado"; acao: string; justificativa: string; impactoEsperado: string }[];
  correlacaoDeProblemas?: string;
  proximosPassos?: string;
}

const prioridadeConfig = {
  urgente: { label: "Urgente", color: "bg-red-500/20 text-red-400 border-red-500/30" },
  importante: { label: "Importante", color: "bg-amber-500/20 text-amber-400 border-amber-500/30" },
  recomendado: { label: "Recomendado", color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" },
};

const impactoConfig = {
  alto: { label: "Alto Impacto", color: "bg-red-100 text-red-700 border-red-200" },
  medio: { label: "Médio Impacto", color: "bg-amber-100 text-amber-700 border-amber-200" },
  baixo: { label: "Baixo Impacto", color: "bg-blue-100 text-blue-700 border-blue-200" },
};

export function ReportView({ report, onReset, showReset = true }: { report: AnalysisReport; onReset?: () => void; showReset?: boolean }) {
  const nota = report.avaliacaoGeral?.nota;
  const notaColor =
    nota == null ? "text-white/60" :
    nota >= 8 ? "text-emerald-400" :
    nota >= 6 ? "text-amber-400" : "text-red-400";

  return (
    <div className="min-h-screen bg-background font-body pb-20">
      {/* Hero do relatório */}
      <div className="bg-primary px-6 py-16 text-center rounded-b-[3rem]">
        <div className="max-w-3xl mx-auto">
          <Image
            src="https://firebasestorage.googleapis.com/v0/b/base-arquivos.firebasestorage.app/o/Logo%20ASA%20OFF.png?alt=media&token=62ef02f9-1b75-4a7a-b496-b56184407e2f"
            alt="Asa Food Logo"
            width={120}
            height={34}
            className="mx-auto mb-6"
          />
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/20 text-white/80 text-[10px] font-bold uppercase tracking-[0.2em] mb-5">
            <Sparkles className="w-3 h-3" />
            Diagnóstico Personalizado
          </div>
          <h1 className="text-3xl md:text-5xl font-black tracking-tighter text-white mb-3">
            {report.nomeRestaurante || "Seu Restaurante"}
          </h1>
          {nota != null && (
            <div className="flex items-center justify-center gap-3 mt-4">
              <div className="text-5xl font-black tracking-tighter">
                <span className={notaColor}>{nota.toFixed(1)}</span>
                <span className="text-white/30 text-2xl">/10</span>
              </div>
            </div>
          )}
          {report.avaliacaoGeral?.contexto && (
            <p className="text-primary-foreground/70 text-sm mt-3 max-w-md mx-auto">
              {report.avaliacaoGeral.contexto}
            </p>
          )}
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-12 space-y-10">
        {/* Diagnóstico Principal */}
        {report.diagnosticoPrincipal && (
          <div className="bg-red-50 border-2 border-red-200 rounded-3xl p-8">
            <h2 className="text-lg font-black tracking-tight text-red-900 mb-3 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              Diagnóstico Principal
            </h2>
            <p className="text-red-800 leading-relaxed">{report.diagnosticoPrincipal}</p>
          </div>
        )}

        {/* Pontos fortes + Gargalos */}
        <div className="grid md:grid-cols-2 gap-6">
          {(report.pontosFortesIdentificados?.length ?? 0) > 0 && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-3xl p-7">
              <h2 className="text-lg font-black tracking-tight text-emerald-800 mb-5 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5" />
                O que está funcionando
              </h2>
              <div className="space-y-4">
                {report.pontosFortesIdentificados!.map((item, i) => (
                  <div key={i}>
                    <p className="font-bold text-emerald-900 text-sm">{item.titulo}</p>
                    <p className="text-emerald-700 text-sm leading-relaxed mt-0.5">{item.descricao}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {(report.gargalosIdentificados?.length ?? 0) > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-3xl p-7">
              <h2 className="text-lg font-black tracking-tight text-red-800 mb-5 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                O que está prejudicando
              </h2>
              <div className="space-y-5">
                {report.gargalosIdentificados!.map((item, i) => {
                  const cfg = impactoConfig[item.impacto] || impactoConfig.baixo;
                  return (
                    <div key={i}>
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-bold text-red-900 text-sm">{item.titulo}</p>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${cfg.color}`}>
                          {cfg.label}
                        </span>
                      </div>
                      <p className="text-red-700 text-sm leading-relaxed">{item.descricao}</p>
                      {item.mecanismoDeImpacto && (
                        <p className="text-red-600/80 text-xs leading-relaxed mt-1.5 italic border-l-2 border-red-300 pl-3">
                          {item.mecanismoDeImpacto}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Análises detalhadas */}
        {report.analiseDetalhada && [
          { icon: <User className="w-5 h-5 text-primary" />, title: "Análise do Perfil", text: report.analiseDetalhada.perfil },
          { icon: <MessageSquare className="w-5 h-5 text-primary" />, title: "Análise das Avaliações", text: report.analiseDetalhada.avaliacoes },
          { icon: <UtensilsCrossed className="w-5 h-5 text-primary" />, title: "Sinais do Cardápio", text: report.analiseDetalhada.cardapio },
        ].filter(({ text }) => !!text).map(({ icon, title, text }) => (
          <div key={title} className="bg-card border border-border rounded-3xl p-8">
            <h2 className="text-lg font-black tracking-tight text-foreground mb-3 flex items-center gap-2">
              {icon}
              {title}
            </h2>
            <p className="text-muted-foreground leading-relaxed">{text}</p>
          </div>
        ))}

        {/* Correlação de Problemas */}
        {report.correlacaoDeProblemas && (
          <div className="bg-accent/10 border border-accent/20 rounded-3xl p-8">
            <h2 className="text-lg font-black tracking-tight text-foreground mb-3 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-accent" />
              Como os problemas se encadeiam
            </h2>
            <p className="text-muted-foreground leading-relaxed">{report.correlacaoDeProblemas}</p>
          </div>
        )}

        {/* Plano de Correção */}
        {(report.planoDeCorrecao?.length ?? 0) > 0 && (
          <div className="bg-card border border-border rounded-3xl p-8">
            <h2 className="text-lg font-black tracking-tight text-foreground mb-6 flex items-center gap-2">
              <Target className="w-5 h-5 text-primary" />
              Plano de Correção
            </h2>
            <div className="space-y-5">
              {report.planoDeCorrecao!.map((item, i) => {
                const cfg = prioridadeConfig[item.prioridade] || prioridadeConfig.recomendado;
                return (
                  <div key={i} className="flex gap-4 items-start p-5 bg-muted/40 rounded-2xl border border-border">
                    <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-black text-sm shrink-0">
                      {i + 1}
                    </div>
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${cfg.color}`}>
                          {cfg.label}
                        </span>
                      </div>
                      <p className="text-foreground font-semibold text-sm mb-2">{item.acao}</p>
                      {item.justificativa && (
                        <p className="text-muted-foreground text-xs leading-relaxed mb-2 italic border-l-2 border-primary/30 pl-3">
                          <span className="font-semibold not-italic text-foreground/70">Por quê: </span>
                          {item.justificativa}
                        </p>
                      )}
                      <p className="text-muted-foreground text-sm">
                        <span className="font-medium">Impacto esperado:</span> {item.impactoEsperado}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Próximos Passos */}
        {report.proximosPassos && showReset && (
          <div className="bg-primary rounded-3xl p-8 text-center text-primary-foreground">
            <Trophy className="w-10 h-10 mx-auto mb-4 text-white/80" />
            <h2 className="text-2xl font-black tracking-tighter text-white mb-3">Sua próxima ação (hoje)</h2>
            <p className="text-primary-foreground/80 leading-relaxed max-w-xl mx-auto mb-7">
              {report.proximosPassos}
            </p>
            {onReset && (
              <button
                onClick={onReset}
                className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-primary-foreground text-primary font-bold uppercase tracking-widest text-sm hover:bg-primary-foreground/90 transition-all duration-300 hover:scale-[1.02]"
              >
                <RefreshCw className="w-4 h-4" />
                Analisar outro restaurante
              </button>
            )}
          </div>
        )}

        <div className="pt-12 border-t border-border print:hidden">
            <StarRating 
                analysisId={report.id} 
                analysisType="general" 
                restaurantName={report.nomeRestaurante || "Restaurante"} 
            />
        </div>

        <div className="flex flex-col sm:flex-row justify-center items-center gap-4 pt-12 print:hidden">
            <button
                onClick={() => window.print()}
                className="h-14 px-10 rounded-full font-bold uppercase tracking-wider border border-border bg-card text-foreground hover:bg-muted transition-all flex items-center justify-center gap-3"
            >
                <BarChart3 className="w-5 h-5" />
                Exportar PDF
            </button>
            <button
                onClick={() => window.open('https://wa.me/556193788529', '_blank')}
                className="h-14 px-10 rounded-full font-bold uppercase tracking-wider bg-emerald-600 hover:bg-emerald-700 text-white transition-all flex items-center justify-center gap-3"
            >
                <MessageSquare className="w-5 h-5" />
                Falar com Especialista
            </button>
        </div>
      </div>
    </div>
  );
}
