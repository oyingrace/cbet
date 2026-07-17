import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { AppProvider } from "@/lib/context/AppContext";
import MiniPayGate from "@/components/MiniPayGate";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "cbet",
  description: "A numbers lottery on Celo — play with USDT in MiniPay.",
  other: {
    "talentapp:project_verification":
      "7910e21eca2eae90717bdea9033b22331dd3bdd9a17d7aad25d184303eda7616a523c1ea76b454108000ad4c57ef503ad6912d589dacbc4126f1d53c241abbfd",
  },
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
