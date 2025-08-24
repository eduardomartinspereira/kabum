// app/api/mercadopago/card/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { mercadoPagoService } from '../../../lib/mercadopago'

export const runtime = 'nodejs';

type CardBody = {
  token: string;
  issuer_id?: string;
  payment_method_id?: string;
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

    const amount = Number(body.amount);
    const paymentMethod = String(body.payment_method_id ?? 'credit_card');
    const externalReference = String(body.external_reference ?? `order_${Date.now()}`);

    const payerName = String(body.payer?.name ?? 'Nome não informado');
    const payerEmail = String(body.payer?.email ?? 'email@nao.informado');
    const payerCpf =
      String(body.payer?.identification?.number ?? '').replace(/\D/g, '') || 'CPF não informado';
    const payerDocType =
      (body.payer?.identification?.type as 'CPF' | 'CNPJ') ?? 'CPF';

    const issuer_id = body.issuer_id;
    const installments =
      body.installments !== undefined ? Number(body.installments) : 1;
    const description = body.description ?? 'Pagamento com cartão de crédito';

    const mpData = await mercadoPagoService.createCardPayment({
      token: String(body.token),
      issuer_id,
      payment_method_id: paymentMethod,
      installments,
      amount,
      description,
      external_reference: externalReference,
      payer: {
        email: payerEmail,
        identification: { type: payerDocType, number: payerCpf.replace(/\D/g, '') },
        name: payerName,
      },
    });

    return NextResponse.json({ ...mpData }, { status: 200 });
  } catch (e: any) {
    console.error('[CARD-API] ❌ Erro ao processar pagamento:', e);
    return NextResponse.json(
      { error: 'Erro ao processar pagamento', details: e?.message ?? 'Erro desconhecido' },
      { status: 500 }
    );
  }
}
