// app/lib/auth.ts
import bcrypt from 'bcryptjs';
import type { NextAuthOptions, User } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import { prisma } from '../lib/prisma';
import { saveAccessLog } from './prisma';

export const authOptions: NextAuthOptions = {
  session: { strategy: 'jwt' },
  secret: process.env.NEXTAUTH_SECRET,
  providers: [
    Credentials({
      name: 'Email e senha',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Senha', type: 'password' },
      },
      // ✅ Tipagem correta do retorno
      async authorize(credentials): Promise<User | null> {
        if (!credentials?.email || !credentials?.password) return null;

        const db = await prisma.user.findUnique({ where: { email: credentials.email } });
        if (!db?.password) return null;

        const ok = await bcrypt.compare(credentials.password, db.password);
        if (!ok) return null;

        // ✅ id como string, e campos extras permitidos via augmentation
        const authUser: User = {
          id: String(db.id),
          email: db.email,
          name: db.firstName ?? undefined,
          lastName: db.lastName ?? undefined,
          role: db.role, // 'CUSTOMER' | 'ADMIN' | etc.
        };

        return authUser;
      },
    }),

    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? '',
    }),
  ],

  callbacks: {
    async jwt({ token, user, account, profile }) {
      // Se logou agora (credentials ou google), garanta id/role
      if (user?.email) {
        const dbUser = await prisma.user.findUnique({ where: { email: user.email } });
        if (dbUser) {
          token.id = String(dbUser.id);
          token.role = dbUser.role; // string/union é compatível
          
          // Registrar o login no AccessLog
          console.log('🔐 Tentando registrar login no AccessLog para usuário:', dbUser.id);
          try {
            await saveAccessLog({
              userId: String(dbUser.id),
              deviceType: 'DESKTOP', // Tipo de dispositivo
              userAgentRaw: `NextAuth Login - Provider: ${account?.provider || 'credentials'}`,
              // Não passamos browser aqui, deixamos o sistema detectar automaticamente
            });
            console.log('✅ Login registrado com sucesso no AccessLog');
          } catch (error) {
            console.error('❌ Erro ao registrar login no AccessLog:', error);
          }
        }
      }

      // Access token do Google
      if (account?.provider === 'google' && account.access_token) {
        token.accessToken = account.access_token;
      }

      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id ?? '';
        session.user.role = token.role;
      }
      session.accessToken = token.accessToken;
      return session;
    },
  },
};
