import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { productId, size, color, material, price, stock, sku } = body;

    // Verificar se o produto existe
    const product = await prisma.product.findUnique({
      where: { id: parseInt(productId) }
    });

    if (!product) {
      return NextResponse.json({ error: 'Produto não encontrado' }, { status: 404 });
    }

    // Verificar se já existe uma variação padrão para este produto
    const existingVariation = await prisma.productVariation.findFirst({
      where: {
        productId: parseInt(productId),
        size: 'Padrão',
        color: 'Padrão',
        material: 'Padrão'
      }
    });

    if (existingVariation) {
      // Se já existe, retornar a variação existente
      return NextResponse.json(existingVariation);
    }

    // Criar nova variação
    const newVariation = await prisma.productVariation.create({
      data: {
        productId: parseInt(productId),
        size: size || 'Padrão',
        color: color || 'Padrão',
        material: material || 'Padrão',
        price: parseFloat(price) || parseFloat(product.basePrice.toString()),
        stock: parseInt(stock) || 10,
        sku: sku || `${productId}-default-${Date.now()}`,
        isActive: true
      }
    });

    return NextResponse.json(newVariation);
  } catch (error) {
    console.error('Erro ao criar variação:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}