// app/api/pix-payment/route.ts
import { NextRequest, NextResponse } from 'next/server';
// caminho relativo a partir de app/api/pix-payment/route.ts -> /lib/mercadopago
import { mercadoPagoService } from '../../../lib/mercadopago';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({} as any));
    const { name, email, cpf, amount } = body || {};

    console.log('[PIX-API] ▶︎ recebendo', { name, email, cpf, amount });

    // --- Validações básicas ---
    if (!name || !email || !cpf || amount == null) {
      return NextResponse.json(
        { error: 'Todos os campos são obrigatórios (name, email, cpf, amount).' },
        { status: 400 }
      );
    }

    const cpfClean = String(cpf).replace(/\D/g, '');
    if (cpfClean.length !== 11) {
      return NextResponse.json({ error: 'CPF inválido.' }, { status: 400 });
    }

    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email));
    if (!emailOk) {
      return NextResponse.json({ error: 'E-mail inválido.' }, { status: 400 });
    }

    const value = Number(amount);
    if (!Number.isFinite(value) || value <= 0) {
      return NextResponse.json({ error: 'Valor (amount) inválido.' }, { status: 400 });
    }

    // --- Criação PIX ---
    console.log('[PIX-API] criando pagamento…');
    const pix = await mercadoPagoService.createPixPayment({
      name: String(name).trim(),
      email: String(email).trim().toLowerCase(),
      cpf: cpfClean,
      amount: value,
    });

    console.log('[PIX-API] ✅ criado', {
      id: pix.id,
      status: pix.status,
      hasQr: !!pix.qr_code,
      hasImg: !!pix.qr_code_base64,
      ref: pix.external_reference,
    });

    return NextResponse.json({ success: true, data: pix }, { status: 200 });
  } catch (err: any) {
    console.error('[PIX-API] ❌ erro', err);
    return NextResponse.json(
      { error: 'Erro interno do servidor', details: err?.message || String(err) },
      { status: 500 }
    );
  }
}
