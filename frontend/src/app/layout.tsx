import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { Toaster } from "sonner";
import RouteTransitionLoader from "@/components/RouteTransitionLoader";
import "./globals.css";

export const metadata: Metadata = {
  title: "Book With AI",
  description: "Your personal AI travel assistant",
};

const signInFallbackRedirectUrl =
  process.env.NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL ??
  process.env.NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL ??
  "/";

const signUpFallbackRedirectUrl =
  process.env.NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL ??
  process.env.NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL ??
  "/";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider
      signInFallbackRedirectUrl={signInFallbackRedirectUrl}
      signUpFallbackRedirectUrl={signUpFallbackRedirectUrl}
    >
      <html lang="en">
        <body className="font-sans antialiased bg-slate-50 text-slate-900 min-h-screen">
          <RouteTransitionLoader />
          {children}
          <Toaster
            position="top-right"
            richColors
            closeButton
            duration={4000}
          />
        </body>
      </html>
    </ClerkProvider>
  );
}
