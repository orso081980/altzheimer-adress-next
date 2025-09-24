import { withAuth } from "next-auth/middleware"
import { SecurityTracker } from "./src/lib/security-tracker"

export default withAuth(
  async function middleware(req) {
    // Track access to entries pages
    if (req.nextUrl.pathname.startsWith('/entries/')) {
      await SecurityTracker.logEvent(
        req.headers,
        'page_access',
        req.nextUrl.pathname,
        undefined,
        `Access to ${req.nextUrl.pathname}`
      );
    }
    
    // Track unauthorized access attempts
    if (!req.nextauth.token && req.nextUrl.pathname.startsWith('/entries/')) {
      await SecurityTracker.logEvent(
        req.headers,
        'unauthorized_access',
        req.nextUrl.pathname,
        undefined,
        'Attempted access without authentication'
      );
    }
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        // Allow access to auth pages without token
        if (req.nextUrl.pathname.startsWith('/auth/')) {
          return true
        }
        
        // Allow access to API auth routes
        if (req.nextUrl.pathname.startsWith('/api/auth/')) {
          return true
        }
        
        // Require token for all other pages
        return !!token
      },
    },
  }
)

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (NextAuth API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     */
    '/((?!api/auth|_next/static|_next/image|favicon.ico|public).*)',
  ],
}
