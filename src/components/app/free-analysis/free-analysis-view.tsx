"use client";

import { useState } from "react";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Loader2,
  ArrowRight,
  ArrowLeft,
  TrendingUp,
  Eye,
  Filter,
  Send,
  Bot,
  BarChart3,
  Star,
  Calculator,
  BookOpenCheck,
  ShieldCheck,
  Zap,
  CheckCheck,
  CheckCircle2,
  AlertTriangle,
  ChevronUp,
  Sparkles,
  RefreshCw,
  Trophy,
  Target,
  MessageSquare,
  UtensilsCrossed,
  User,
} from "lucide-react";
import { ENDPOINTS } from "@/lib/endpoints";

// ─── Schema ─────────────────────────────────────────────────────────────────

const schema = z.object({
  name: z.string().min(2, "Por favor, insira seu nome completo."),
  phone: z
    .string()
    .min(10, "Por favor, insira um telefone válido.")
    .regex(
      /^\(?\d{2}\)?\s?\d{4,5}-?\d{4}$/,
      "Formato inválido. Ex: (11) 91234-5678"
    ),
  ifoodLink: z
    .string()
    .url("Por favor, insira uma URL válida.")
    .refine(
      (val) => val.includes("ifood.com.br"),
      "O link deve ser do domínio ifood.com.br"
    ),
});

type FormValues = z.infer<typeof schema>;
type PageState = "idle" | "loading" | "success" | "error";

interface AnalysisReport {
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

function formatPhone(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 2) return `(${digits}`;
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10)
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

// ─── Loading Screen ──────────────────────────────────────────────────────────

const loadingMessages = [
  "Acessando o seu perfil no iFood...",
  "Coletando dados do cardápio...",
  "Lendo as avaliações dos clientes...",
  "Cruzando métricas de performance...",
  "Nossa IA está analisando os dados...",
  "Identificando oportunidades de melhoria...",
  "Preparando seu relatório personalizado...",
];

