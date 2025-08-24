/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import { mercadoPagoService } from '../../lib/mercadopago';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, cpf, amount } = body;

    // validações simples
    if (!name || !email || !cpf || amount === undefined || amount === null) {
      return NextResponse.json(
        { success: false, error: 'Todos os campos são obrigatórios' },
        { status: 400 }
      );
    }
    const cpfClean = String(cpf).replace(/\D/g, '');
    if (cpfClean.length !== 11) {
      return NextResponse.json(
        { success: false, error: 'CPF inválido' },
        { status: 400 }
      );
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email))) {
      return NextResponse.json(
        { success: false, error: 'Email inválido' },
        { status: 400 }
      );
    }

    // cria o PIX
    const pix = await mercadoPagoService.createPixPayment({
      name: String(name),
      email: String(email),
      cpf: cpfClean,
      amount: Number(amount),
    });

    // *** SEMPRE este shape ***
    return NextResponse.json({ success: true, data: pix }, { status: 200 });
  } catch (err: any) {
    console.error('[PIX-API] erro ao criar PIX:', err);
    return NextResponse.json(
      {
        success: false,
        error: 'Erro interno do servidor',
        details: err?.message || 'unknown',
      },
      { status: 500 }
    );
  }
}
