import type { Metadata, Viewport } from "next";
import ThemeRegistry from "@/theme/ThemeRegistry";
import { ToastProvider } from "@/components/mui/ErrorToast";

import "./globals.css";

export const metadata: Metadata = {
  title: "TruthCast - Autonomous AI Fact-Checking with Blockchain Provenance",
  description:
    "Autonomous adversarial multi-agent fact-checking pipeline with immutable Solana blockchain provenance. Forensic editorial precision for the truth.",
  openGraph: {
    title: "TruthCast - AI Fact-Checking",
    description: "Autonomous · Adversarial · Immutable",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#0A0C0F",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <ThemeRegistry>
          <ToastProvider>
            {/* Skip to main content link for accessibility */}
            <a
              href="#main-content"
              style={{
                position: 'absolute',
                left: '-9999px',
                top: 'auto',
                width: '1px',
                height: '1px',
                overflow: 'hidden',
              }}
            >
              Skip to main content
            </a>

            {children}
          </ToastProvider>
        </ThemeRegistry>
      </body>
    </html>
  );
}
