import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const { email, password, firstName, lastName, cpf, phone } = await request.json();

    // Validações básicas
    if (!email || !password || !firstName || !lastName || !cpf || !phone) {
      return NextResponse.json(
        { error: 'Por favor, preencha todos os campos obrigatórios.' },
        { status: 400 }
      );
    }

    // Verificar se o email já existe
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'Este email já está cadastrado. Tente fazer login ou use outro email.' },
        { status: 400 }
      );
    }

    // Verificar se o CPF já existe
    const existingCpf = await prisma.user.findUnique({
      where: { cpf },
    });

    if (existingCpf) {
      return NextResponse.json(
        { error: 'Este CPF já está cadastrado. Verifique os dados ou entre em contato conosco.' },
        { status: 400 }
      );
    }

    // Criptografar a senha
    const hashedPassword = await bcrypt.hash(password, 10);

    // Criar usuário
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        firstName,
        lastName,
        cpf,
        phone,
        role: 'CUSTOMER',
      },
    });

    // Remover a senha da resposta
    const { password: _, ...userWithoutPassword } = user;

    return NextResponse.json(
      { 
        message: 'Conta criada com sucesso! Agora você pode fazer login.',
        user: userWithoutPassword 
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Erro ao cadastrar usuário:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
} 