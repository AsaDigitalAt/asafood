"use client";

import { useState } from "react";
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
  ArrowLeft,
  Bot,
  AlertTriangle,
  Sparkles,
} from "lucide-react";
import { useUser, useAuth } from "@/firebase";
import { ENDPOINTS } from "@/lib/endpoints";
import { ReportView, AnalysisReport } from "./report-view";

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
        <h2 className="text-2xl font-black tracking-tighter text-white mb-3 text-center">
          Analisando seu restaurante
        </h2>
        <p className="text-primary-foreground/70 text-sm leading-relaxed min-h-[40px] transition-all duration-500 text-center">
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

// ─── Main Page ───────────────────────────────────────────────────────────────

export function FreeAnalysisView({ onBack }: { onBack?: () => void }) {
  const [pageState, setPageState] = useState<PageState>("idle");
  const [report, setReport] = useState<AnalysisReport | null>(null);
  const [errorMsg, setErrorMsg] = useState<string>("");

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", phone: "", ifoodLink: "" },
  });

  const { user } = useUser();

  const onSubmit = async (values: FormValues) => {
    setPageState("loading");
    setErrorMsg("");

    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      
      if (user) {
        const token = await user.getIdToken();
        headers["Authorization"] = `Bearer ${token}`;
      }

      const response = await fetch(ENDPOINTS.analyzeGratuita, {
        method: "POST",
        headers,
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

  const handleReset = () => {
    setPageState("idle");
    setReport(null);
    setErrorMsg("");
    form.reset();
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (pageState === "loading") return <LoadingScreen />;
  if (pageState === "success" && report) return <ReportView report={report} onReset={handleReset} />;

  return (
    <div className="font-body min-h-screen">
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
            <div className="mb-6 p-4 rounded-2xl bg-white/10 border border-white/20 text-white/90 text-sm flex items-start gap-3 text-left">
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
