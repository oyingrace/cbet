import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { AppProvider } from "@/lib/context/AppContext";
import MiniPayGate from "@/components/MiniPayGate";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "cbet",
  description: "A numbers lottery on Celo — play with cUSD in MiniPay.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>
          <AppProvider>
            <MiniPayGate>{children}</MiniPayGate>
          </AppProvider>
        </Providers>
      </body>
    </html>
  );
}
