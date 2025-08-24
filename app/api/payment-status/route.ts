import { NextRequest, NextResponse } from 'next/server';
import { mercadoPagoService } from '../../lib/mercadopago';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const paymentId = searchParams.get('paymentId');

    if (!paymentId) {
      return NextResponse.json(
        { error: 'Payment ID é obrigatório' },
        { status: 400 }
      );
    }

    // Verificar status no Mercado Pago
    const status = await mercadoPagoService.getPaymentStatus(paymentId);

    return NextResponse.json({
      success: true,
      paymentId,
      status,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('[PAYMENT-STATUS-API] erro:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: error?.message || 'Erro interno do servidor',
      },
      { status: 500 }
    );
  }
}
