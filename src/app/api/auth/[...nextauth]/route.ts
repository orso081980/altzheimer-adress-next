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
  // trustHost: true,
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        console.log('🔍 Environment check:', {
          hasMongoUri: !!process.env.MONGODB_URI,
          nextAuthUrl: process.env.NEXTAUTH_URL,
          nodeEnv: process.env.NODE_ENV
        });
        
        if (!credentials?.email || !credentials?.password) {
          console.log('❌ Missing credentials');
          return null
        }

        try {
          const client = await clientPromise
          const db = client.db('Altzheimer')
          
          console.log('🔍 Looking for user:', credentials.email.toLowerCase());
          
          const user = await db.collection('users').findOne({
            email: credentials.email.toLowerCase()
          })

          console.log('🔍 User found:', {
            exists: !!user,
            isActive: user?.isActive,
            hasPassword: !!user?.password
          });

          if (!user || !user.isActive) {
            console.log('❌ User not found or inactive');
            return null
          }

          const isPasswordValid = await bcrypt.compare(
            credentials.password,
            user.password
          )

          console.log('🔍 Password validation:', isPasswordValid);

          if (!isPasswordValid) {
            console.log('❌ Invalid password');
            return null
          }

          // Update last login
          await db.collection('users').updateOne(
            { _id: user._id },
            { $set: { lastLogin: new Date() } }
          )

          return {
            id: user._id.toString(),
            email: user.email,
            name: user.name,
            role: user.role,
          }
        } catch (error) {
          console.error('Authentication error:', error)
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
  debug: process.env.NODE_ENV === 'development',
}

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }