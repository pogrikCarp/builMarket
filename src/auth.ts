import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { SITE_URL } from "@/lib/seo";
import type { Role } from "@prisma/client";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  // Use secret from env and trust local dev host to avoid host validation issues
  secret: process.env.AUTH_SECRET,
  trustHost: true,
  pages: {
    signIn: "/login",
  },
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = credentials?.email as string | undefined;
        const password = credentials?.password as string | undefined;

        if (!email || !password) return null;

        const user = await prisma.user.findUnique({
          where: { email: email.toLowerCase() },
        });

        if (!user || !user.passwordHash) return null;

        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role?: "USER" | "ADMIN" }).role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.id) {
        session.user.id = token.id as string;
        session.user.role = (token.role as Role | undefined) ?? "USER";
      }
      return session;
    },
    // baseUrl NextAuth вычисляет из заголовков запроса (Host/X-Forwarded-Host).
    // Если приложение открыли напрямую по внутреннему адресу за nginx (например,
    // через SSH-туннель на 127.0.0.1:4000/4001 при отладке blue-green деплоя -
    // см. scripts/deploy.sh), baseUrl окажется внутренним, и signIn/signOut
    // уведут пользователя на нерабочий "localhost:4001" вместо сайта. Поэтому
    // редиректы всегда приводим к публичному домену сайта, а не доверяем baseUrl.
    async redirect({ url }) {
      if (url.startsWith("/")) return `${SITE_URL}${url}`;
      try {
        if (new URL(url).origin === SITE_URL) return url;
      } catch {
        // некорректный url - используем публичный домен ниже
      }
      return SITE_URL;
    },
  },
});
