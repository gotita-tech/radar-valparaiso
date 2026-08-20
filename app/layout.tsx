import type { Metadata } from "next";
import { Inter, Playfair_Display, Noto_Serif_JP } from "next/font/google";
import "./globals.css";
import GrandHallBackdrop from "@/components/GrandHallBackdrop";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
});

const notoSerifJP = Noto_Serif_JP({
  subsets: ["latin"],
  weight: ["400", "600"],
  variable: "--font-noto-serif-jp",
  display: "swap",
});

const siteUrl = "https://tu-dominio.vercel.app";
const siteName = "Vicente Tomás Jara Valdés — Consultor de IA & Desarrollo";
const description =
  "Construyo páginas web y sistemas impulsados por Inteligencia Artificial que hacen crecer tu negocio: automatización, agentes de IA y desarrollo de software con estrategia detrás.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: siteName,
    template: "%s · Tu Nombre",
  },
  description,
  keywords: [
    "consultor inteligencia artificial",
    "automatización de procesos",
    "freelance IA",
    "desarrollo de software a medida",
    "consultor tecnológico",
    "agentes de IA",
    "transformación digital",
  ],
  authors: [{ name: "Vicente Tomás Jara Valdés" }],
  creator: "Vicente Tomás Jara Valdés",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
    },
  },
  openGraph: {
    type: "website",
    locale: "es_ES",
    url: siteUrl,
    siteName,
    title: siteName,
    description,
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: siteName,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: siteName,
    description,
    images: ["/og-image.png"],
  },
  icons: {
    icon: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es" className={`${inter.variable} ${playfair.variable} ${notoSerifJP.variable}`}>
      <body className="font-sans bg-ink-950 text-paper antialiased">
        <GrandHallBackdrop />
        {children}
      </body>
    </html>
  );
}
