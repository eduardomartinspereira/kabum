import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const products = await prisma.product.findMany({
      where: {
        isActive: true,
      },
      include: {
        category: true, // Incluir dados da categoria
        variations: {
          where: {
            isActive: true,
          },
        },
        images: {
          orderBy: {
            order: 'asc',
          },
        },
      },
    });

    // Transformar os dados para incluir informações da categoria e garantir preços
    const transformedProducts = products.map(product => ({
      ...product,
      category: product.category?.name || 'Geral', // Nome da categoria
      price: product.basePrice, // Usar basePrice como fallback
      // Garantir que sempre temos um preço válido
      variations: product.variations.map(variation => ({
        ...variation,
        price: Number(variation.price) || 0
      }))
    }));

    return NextResponse.json(transformedProducts);
  } catch (error) {
    console.error('Erro ao buscar produtos:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
} 