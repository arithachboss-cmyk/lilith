import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { headers } from "next/headers";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const productionHost = "lilith-renter-leads.yacht369.chatgpt.site";

function trustedHost(value: string | null) {
  const host = value?.split(",")[0]?.trim().toLowerCase();
  if (!host) return productionHost;
  if (host === "localhost" || host.startsWith("localhost:")) return host;
  if (host === productionHost || host.endsWith(".chatgpt.site")) return host;
  return productionHost;
}

export async function generateMetadata(): Promise<Metadata> {
  const incomingHeaders = await headers();
  const host = trustedHost(
    incomingHeaders.get("x-forwarded-host") ?? incomingHeaders.get("host"),
  );
  const protocol = host.startsWith("localhost") ? "http" : "https";
  const origin = `${protocol}://${host}`;
  const title = "Lilith Homes | International Thailand Real Estate Agent";
  const description =
    "Multilingual Thailand real estate lead desk for Thai, Chinese, English-speaking and Russian clients, with SEO-ready capture and CSV/JSON import.";

  return {
    metadataBase: new URL(origin),
    title,
    description,
    alternates: {
      canonical: origin,
      languages: {
        th: `${origin}/?lang=th`,
        "zh-CN": `${origin}/?lang=zh`,
        "en-US": `${origin}/?lang=en`,
        ru: `${origin}/?lang=ru`,
      },
    },
    icons: {
      icon: "/favicon.svg",
      shortcut: "/favicon.svg",
    },
    openGraph: {
      title,
      description,
      type: "website",
      url: origin,
      images: [
        {
          url: `${origin}/og.png`,
          width: 1731,
          height: 909,
          alt: "Lilith Homes international Thailand real estate lead desk",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [`${origin}/og.png`],
    },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
