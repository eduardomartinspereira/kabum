import { NextResponse } from 'next/server';
import { prisma } from '../../lib/prisma';

export async function GET() {
  try {
    // Testar conexão com o banco
    const testQuery = await prisma.$queryRaw`SELECT 1 as test`;
    console.log('✅ Conexão com banco OK:', testQuery);

    // Testar criação de AccessLog
    const testAccessLog = await prisma.accessLog.create({
      data: {
        deviceType: 'UNKNOWN',
        userAgentRaw: 'Teste de conexão',
      },
    });
    console.log('✅ AccessLog criado com sucesso:', testAccessLog.id);

    // Limpar o teste
    await prisma.accessLog.delete({
      where: { id: testAccessLog.id },
    });
    console.log('✅ Teste limpo com sucesso');

    return NextResponse.json({ 
      success: true, 
      message: 'Banco de dados funcionando perfeitamente',
      testAccessLogId: testAccessLog.id 
    });
  } catch (error) {
    console.error('❌ Erro no teste do banco:', error);
    return NextResponse.json({ 
      success: false, 
      error: String(error) 
    }, { status: 500 });
  }
}
