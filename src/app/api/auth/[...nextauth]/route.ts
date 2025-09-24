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
      async authorize(credentials, req) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        try {
          const client = await clientPromise
          const db = client.db('Altzheimer')
          
          const user = await db.collection('users').findOne({
            email: credentials.email.toLowerCase()
          })

          if (!user || !user.isActive) {
            // Log failed login attempt
            await db.collection('security_logs').insertOne({
              ip: req?.headers?.['x-forwarded-for']?.split(',')[0] || req?.headers?.['x-real-ip'] || 'unknown',
              userAgent: req?.headers?.['user-agent'] || 'unknown',
              event: 'login_failed',
              path: '/auth/signin',
              email: credentials.email.toLowerCase(),
              timestamp: new Date(),
              details: user ? 'User account inactive' : 'User not found',
            });
            return null
          }

          const isPasswordValid = await bcrypt.compare(
            credentials.password,
            user.password
          )

          if (!isPasswordValid) {
            // Log failed login attempt
            await db.collection('security_logs').insertOne({
              ip: req?.headers?.['x-forwarded-for']?.split(',')[0] || req?.headers?.['x-real-ip'] || 'unknown',
              userAgent: req?.headers?.['user-agent'] || 'unknown',
              event: 'login_failed',
              path: '/auth/signin',
              email: credentials.email.toLowerCase(),
              timestamp: new Date(),
              details: 'Invalid password',
            });
            return null
          }

          // Update last login
          await db.collection('users').updateOne(
            { _id: user._id },
            { $set: { lastLogin: new Date() } }
          )

          // Log successful login
          await db.collection('security_logs').insertOne({
            ip: req?.headers?.['x-forwarded-for']?.split(',')[0] || req?.headers?.['x-real-ip'] || 'unknown',
            userAgent: req?.headers?.['user-agent'] || 'unknown',
            event: 'login_success',
            path: '/auth/signin',
            email: user.email.toLowerCase(),
            timestamp: new Date(),
            details: 'Successful authentication',
          });

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
}

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }
