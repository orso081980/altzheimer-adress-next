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
  debug: true, // Enable debug logging
  trustHost: true,
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        console.log('🔍 NextAuth Environment Check:', {
          hasMongoUri: !!process.env.MONGODB_URI,
          nextAuthUrl: process.env.NEXTAUTH_URL,
          nodeEnv: process.env.NODE_ENV,
          vercelEnv: process.env.VERCEL_ENV
        });

        console.log('🔍 Login attempt for:', credentials?.email);
        
        if (!credentials?.email || !credentials?.password) {
          console.log('❌ Missing credentials');
          return null
        }

        try {
          const client = await clientPromise
          const db = client.db('Altzheimer')
          
          console.log('✅ Connected to MongoDB');
          
          const user = await db.collection('users').findOne({
            email: credentials.email.toLowerCase()
          })

          console.log('👤 User lookup result:', {
            found: !!user,
            email: user?.email,
            isActive: user?.isActive,
            hasPassword: !!user?.password,
            passwordLength: user?.password?.length,
            passwordType: typeof user?.password,
            role: user?.role
          });

          if (!user || !user.isActive) {
            console.log('❌ User not found or inactive');
            return null
          }

          const isPasswordValid = await bcrypt.compare(
            credentials.password,
            user.password
          )

          console.log('🔐 Password comparison:', {
            inputLength: credentials.password.length,
            storedLength: user.password.length,
            isValid: isPasswordValid
          });

          if (!isPasswordValid) {
            console.log('❌ Invalid password');
            return null
          }

          // Update last login
          await db.collection('users').updateOne(
            { _id: user._id },
            { $set: { lastLogin: new Date() } }
          )

          console.log('✅ Login successful for:', user.email);
          
          return {
            id: user._id.toString(),
            email: user.email,
            name: user.name,
            role: user.role,
          }
        } catch (error) {
          console.error('🚨 Authentication error:', error)
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
