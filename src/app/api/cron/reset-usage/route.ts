import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

/**
 * Endpoint de Cron para resetar cotas a cada 30 dias.
 * Deve ser agendado para rodar diariamente.
 */

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));

    // Busca usuários cujo ciclo começou há mais de 30 dias
    const usersSnapshot = await adminDb.collection('users')
      .where('usage.cycleStart', '<=', thirtyDaysAgo)
      .where('subscription.status', '==', 'active')
      .get();

    const batch = adminDb.batch();
    let count = 0;

    usersSnapshot.forEach(doc => {
      const userRef = doc.ref;
      batch.update(userRef, {
        'usage.reportsThisCycle': 0,
        'usage.pricingThisCycle': 0,
        'usage.cycleStart': FieldValue.serverTimestamp(),
        'updatedAt': FieldValue.serverTimestamp()
      });
      count++;
    });

    if (count > 0) {
      await batch.commit();
    }

    return NextResponse.json({ 
      success: true, 
      processed: count,
      message: `Reset de cotas concluído para ${count} usuários.` 
    });

  } catch (error: any) {
    console.error('Cron Reset Usage Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
