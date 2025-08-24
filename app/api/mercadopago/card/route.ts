// app/api/mercadopago/card/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { mercadoPagoService } from '../../../lib/mercadopago';

export const runtime = 'nodejs';

type CardBody = {
  token: string;
  issuer_id?: string;              // recebido do Brick, mas NÃO será enviado ao MP
  payment_method_id?: string;      // idem
  installments?: number | string;
  amount: number | string;
  description?: string;
  external_reference?: string;
  payer?: {
    name?: string;
    email?: string;
    identification?: { type?: 'CPF' | 'CNPJ' | string; number?: string };
  };
};

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as CardBody;

    // === validações básicas ===
    const token = String(body.token || '').trim();
    if (!token) {
      return NextResponse.json(
        { error: 'Token do cartão ausente' },
        { status: 400 }
      );
    }

    const amount = Number(body.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json(
        { error: 'Valor (amount) inválido' },
        { status: 400 }
      );
    }

    const externalReference = String(
      body.external_reference ?? `order_${Date.now()}`
    );

    // normalização do pagador
    const payerName = String(body.payer?.name || '').trim() || 'Nome não informado';
    const payerEmail =
      String(body.payer?.email || '').trim() || 'email@nao.informado';

    const rawDoc = String(body.payer?.identification?.number || '').replace(/\D/g, '');
    const payerCpfCnpj = rawDoc || 'CPF não informado';

    const rawType = String(body.payer?.identification?.type || 'CPF').toUpperCase();
    const payerDocType = rawType === 'CNPJ' ? 'CNPJ' : 'CPF';

    const installments =
      body.installments !== undefined ? Number(body.installments) : 1;

    const description = body.description ?? 'Pagamento com cartão de crédito';

    // === Chamada ao serviço MP (sem issuer_id e sem payment_method_id) ===
    const mpData = await mercadoPagoService.createCardPayment({
      token,
      // issuer_id e payment_method_id são intencionalmente OMITIDOS
      installments,
      amount,
      description,
      external_reference: externalReference,
      payer: {
        email: payerEmail,
        identification: { type: payerDocType, number: payerCpfCnpj },
        name: payerName,
      },
    });

    // retorna o objeto do MP (id, status, etc.)
    return NextResponse.json(mpData, { status: 200 });
  } catch (e: any) {
    console.error('[CARD-API] ❌ Erro ao processar pagamento:', e);
    return NextResponse.json(
      {
        error: 'Erro ao processar pagamento',
        details: e?.message ?? 'Erro desconhecido',
      },
      { status: 500 }
    );
  }
}
