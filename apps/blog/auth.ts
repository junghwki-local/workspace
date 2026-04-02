import NextAuth from "next-auth";
import Google from "next-auth/providers/google";

const allowedEmail = process.env.ADMIN_EMAIL;

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],
  callbacks: {
    signIn({ user }) {
      if (!allowedEmail) return false;
      return user.email === allowedEmail;
    },
    session({ session, token }) {
      return session;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
});
