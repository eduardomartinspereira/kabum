// app/api/products/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

// Reutiliza o Prisma em dev para evitar múltiplas conexões
const prisma =
  (globalThis as any).prisma ||
  new PrismaClient({ log: process.env.NODE_ENV === 'development' ? ['error'] : [] });
if (process.env.NODE_ENV !== 'production') (globalThis as any).prisma = prisma;

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params; // <-- Next.js 15: aguarde o params
    const productId = Number(id);

    if (!Number.isFinite(productId)) {
      return NextResponse.json({ error: 'ID do produto inválido' }, { status: 400 });
    }

    const product = await prisma.product.findFirst({
      where: {
        id: productId,
        isActive: true,
      },
      include: {
        variations: {
          where: { isActive: true },
        },
        images: {
          orderBy: { order: 'asc' },
        },
      },
    });

    if (!product) {
      return NextResponse.json({ error: 'Produto não encontrado' }, { status: 404 });
    }

    return NextResponse.json(product, {
      status: 200,
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch (error) {
    console.error('[products/:id] GET error:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
