import type { Metadata, Viewport } from "next";
import { Toaster } from "sonner";
import ThemeRegistry from "@/theme/ThemeRegistry";

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

          <Toaster
            position="bottom-right"
            toastOptions={{
              style: {
                background: "#141920",
                border: "1px solid #2A3340",
                color: "#F1F5F9",
                fontFamily: "'DM Mono', monospace",
                fontSize: "12px",
              },
            }}
          />
        </ThemeRegistry>
      </body>
    </html>
  );
}
