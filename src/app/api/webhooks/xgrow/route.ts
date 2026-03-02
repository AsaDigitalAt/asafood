
import { NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

/**
 * Webhook para integração com XGrow.
 * Recebe notificações de venda e gerencia acesso dos usuários.
 */

// Mapeamento de Planos XGrow para Asa Food
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
    console.log('XGrow Webhook received:', body);

    const { 
      email, 
      name, 
      product_id, 
      plan_id, 
      status, 
      subscriber_id 
    } = body;

    // Apenas processamos vendas aprovadas ou completas
    if (status !== 'approved' && status !== 'completed' && status !== 'active') {
      return NextResponse.json({ message: 'Status ignored' }, { status: 200 });
    }

    const planConfig = PLAN_MAPPING[plan_id] || PLAN_MAPPING['plano_acelerador_id'];

    let user;
    try {
      // Tentar encontrar usuário existente por e-mail
      user = await adminAuth.getUserByEmail(email);
    } catch (e: any) {
      if (e.code === 'auth/user-not-found') {
        // Criar novo usuário no Authentication
        // Senha temporária ou link de reset pode ser enviado
        user = await adminAuth.createUser({
          email,
          displayName: name,
          password: Math.random().toString(36).slice(-10), // Senha aleatória inicial
        });
      } else {
        throw e;
      }
    }

    const uid = user.uid;
    const userRef = adminDb.collection('users').doc(uid);

    // Estrutura de documento robusta
    const userData = {
      email,
      name: name || email.split('@')[0],
      plan: planConfig.plan,
      planStatus: 'active',
      subscriberId: subscriber_id || null,
      productId: product_id || null,
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
      lastLoginAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    };

    // Criar ou atualizar o perfil no Firestore
    await userRef.set(userData, { merge: true });

    // Criar um evento de auditoria
    await userRef.collection('usageEvents').add({
      action: 'subscription_update',
      status: 'success',
      timestamp: FieldValue.serverTimestamp(),
      metadata: { 
        source: 'xgrow_webhook', 
        plan: planConfig.plan,
        originalStatus: status 
      }
    });

    return NextResponse.json({ 
      success: true, 
      uid, 
      message: 'Access granted/updated successfully' 
    });

  } catch (error: any) {
    console.error('Webhook Error:', error);
    return NextResponse.json({ 
      error: 'Internal Server Error', 
      details: error.message 
    }, { status: 500 });
  }
}
