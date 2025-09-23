import NextAuth from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import clientPromise from '@/lib/mongodb'
import bcrypt from 'bcryptjs'
import { JWT } from 'next-auth/jwt'
import { Session } from 'next-auth'

interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: string;
}

export const authOptions = {
  trustHost: true,
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        console.log('🚀 NextAuth authorize called');
        console.log('📝 Environment check:', {
          nodeEnv: process.env.NODE_ENV,
          vercelEnv: process.env.VERCEL_ENV,
          hasMongoUri: !!process.env.MONGODB_URI,
          hasNextAuthSecret: !!process.env.NEXTAUTH_SECRET,
          nextAuthUrl: process.env.NEXTAUTH_URL
        });

        if (!credentials?.email || !credentials?.password) {
          console.log('❌ Missing credentials');
          return null
        }

        console.log('🔍 Login attempt for email:', credentials.email);

        try {
          console.log('🔗 Attempting MongoDB connection...');
          const client = await clientPromise;
          console.log('✅ MongoDB client connected');
          
          const db = client.db('Altzheimer');
          console.log('✅ Database selected: Altzheimer');
          
          console.log('🔍 Looking up user in database...');
          const user = await db.collection('users').findOne({
            email: credentials.email.toLowerCase()
          });

          console.log('👤 User lookup result:', {
            found: !!user,
            isActive: user?.isActive,
            hasPassword: !!user?.password,
            passwordLength: user?.password?.length
          });

          if (!user || !user.isActive) {
            console.log('❌ User not found or inactive');
            return null
          }

          console.log('🔐 Verifying password...');
          const isPasswordValid = await bcrypt.compare(
            credentials.password,
            user.password
          );

          console.log('🔐 Password verification result:', isPasswordValid);

          if (!isPasswordValid) {
            console.log('❌ Invalid password');
            return null
          }

          console.log('📝 Updating last login...');
          await db.collection('users').updateOne(
            { _id: user._id },
            { $set: { lastLogin: new Date() } }
          );

          console.log('✅ Login successful, returning user data');
          return {
            id: user._id.toString(),
            email: user.email,
            name: user.name,
            role: user.role,
          }
        } catch (error: unknown) {
          const err = error as Error;
          console.error('🚨 Authentication error details:', {
            name: err.name,
            message: err.message,
            stack: err.stack?.split('\n').slice(0, 5)
          });
          return null
        }
      }
    })
  ],
  session: {
    strategy: 'jwt' as const,
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  jwt: {
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async jwt({ token, user }: { token: JWT; user: AuthUser | null }) {
      if (user) {
        token.role = user.role
      }
      return token
    },
    async session({ session, token }: { session: Session; token: JWT }) {
      if (session.user && token) {
        session.user.id = token.sub!
        session.user.role = token.role as string
      }
      return session
    }
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
}

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }
