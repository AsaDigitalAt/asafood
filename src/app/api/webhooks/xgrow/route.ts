import { NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

/**
 * XGrow Webhook (robusto)
 * - Aceita payload com campos variando (payment_plans_id / subscriber_plan_id / payment_plans_name / product_name)
 * - Mapeia para o modelo definitivo do backend (users + tenants + billing_events)
 * - Idempotente quando existir ID do evento no payload
 */

// IDs baseados no payload real:
type PlanKey = 'plano_unico' | 'plano_duplo' | 'plano_acelerador';

const PLAN_MAPPING_BY_ID: Record<string, PlanKey> = {
  '102562': 'plano_unico',
  '102564': 'plano_duplo',
  '102566': 'plano_acelerador',
};

// Ajuste aqui o que cada plano libera (em sintonia com o backend)
function buildPlanState(plan: PlanKey) {
  if (plan === 'plano_unico') {
    return {
      plan,
      features: { diagnosticsEnabled: true, pricingEnabled: false },
      quota: { diagnosticsMax: 1, pricingMax: 0 },
    };
  }
  if (plan === 'plano_duplo') {
    return {
      plan,
      features: { diagnosticsEnabled: true, pricingEnabled: true },
      quota: { diagnosticsMax: 2, pricingMax: 20 },
    };
  }
  // plano_acelerador
  return {
    plan,
    features: { diagnosticsEnabled: true, pricingEnabled: true },
    quota: { diagnosticsMax: 4, pricingMax: 100 },
  };
}

// --------------------
// Helpers
// --------------------
function pickFirstString(...values: any[]) {
  for (const v of values) {
    if (typeof v === 'string' && v.trim()) return v.trim();
  }
  return '';
}

function normalizeText(s: any) {
  return String(s || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove acentos
    .replace(/\s+/g, ' ');
}

function inferPlanFromText(raw: string): PlanKey | null {
  const t = normalizeText(raw);
  if (!t) return null;

  if (t.includes('plano unico') || t.includes('unico')) return 'plano_unico';
  if (t.includes('plano duplo') || t.includes('duplo')) return 'plano_duplo';
  if (t.includes('plano acelerador') || t.includes('acelerador')) return 'plano_acelerador';

  return null;
}

function isApprovedEvent(body: any) {
  const eventType = normalizeText(body.event_type || body.event || body.eventType);
  const paymentStatus = normalizeText(body.payment_status || body.status || body.paymentStatus);

  const okByEvent =
    eventType === 'onapprovepayment' ||
    eventType === 'approvepayment' ||
    eventType.includes('approvepayment');

  const okByStatus = ['paid', 'approved', 'aprovado', 'pago'].includes(paymentStatus);

  return okByEvent || okByStatus;
}

function extractEmail(body: any) {
  return normalizeText(
    pickFirstString(
      body.subscriber_email,
      body.client_email,
      body.customer_email,
      body.email,
      body.ownerEmail
    )
  );
}

function extractPlanId(body: any) {
  const id = pickFirstString(
    String(body.payment_plans_id || ''),
    String(body.subscriber_plan_id || ''),
    String(body.subscriberPlanId || '')
  );
  return id || '';
}

function extractPlanName(body: any) {
  return pickFirstString(
    body.payment_plans_name,
    body.subscriber_plan_name,
    body.plan,
    body.plano
  );
}

function extractProductName(body: any) {
  return pickFirstString(body.product_name, body.productName, body.product);
}

function extractSubscriberId(body: any) {
  return pickFirstString(String(body.subscriber_id || ''), String(body.subscriberId || ''));
}

function extractCustomerName(body: any, email: string) {
  const raw = pickFirstString(
    body.client_fantasy_name,
    body.client_person,
    body.subscriber_name,
    body.name
  );
  if (raw) return raw;
  return email ? email.split('@')[0] : null;
}

function extractEventId(body: any) {
  const raw = pickFirstString(String(body.id || ''), String(body.event_id || ''), String(body.webhook_id || ''));
  return raw || '';
}

// --------------------
// Route
// --------------------
export async function POST(request: Request) {
  try {
    const body = await request.json();

    const email = extractEmail(body);
    const planId = extractPlanId(body);
    const planName = extractPlanName(body);
    const productName = extractProductName(body);
    const subscriberId = extractSubscriberId(body);
    const eventType = body.event_type || body.event || null;
    const paymentStatus = body.payment_status || body.status || null;
    const xgrowEventId = extractEventId(body);

    if (!email) {
      return NextResponse.json(
        { ok: false, error: "Email não enviado no payload." },
        { status: 400 }
      );
    }

    const planFromId = planId ? PLAN_MAPPING_BY_ID[planId] : undefined;
    const planFromName = planName ? inferPlanFromText(planName) : null;
    const planFromProduct = productName ? inferPlanFromText(productName) : null;

    const planKey: PlanKey | null = planFromId || planFromName || planFromProduct;

    if (!planKey) {
      return NextResponse.json(
        { ok: false, error: 'Plano não reconhecido.' },
        { status: 400 }
      );
    }

    const approved = isApprovedEvent(body);
    if (!approved) {
      return NextResponse.json({ ok: true, message: 'Evento ignorado (não aprovado).' }, { status: 200 });
    }

    // Idempotência
    if (xgrowEventId) {
      const dedupeRef = adminDb.collection('billing_events').doc(`xgrow_${xgrowEventId}`);
      const exists = await dedupeRef.get();
      if (exists.exists) {
         return NextResponse.json({ ok: true, message: 'Evento já processado.' });
      }
      await dedupeRef.set({
        source: 'xgrow',
        receivedAt: FieldValue.serverTimestamp(),
        email,
        planKey,
        rawPayload: body,
      });
    }

    // Auth
    let userRecord;
    try {
      userRecord = await adminAuth.getUserByEmail(email);
    } catch (e: any) {
      if (e.code === 'auth/user-not-found') {
        const displayName = extractCustomerName(body, email) || email.split('@')[0];
        userRecord = await adminAuth.createUser({
          email,
          displayName,
          password: Math.random().toString(36).slice(-10) + 'A1!',
        });
      } else {
        throw e;
      }
    }

    const uid = userRecord.uid;
    const userRef = adminDb.collection('users').doc(uid);
    const userSnap = await userRef.get();
    const existingUser = userSnap.exists ? userSnap.data() : null;

    const planState = buildPlanState(planKey);
    
    // Unificação da estrutura de uso: sempre reportsThisCycle e cycleStart
    const usage = existingUser?.usage?.cycleStart 
      ? {
          ...existingUser.usage,
          // Mantém o que já tem, reseta se necessário via cron
        }
      : {
          reportsThisCycle: 0,
          pricingThisCycle: 0,
          cycleStart: FieldValue.serverTimestamp(),
        };

    await userRef.set(
      {
        uid,
        tenantId: uid,
        email,
        plan: planState.plan,
        features: planState.features,
        quota: planState.quota,
        usage,
        subscription: {
          status: 'active',
          provider: 'xgrow',
          updatedAt: FieldValue.serverTimestamp(),
        },
        updatedAt: FieldValue.serverTimestamp(),
        createdAt: existingUser?.createdAt || FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    return NextResponse.json({ ok: true, uid, plan: planState.plan }, { status: 200 });
  } catch (error: any) {
    console.error('XGrow Webhook Error:', error);
    return NextResponse.json({ ok: false, error: error?.message }, { status: 500 });
  }
}
