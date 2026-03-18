import type { FormState } from "@/app/actions/generate-diagnosis";

/**
 * Converte o plano v3 (schema backend generateDiagnosticPlan)
 * para o FormState consumido pelos componentes do Dashboard.
 * Usado tanto em diagnosis-view.tsx (resultado ao vivo)
 * quanto em action-plan-list.tsx (histórico do Firestore).
 */

function mapMetric(avItem: any, meta: number) {
  return {
    percentual: avItem?.percentualRecebido ?? 0,
    status: avItem?.classe ?? null,        // 'bom' | 'atencao' | 'critico'
    referencia_minima: avItem?.meta ?? meta,
    comentario: avItem?.comentario ?? "",
  };
}

function getTendencia(delta: number | null | undefined): string {
  if (delta === null || delta === undefined) return "Estável";
  if (delta > 0) return "Alta";
  if (delta < 0) return "Queda";
  return "Estável";
}

export function mapSaudeGeral(saudeGeral?: string): string {
  if (saudeGeral === "saudavel") return "Saudável";
  if (saudeGeral === "misto") return "Misto (Atenção)";
  if (saudeGeral === "critico") return "Crítico";
  return "Análise Concluída";
}

/**
 * @param plan   - objeto `plan` retornado pelo backend (schema diagnostico_v3)
 * @param nome   - nome do restaurante (vem do formulário ou do Firestore input.restaurantName)
 */
export function mapPlanV3ToFormState(plan: any, nome: string): FormState {
  const av   = plan?.funilVendas?.avaliacao ?? {};
  const desc = plan?.analiseDescontos       ?? {};

  return {
    nome,

    statusGeral: mapSaudeGeral(plan?.funilVendas?.saudeGeral),

    // FunnelMetrics: { view, cart, review, done }
    conversions: {
      view:   mapMetric(av.visitas_para_visualizacoes, 50),
      cart:   mapMetric(av.visitas_para_sacola,        25),
      review: mapMetric(av.visitas_para_revisao,       25),
      done:   mapMetric(av.visitas_para_concluidos,    12),
    },

    // DiscountAnalysis: { mes_atual, mes_anterior, comparativo }
    discounts: desc.atual
      ? {
          mes_atual:    { percentual_descontos: desc.atual?.percentualDescontos,    classificacao: desc.atual?.classe },
          mes_anterior: { percentual_descontos: desc.anterior?.percentualDescontos, classificacao: desc.anterior?.classe },
          comparativo:  { tendencia: getTendencia(desc.evolucao?.deltaPontosPercentuais), analise: desc.evolucao?.leitura ?? "" },
        }
      : {},

    // ProblemsList: [{ descricao, etapa, impacto }]
    problems: (plan?.pontosCriticosIdentificados ?? []).map((p: any) => ({
      descricao: p.porQue || p.titulo || "",
      etapa:     p.etapa  ?? "",
      impacto:   p.classe ?? "",
    })),

    // PrioritiesList: string[]
    priorities: (plan?.prioridadesParaHoje ?? []).map((p: any) => p.titulo ?? ""),

    // ActionChecklist: [{ descricao, prioridade, categoria }]
    actions: (plan?.planoDeAcaoCompleto ?? []).map((a: any) => ({
      descricao:  a.titulo || "",
      prioridade: a.prioridade ?? "",
      categoria:  a.gargaloRelacionado ?? "",
    })),

    aiGeneratedPlan: null,
  };
}
