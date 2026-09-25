import type { Metadata } from "next";
import { Space_Grotesk, Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { WebSocketProvider } from "@/contexts/WebSocketContext";
import { ChallengeModal } from "@/components/challenge/ChallengeModal";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "ClashIQ — Real-Time 1v1 Competitive Mathematics",
  description:
    "Speed arithmetic arena. Challenge opponents live in ranked head-to-head mathematical speed battles with server-authoritative Elo progression.",
  openGraph: {
    title: "ClashIQ — 1v1 Math Arena",
    description: "Ranked real-time competitive mathematics.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${spaceGrotesk.variable} ${plusJakartaSans.variable} ${jetbrainsMono.variable}`}
    >
      <body className="min-h-screen bg-[#0B0E14] text-[#F8FAFC] font-sans antialiased selection:bg-[#F59E0B] selection:text-black flex flex-col">
        <AuthProvider>
          <WebSocketProvider>
            {children}
            <ChallengeModal />
          </WebSocketProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
