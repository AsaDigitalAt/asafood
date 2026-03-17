
import { NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

/**
 * Webhook para integração com XGrow.
 * Mapeia os IDs de produto da XGrow para as configurações de plano do Asa Food.
 */

const PLAN_MAPPING: Record<string, any> = {
  '102562': { // Identificado no log como Plano Único
    plan: 'plano_unico',
    diagnosticsLimit: 1,
    pricingEnabled: false,
    pricingLimit: 0,
  },
  '102563': { // ID fictício para Plano Duplo (Ajustar se souber o real)
    plan: 'plano_duplo',
    diagnosticsLimit: 2,
    pricingEnabled: true,
    pricingLimit: 20,
  },
  '102564': { // ID fictício para Plano Acelerador (Ajustar se souber o real)
    plan: 'plano_acelerador',
    diagnosticsLimit: 4,
    pricingEnabled: true,
    pricingLimit: 100,
  }
};

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Mapeamento dos campos específicos enviados pela XGrow no payload de "Compra Aprovada"
    const email = body.subscriber_email;
    const name = body.subscriber_name;
    const planId = String(body.subscriber_plan_id);
    const eventType = body.event_type;
    const paymentStatus = body.payment_status;
    const subscriberId = body.subscriber_id;

    // Validação de segurança: se não houver email, não podemos prosseguir
    if (!email) {
      return NextResponse.json({ 
        ok: false, 
        error: "Email não enviado no payload. Verifique o campo 'subscriber_email'." 
      }, { status: 400 });
    }

    // Apenas processamos se o evento for de aprovação de pagamento
    const isApproved = eventType === 'onApprovePayment' || paymentStatus === 'paid';
    if (!isApproved) {
      return NextResponse.json({ ok: true, message: 'Evento ignorado (não é aprovação/pagamento)' }, { status: 200 });
    }

    // Busca a configuração do plano ou define o Acelerador como fallback
    const planConfig = PLAN_MAPPING[planId] || PLAN_MAPPING['102564'];

    let user;
    try {
      // Tenta encontrar o usuário existente
      user = await adminAuth.getUserByEmail(email);
    } catch (e: any) {
      if (e.code === 'auth/user-not-found') {
        // Cria novo usuário se não existir
        user = await adminAuth.createUser({
          email,
          displayName: name || email.split('@')[0],
          password: Math.random().toString(36).slice(-10), // Senha aleatória inicial
        });
      } else {
        throw e;
      }
    }

    const uid = user.uid;
    const userRef = adminDb.collection('users').doc(uid);

    // Prepara os dados do usuário seguindo a arquitetura multi-tenant e de cotas
    const userData = {
      email,
      name: name || email.split('@')[0],
      tenantId: uid, // Inicialmente cada usuário é seu próprio tenant
      plan: planConfig.plan,
      planStatus: 'active',
      subscriberId: subscriberId || null,
      pricingEnabled: planConfig.pricingEnabled,
      limits: {
        diagnosticsMonthly: planConfig.diagnosticsLimit,
        pricingMonthly: planConfig.pricingLimit,
      },
      usage: {
        reportsThisCycle: 0,
        pricingThisCycle: 0,
        cycleStart: FieldValue.serverTimestamp(),
      },
      lastPurchaseAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    };

    // Salva ou atualiza os dados no Firestore
    await userRef.set(userData, { merge: true });

    // Registra o evento de uso para auditoria
    await userRef.collection('usageEvents').add({
      action: 'subscription_confirmed',
      status: 'success',
      timestamp: FieldValue.serverTimestamp(),
      metadata: { 
        source: 'xgrow_webhook', 
        plan: planConfig.plan, 
        xgrowPlanId: planId 
      }
    });

    return NextResponse.json({ 
      ok: true, 
      message: 'Usuário processado com sucesso',
      uid: uid 
    });

  } catch (error: any) {
    console.error('XGrow Webhook Error:', error);
    return NextResponse.json({ 
      ok: false, 
      error: error.message 
    }, { status: 500 });
  }
}
