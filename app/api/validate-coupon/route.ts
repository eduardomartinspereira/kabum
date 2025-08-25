import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { code, amount, productId } = body;

    if (!code) {
      return NextResponse.json({ error: 'Código do cupom é obrigatório' }, { status: 400 });
    }

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: 'Valor da compra é obrigatório' }, { status: 400 });
    }

    // Buscar cupom no banco
    const coupon = await prisma.coupon.findUnique({
      where: { code: code.toUpperCase() }
    });

    if (!coupon) {
      return NextResponse.json({ error: 'Cupom não encontrado' }, { status: 404 });
    }

    // Verificar se o cupom está ativo
    if (!coupon.isActive) {
      return NextResponse.json({ error: 'Cupom inativo' }, { status: 400 });
    }

    // Verificar valor mínimo (se aplicável)
    if (coupon.startAmount > 0 && amount < coupon.startAmount) {
      return NextResponse.json({ 
        error: `Valor mínimo para este cupom é R$ ${coupon.startAmount.toFixed(2)}` 
      }, { status: 400 });
    }

    // Verificar se é específico para um produto
    if (coupon.productId && productId && coupon.productId !== parseInt(productId)) {
      return NextResponse.json({ 
        error: 'Este cupom não é válido para este produto' 
      }, { status: 400 });
    }

    // Verificar quantidade de usos disponíveis
    if (coupon.maxUses > 0 && coupon.availableAmount <= 0) {
      return NextResponse.json({ error: 'Cupom esgotado' }, { status: 400 });
    }

    // Calcular desconto
    let discountAmount = 0;
    if (coupon.discountType === 'PERCENTAGE') {
      discountAmount = (amount * coupon.discount) / 100;
    } else if (coupon.discountType === 'FIXED') {
      discountAmount = coupon.discount;
    }

    // Garantir que o desconto não seja maior que o valor total
    discountAmount = Math.min(discountAmount, amount);

    const finalAmount = amount - discountAmount;

    return NextResponse.json({
      valid: true,
      coupon: {
        id: coupon.id,
        code: coupon.code,
        discount: coupon.discount,
        discountType: coupon.discountType,
      },
      originalAmount: amount,
      discountAmount: discountAmount,
      finalAmount: finalAmount,
    });

  } catch (error) {
    console.error('Erro ao validar cupom:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}