function LoadingScreen() {
  const [msgIdx, setMsgIdx] = useState(0);

  useState(() => {
    const interval = setInterval(() => {
      setMsgIdx((i) => (i + 1) % loadingMessages.length);
    }, 2200);
    return () => clearInterval(interval);
  });

  return (
    <div className="min-h-screen flex flex-col justify-center items-center p-6 bg-primary text-primary-foreground">
      <div className="w-full max-w-sm text-center">
        <div className="relative w-20 h-20 mx-auto mb-8">
          <div className="absolute inset-0 rounded-full border-4 border-white/20 animate-spin border-t-white" />
          <div className="absolute inset-3 rounded-full bg-white/10 flex items-center justify-center">
            <Bot className="w-6 h-6 text-white" />
          </div>
        </div>
        <h2 className="text-2xl font-black tracking-tighter text-white mb-3">
          Analisando seu restaurante
        </h2>
        <p className="text-primary-foreground/70 text-sm leading-relaxed min-h-[40px] transition-all duration-500">
          {loadingMessages[msgIdx]}
        </p>
        <div className="flex justify-center gap-1.5 mt-6">
          {loadingMessages.map((_, i) => (
            <div
              key={i}
              className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                i === msgIdx ? "bg-white scale-125" : "bg-white/30"
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Report View ─────────────────────────────────────────────────────────────

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

function ReportView({ report, onReset }: { report: AnalysisReport; onReset: () => void }) {
  const nota = report.avaliacaoGeral?.nota;
  const notaColor =
    nota == null ? "text-white/60" :
    nota >= 8 ? "text-emerald-400" :
    nota >= 6 ? "text-amber-400" : "text-red-400";

  return (
    <div className="min-h-screen bg-background font-body">
      {/* Hero do relatório */}
      <div className="bg-primary px-6 py-16 text-center">
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
        {report.proximosPassos && (
          <div className="bg-primary rounded-3xl p-8 text-center text-primary-foreground">
            <Trophy className="w-10 h-10 mx-auto mb-4 text-white/80" />
            <h2 className="text-2xl font-black tracking-tighter text-white mb-3">Sua próxima ação (hoje)</h2>
            <p className="text-primary-foreground/80 leading-relaxed max-w-xl mx-auto mb-7">
              {report.proximosPassos}
            </p>
            <button
              onClick={onReset}
              className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-primary-foreground text-primary font-bold uppercase tracking-widest text-sm hover:bg-primary-foreground/90 transition-all duration-300 hover:scale-[1.02]"
            >
              <RefreshCw className="w-4 h-4" />
              Analisar outro restaurante
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export function FreeAnalysisView({ onBack }: { onBack?: () => void }) {
  const [pageState, setPageState] = useState<PageState>("idle");
  const [report, setReport] = useState<AnalysisReport | null>(null);
  const [errorMsg, setErrorMsg] = useState<string>("");

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", phone: "", ifoodLink: "" },
  });

  const onSubmit = async (values: FormValues) => {
    setPageState("loading");
    setErrorMsg("");

    try {
      const response = await fetch(ENDPOINTS.analyzeGratuita, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      const data = await response.json();

      if (!response.ok || !data.ok) {
        throw new Error(data.error || "Erro ao processar sua análise.");
      }

      setReport(data.report);
      setPageState("success");
    } catch (err: any) {
      console.error("analyzeGratuita error:", err);
      setErrorMsg(err.message || "Ocorreu um erro inesperado. Tente novamente.");
      setPageState("error");
    }
  };

  const scrollToForm = () => {
    document.getElementById("formulario")?.scrollIntoView({ behavior: "smooth" });
  };

  const handleReset = () => {
    setPageState("idle");
    setReport(null);
    setErrorMsg("");
    form.reset();
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // States que substituem a página toda
  if (pageState === "loading") return <LoadingScreen />;
  if (pageState === "success" && report) return <ReportView report={report} onReset={handleReset} />;

  return (
    <div className="font-body min-h-screen">
      {/* ─── SEÇÃO 2: FORMULÁRIO ───────────────────────────────────────────── */}
      <section
        id="formulario"
        className="flex flex-col items-center px-6 pb-24 pt-32 bg-primary text-primary-foreground"
      >
        <div className="w-full max-w-md">
          <div className="flex items-start mb-10">
            {onBack && (
              <button
                onClick={onBack}
                className="flex items-center justify-center w-12 h-12 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors border border-white/20 shrink-0 mr-6 mt-10"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}
            <div className="flex flex-col items-start text-left">
              <div className="px-4 py-1.5 rounded-full bg-white/10 border border-white/20 text-white/90 text-[10px] font-bold uppercase tracking-[0.2em] mb-4">
                Análise Geral
              </div>
              <h2 className="text-3xl md:text-4xl font-black tracking-tighter text-white leading-none mb-3">
                Descubra o potencial do seu restaurante
              </h2>
              <p className="text-primary-foreground/70 text-sm leading-relaxed">
                Preencha os campos abaixo e receba uma análise personalizada do
                seu perfil no iFood, sem custos e sem compromisso.
              </p>
            </div>
          </div>

          {pageState === "error" && (
            <div className="mb-6 p-4 rounded-2xl bg-white/10 border border-white/20 text-white/90 text-sm flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5 text-yellow-300" />
              <span>{errorMsg}</span>
            </div>
          )}

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5 text-left">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="ml-4 uppercase text-xs tracking-widest font-bold">
                      Nome completo
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="text"
                        placeholder="João Silva"
                        className="bg-white/10 border-primary-foreground/20 text-primary-foreground placeholder:text-primary-foreground/50 rounded-full py-6 px-7 text-base focus:bg-white/20 focus:ring-1 focus:ring-primary-foreground focus:border-transparent"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className="ml-4 text-primary-foreground/80" />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="ml-4 uppercase text-xs tracking-widest font-bold">
                      Número de telefone
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="tel"
                        placeholder="(11) 91234-5678"
                        className="bg-white/10 border-primary-foreground/20 text-primary-foreground placeholder:text-primary-foreground/50 rounded-full py-6 px-7 text-base focus:bg-white/20 focus:ring-1 focus:ring-primary-foreground focus:border-transparent"
                        {...field}
                        onChange={(e) => field.onChange(formatPhone(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage className="ml-4 text-primary-foreground/80" />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="ifoodLink"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="ml-4 uppercase text-xs tracking-widest font-bold">
                      Link do restaurante no iFood
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="url"
                        placeholder="https://www.ifood.com.br/delivery/..."
                        className="bg-white/10 border-primary-foreground/20 text-primary-foreground placeholder:text-primary-foreground/50 rounded-full py-6 px-7 text-base focus:bg-white/20 focus:ring-1 focus:ring-primary-foreground focus:border-transparent"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className="ml-4 text-primary-foreground/80" />
                  </FormItem>
                )}
              />
              <div className="pt-4">
                <Button
                  type="submit"
                  className="w-full h-16 rounded-full bg-primary-foreground hover:bg-primary-foreground/90 text-primary text-base font-bold uppercase tracking-widest transition-all duration-300 hover:scale-[1.02]"
                  disabled={pageState === "loading"}
                >
                  {pageState === "loading" ? (
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  ) : (
                    "Quero minha análise geral"
                  )}
                </Button>
              </div>
            </form>
          </Form>

          <p className="text-center text-primary-foreground/40 text-xs mt-6 leading-relaxed">
            Seus dados são confidenciais e não serão compartilhados com terceiros.
          </p>
        </div>
      </section>


    </div>
  );
}
