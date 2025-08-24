// app/api/webhook/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { mercadoPagoService } from '@/lib/mercadopago';
import { sendPaymentConfirmationEmail } from '@/lib/mailer';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function pickBuyerEmail(details: any): string | undefined {
  const e =
    details?.metadata?.buyer_email ||
    details?.additional_info?.payer?.email ||
    details?.payer?.email;
  if (!e) return;
  const ee = String(e).trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(ee)) return;
  if (ee.endsWith('@example.com')) return;
  return ee;
}
function pickName(details: any): string | undefined {
  const n =
    [details?.payer?.first_name, details?.payer?.last_name].filter(Boolean).join(' ').trim() ||
    details?.metadata?.customer_name ||
    undefined;
  return n;
}
function pickItems(details: any) {
  const arr = Array.isArray(details?.additional_info?.items)
    ? details.additional_info.items
    : [];
  return arr.map((it: any) => ({
    title: it.title,
    quantity: Number(it.quantity || 1),
    unit_price: Number(it.unit_price || it.unitPrice || 0),
  }));
}

export async function POST(req: NextRequest) {
  let body: any = null;
  try { body = await req.json(); } catch { body = null; }

  const url = new URL(req.url);
  const type =
    body?.type ||
    body?.action ||
    url.searchParams.get('type') ||
    url.searchParams.get('topic') ||
    url.searchParams.get('action') ||
    '';

  const paymentId =
    body?.data?.id ||
    url.searchParams.get('data.id') ||
    url.searchParams.get('id') ||
    null;

  const isPayment = (typeof type === 'string' && type.includes('payment')) || !!paymentId;
  if (!isPayment) return NextResponse.json({ ok: true, message: 'ignorado' }, { status: 200 });
  if (!paymentId) return NextResponse.json({ ok: false, message: 'paymentId ausente' }, { status: 200 });

  // backoff leve (propagação do MP)
  let details: any = null;
  for (let i = 1; i <= 3; i++) {
    try {
      details = await mercadoPagoService.getPaymentDetails(paymentId);
      if (details) break;
    } catch (err) {
      if (i < 3) await sleep(300 * i);
    }
  }
  if (!details) return NextResponse.json({ ok: false, message: 'sem detalhes' }, { status: 200 });

  console.log('[WEBHOOK]', { id: details.id, status: details.status });

  if (details.status === 'approved') {
    try {
      const to = pickBuyerEmail(details);
      const name = pickName(details);
      const orderId =
        details?.external_reference || details?.metadata?.order_id || String(details.id);
      const items = pickItems(details);
      const amount = Number(details?.transaction_amount || 0);
      const receiptUrl =
        details?.point_of_interaction?.transaction_data?.ticket_url ?? undefined;

      if (to) {
        await sendPaymentConfirmationEmail({
          to,
          name,
          orderId,
          amount,
          items,
          receiptUrl,
        });
        console.log('[WEBHOOK] e-mail enviado para', to);
      } else {
        console.log('[WEBHOOK] e-mail do comprador não encontrado; skip.');
      }
    } catch (e) {
      console.error('[WEBHOOK] erro ao enviar e-mail:', e);
    }
  }

  return NextResponse.json(
    {
      ok: true,
      paymentId,
      status: details.status,
      external_reference: details.external_reference,
      processed_at: new Date().toISOString(),
    },
    { status: 200 }
  );
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  return NextResponse.json({
    status: 'ok',
    ts: new Date().toISOString(),
    echo: Object.fromEntries(searchParams.entries()),
  });
}
