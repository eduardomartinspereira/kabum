// app/api/payments/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { mercadoPagoService } from '../../../lib/mercadopago'; // confirme o path

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await ctx.params; // ✅ agora aguardamos params

    if (!id) {
      return NextResponse.json(
        { error: 'ID do pagamento é obrigatório' },
        { status: 400 }
      );
    }

    const details = await mercadoPagoService.getPaymentDetails(id);

    return NextResponse.json(
      { success: true, data: details },
      { status: 200 }
    );
  } catch (error) {
    console.error('[PAYMENT-DETAILS-API] ❌ Erro ao buscar detalhes:', error);
    const message =
      error instanceof Error
        ? error.message
        : 'Erro ao buscar detalhes do pagamento';

    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
