import type { NextAuthConfig } from "next-auth"

export const authConfig = {
    providers: [],
    pages: {
        signIn: "/login",
    },
    session: {
        strategy: "jwt"
    },
    callbacks: {
        jwt({ token, user }) {
            if (user) {
                token.id = user.id
                token.role = (user as any).role
            }
            return token
        },
        session({ session, token }) {
            if (token && session.user) {
                session.user.id = token.id as string
                (session.user as any).role = token.role
            }
            return session
        },
        authorized({ auth, request }) {
            const isLoggedIn = !!auth?.user
            const { pathname } = request.nextUrl
            const isOnDashboard = pathname.startsWith("/dashboard") || pathname.startsWith("/print")

            if (isOnDashboard) {
                if (isLoggedIn) return true
                return false // Redirect unauthenticated users to login page
            }
            return true
        }
    }
} satisfies NextAuthConfig
