import { ENDPOINTS } from "./endpoints";
import { authedPost } from "./authedFetch";

export async function createDiagnostic(body: Record<string, any>) {
  return authedPost(ENDPOINTS.createDiagnostic, body);
}

export async function processDiagnostic(diagnosticId: string) {
  return authedPost(ENDPOINTS.processDiagnostic, { diagnosticId });
}

export async function generatePlan(diagnosticId: string) {
  return authedPost(ENDPOINTS.generatePlan, { diagnosticId });
}

export async function runFullDiagnostic(body: Record<string, any>) {
  // 1) cria
  const created = await createDiagnostic(body);
  const diagnosticId = created.diagnosticId as string;

  // 2) processa imagem (extrai números)
  await processDiagnostic(diagnosticId);

  // 3) gera plano final
  const final = await generatePlan(diagnosticId);

  return { created, final };
}