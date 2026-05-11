'use server';

/**
 * @fileOverview Mantém apenas as definições de tipo para compatibilidade com o resto do app.
 * A lógica de processamento foi movida para o cliente (DiagnosisView) seguindo a nova arquitetura.
 */

export type FormState = {
  id?: string;
  nome: string;
  statusGeral: string;
  conversions: any;
  discounts: any;
  problems: any[];
  actions: any[];
  priorities: string[];
  aiGeneratedPlan: string | null;
  error?: string;
};

// Esta função não é mais utilizada pela UI, mas mantida como stub para evitar quebras de importação imediatas.
export async function generateDiagnosis(formData: FormData): Promise<FormState> {
  return { 
    error: "Este endpoint foi desativado em favor da nova arquitetura de DiagnosticFlow.", 
    nome: '', 
    statusGeral: '', 
    conversions: {}, 
    discounts: {}, 
    problems: [], 
    actions: [], 
    priorities: [], 
    aiGeneratedPlan: null 
  };
}
