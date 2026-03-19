import NextAuth from 'next-auth'
import Google from 'next-auth/providers/google'

const ALLOWED_DOMAIN = 'searchvista.co.uk'

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID!,
      clientSecret: process.env.AUTH_GOOGLE_SECRET!,
      authorization: {
        params: {
          // Pre-filter to Google Workspace domain at the consent screen
          hd: ALLOWED_DOMAIN,
        },
      },
    }),
  ],
  callbacks: {
    signIn({ profile }) {
      // Enforce domain server-side — hd param alone is not sufficient security
      return profile?.email?.endsWith(`@${ALLOWED_DOMAIN}`) ?? false
    },
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
})
