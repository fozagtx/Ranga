import "./globals.css";

import type { Metadata } from "next";
import { Web3Provider } from "@/components/web3-provider";

export const metadata: Metadata = {
  metadataBase: new URL("https://ogpass-fawuzantechs-projects.vercel.app"),
  title: "OGPass",
  description: "Portable private memory passport for AI agents on 0G.",
  icons: {
    icon: "/icon.png",
  },
  openGraph: {
    title: "OGPass",
    description: "Private AI memory passport on 0G.",
    images: ["/cover.png"],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Web3Provider>{children}</Web3Provider>
      </body>
    </html>
  );
}
