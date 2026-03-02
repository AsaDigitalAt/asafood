
import { NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

/**
 * Webhook para integração com XGrow.
 * URL para configurar na XGrow: https://<seu-dominio>/api/webhooks/xgrow
 */

const PLAN_MAPPING: Record<string, any> = {
  'plano_unico_id': {
    plan: 'plano_unico',
    diagnosticsLimit: 1,
    pricingEnabled: false,
    pricingLimit: 0,
  },
  'plano_duplo_id': {
    plan: 'plano_duplo',
    diagnosticsLimit: 2,
    pricingEnabled: true,
    pricingLimit: 20,
  },
  'plano_acelerador_id': {
    plan: 'plano_acelerador',
    diagnosticsLimit: 4,
    pricingEnabled: true,
    pricingLimit: 100,
  }
};

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { 
      email, 
      name, 
      plan_id, 
      status, 
      subscriber_id 
    } = body;

    // Apenas processamos vendas aprovadas ou ativas
    if (!['approved', 'completed', 'active'].includes(status)) {
      return NextResponse.json({ message: 'Status ignored' }, { status: 200 });
    }

    const planConfig = PLAN_MAPPING[plan_id] || PLAN_MAPPING['plano_acelerador_id'];

    let user;
    try {
      user = await adminAuth.getUserByEmail(email);
    } catch (e: any) {
      if (e.code === 'auth/user-not-found') {
        user = await adminAuth.createUser({
          email,
          displayName: name,
          password: Math.random().toString(36).slice(-10),
        });
      } else {
        throw e;
      }
    }

    const uid = user.uid;
    const userRef = adminDb.collection('users').doc(uid);

    const userData = {
      email,
      name: name || email.split('@')[0],
      plan: planConfig.plan,
      planStatus: 'active',
      subscriberId: subscriber_id || null,
      pricingEnabled: planConfig.pricingEnabled,
      limits: {
        diagnosticsMonthly: planConfig.diagnosticsLimit,
        pricingMonthly: planConfig.pricingLimit,
      },
      usage: {
        reportsThisCycle: 0,
        pricingThisCycle: 0,
        cycleStart: FieldValue.serverTimestamp(), // Inicia o ciclo de 30 dias
      },
      lastPurchaseAt: FieldValue.serverTimestamp(), // Registra a última confirmação
      lastLoginAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    };

    await userRef.set(userData, { merge: true });

    await userRef.collection('usageEvents').add({
      action: 'subscription_confirmed',
      status: 'success',
      timestamp: FieldValue.serverTimestamp(),
      metadata: { source: 'xgrow_webhook', plan: planConfig.plan }
    });

    return NextResponse.json({ success: true, uid });

  } catch (error: any) {
    console.error('XGrow Webhook Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
