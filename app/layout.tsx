import type { Metadata } from "next";
import { Inter, Playfair_Display, Noto_Serif_JP } from "next/font/google";
import "./globals.css";
import GrandHallBackdrop from "@/components/GrandHallBackdrop";
import CursorGlow from "@/components/CursorGlow";
import { AUTHOR_NAME, AUTHOR_SHORT_NAME, EMAIL, SITE_URL } from "@/lib/site-config";

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

const siteName = `${AUTHOR_SHORT_NAME} — Consultor de IA & Desarrollo`;
const description =
  "Construyo páginas web y sistemas impulsados por Inteligencia Artificial que hacen crecer tu negocio: automatización, agentes de IA y desarrollo de software con estrategia detrás.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: siteName,
    template: `%s · ${AUTHOR_SHORT_NAME}`,
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
  authors: [{ name: AUTHOR_NAME }],
  creator: AUTHOR_NAME,
  alternates: {
    canonical: SITE_URL,
  },
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
    locale: "es_CL",
    url: SITE_URL,
    siteName,
    title: siteName,
    description,
  },
  twitter: {
    card: "summary_large_image",
    title: siteName,
    description,
  },
  icons: {
    icon: "/favicon.svg",
  },
};

const structuredData = {
  "@context": "https://schema.org",
  "@type": "ProfessionalService",
  name: siteName,
  url: SITE_URL,
  image: `${SITE_URL}/opengraph-image`,
  description,
  email: EMAIL,
  areaServed: "CL",
  founder: {
    "@type": "Person",
    name: AUTHOR_NAME,
    jobTitle: "Consultor de Inteligencia Artificial y Desarrollo de Software",
    email: EMAIL,
  },
  knowsAbout: [
    "Inteligencia Artificial",
    "Automatización de procesos",
    "Desarrollo de software",
    "Consultoría tecnológica",
    "Transformación digital",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es" className={`${inter.variable} ${playfair.variable} ${notoSerifJP.variable}`}>
      <body className="font-sans bg-ink-950 text-paper antialiased">
        <script
          type="application/ld+json"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
        <GrandHallBackdrop />
        <CursorGlow />
        {children}
      </body>
    </html>
  );
}
