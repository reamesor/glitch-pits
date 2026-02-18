import type { Metadata } from "next";
import "./globals.css";
import "./glitch.css";
import "@solana/wallet-adapter-react-ui/styles.css";
import { SolanaProvider } from "@/components/SolanaProvider";

export const metadata: Metadata = {
  title: "Glitch Pits | $PITS",
  description: "High-stakes 8-bit Multiplayer Rumble Royale",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen bg-[var(--bg-dark)] text-white">
        <SolanaProvider>
          {children}
          <div className="scanlines" />
        </SolanaProvider>
      </body>
    </html>
  );
}
