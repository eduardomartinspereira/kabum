/* eslint-disable  @typescript-eslint/no-explicit-any */
import bcrypt from 'bcryptjs';
import NextAuth, { type NextAuthOptions } from 'next-auth';
import type { User as NextAuthUser } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import { prisma } from '../../../lib/prisma';

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
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await prisma.user.findUnique({ where: { email: credentials.email } });
        if (!user?.password) return null;

        const ok = await bcrypt.compare(credentials.password, user.password);
        if (!ok) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.firstName ?? undefined,
          lastName: user.lastName ?? undefined,
          role: user.role,
        } as unknown as NextAuthUser;
      },
    }),

    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      
    }),
  ],

  callbacks: {
    async jwt({ token, user, account, profile }) {
      if (user && account?.provider !== 'google') {
        const u = user as any;
        (token).id = u.id ?? (token).id;
        (token as any).role = u.role ?? (token).role;
      }
  
      if (account?.provider === 'google') {
        const email =
          user?.email ??
          (profile && typeof profile === 'object' ? (profile).email : undefined);
  
        if (email) {
          const sub = account.providerAccountId;
          const given =
            (profile as any)?.given_name ??
            user?.name?.split(' ')?.[0] ??
            '';
          const family =
            (profile as any)?.family_name ??
            user?.name?.split(' ')?.slice(1).join(' ') ??
            '';
  
          const dbUser = await prisma.user.upsert({
            where: { email },
            update: {
              firstName: given || undefined,
              lastName: family || undefined,
            },
            create: {
              email,
              cpf: `google:${sub}`,
              password: await bcrypt.hash(`google:${sub}:${email}`, 10),
              firstName: given || '',
              lastName: family || '',
              phone: '',
              role: 'CUSTOMER',
            },
          });
  
          (token).id = dbUser.id;          
          (token).role = dbUser.role;
          (token).accessToken = account.access_token; 
        }
      }
  
      return token;
    },
  
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = (token).id;       
        (session.user as any).role = (token).role ?? 'CUSTOMER';
      }
      (session as any).accessToken = (token).accessToken;
      return session;
    },
  }
  
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
