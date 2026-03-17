
import { NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

/**
 * Webhook para integração com XGrow.
 * Mapeia os IDs de produto da XGrow para as configurações de plano do Asa Food.
 * IDs baseados no payload real: 102562 (Único), 102564 (Duplo), 102566 (Acelerador)
 */

const PLAN_MAPPING: Record<string, any> = {
  '102562': {
    plan: 'plano_unico',
    diagnosticsLimit: 1,
    pricingEnabled: false,
    pricingLimit: 0,
  },
  '102564': {
    plan: 'plano_duplo',
    diagnosticsLimit: 2,
    pricingEnabled: true,
    pricingLimit: 20,
  },
  '102566': {
    plan: 'plano_acelerador',
    diagnosticsLimit: 4,
    pricingEnabled: true,
    pricingLimit: 100,
  }
};

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Extração baseada no payload real da XGrow (visto no print)
    const email = body.subscriber_email;
    const name = body.subscriber_name;
    const planId = String(body.subscriber_plan_id);
    const eventType = body.event_type;
    const paymentStatus = body.payment_status;
    const subscriberId = body.subscriber_id;

    // Log para depuração em ambiente de desenvolvimento (opcional)
    console.log('XGrow Webhook Received:', { email, planId, eventType, paymentStatus });

    if (!email) {
      return NextResponse.json({ 
        ok: false, 
        error: "Email não enviado no payload. Verifique o campo 'subscriber_email'." 
      }, { status: 400 });
    }

    // Validação do Plano
    const planConfig = PLAN_MAPPING[planId];
    if (!planConfig) {
      return NextResponse.json({ 
        ok: false, 
        error: "Plano inválido ou não reconhecido.",
        receivedPlanId: planId 
      }, { status: 400 });
    }

    // Apenas processamos se o evento for de aprovação de pagamento ou status pago
    const isApproved = eventType === 'onApprovePayment' || paymentStatus === 'paid' || paymentStatus === 'approved';
    if (!isApproved) {
      return NextResponse.json({ ok: true, message: 'Evento ignorado (não é uma aprovação definitiva)' }, { status: 200 });
    }

    let user;
    try {
      // Tenta encontrar o usuário existente
      user = await adminAuth.getUserByEmail(email);
    } catch (e: any) {
      if (e.code === 'auth/user-not-found') {
        // Cria novo usuário se não existir. Senha padrão é gerada mas o usuário pode resetar.
        user = await adminAuth.createUser({
          email,
          displayName: name || email.split('@')[0],
          password: Math.random().toString(36).slice(-10) + 'A1!', 
        });
      } else {
        throw e;
      }
    }

    const uid = user.uid;
    const userRef = adminDb.collection('users').doc(uid);

    // Estrutura de dados seguindo a arquitetura multi-tenant e de cotas
    const userData = {
      email,
      name: name || email.split('@')[0],
      tenantId: uid, // Por padrão, o tenantId é o próprio UID para novos usuários
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

    // Salva ou atualiza os dados no Firestore de forma definitiva
    await userRef.set(userData, { merge: true });

    // Registro de Auditoria
    await userRef.collection('usageEvents').add({
      action: 'subscription_confirmed',
      status: 'success',
      timestamp: FieldValue.serverTimestamp(),
      metadata: { 
        source: 'xgrow_webhook', 
        plan: planConfig.plan, 
        xgrowPlanId: planId,
        subscriberId: subscriberId
      }
    });

    return NextResponse.json({ 
      ok: true, 
      message: 'Usuário processado com sucesso',
      uid: uid,
      plan: planConfig.plan
    });

  } catch (error: any) {
    console.error('XGrow Webhook Error:', error);
    return NextResponse.json({ 
      ok: false, 
      error: error.message 
    }, { status: 500 });
  }
}
