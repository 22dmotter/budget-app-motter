import type { Metadata, Viewport } from "next";
import { ParticleBackground } from "@/components/ParticleBackground";
import { AppFrame } from "@/components/AppFrame";
import { RegisterSW } from "@/components/RegisterSW";
import { brand } from "@/config/brand";
import { withBasePath } from "@/lib/basePath";
import "@/styles/globals.css";

export const viewport: Viewport = {
  themeColor: "#0F1E3D",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

const siteUrl = "https://22dmotter.github.io/budget-app-motter";
const siteDescription =
  "A simple debt payoff calculator and tracker. See your debt-free date, log payments, and watch your progress — right in the browser.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: `${brand.name} — See your path out of debt`,
    template: `%s | ${brand.name}`,
  },
  description: siteDescription,
  robots: { index: true, follow: true },
  applicationName: brand.name,
  appleWebApp: {
    capable: true,
    title: brand.name,
    statusBarStyle: "black-translucent",
  },
  icons: {
    icon: [{ url: withBasePath("/favicon.ico") }, { url: withBasePath("/icons/icon-192.png"), sizes: "192x192", type: "image/png" }],
    apple: withBasePath("/icons/apple-touch-icon.png"),
  },
  openGraph: {
    type: "website",
    siteName: brand.name,
    title: `${brand.name} — See your path out of debt`,
    description: siteDescription,
    url: siteUrl,
    images: [{ url: withBasePath("/icons/icon-512.png"), width: 512, height: 512, alt: brand.name }],
  },
  twitter: {
    card: "summary",
    title: `${brand.name} — See your path out of debt`,
    description: siteDescription,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Space+Grotesk:wght@500;700&display=swap"
          rel="stylesheet"
        />
        <meta name="theme-color" content="#0F1E3D" />
        <link rel="manifest" href={withBasePath("/manifest.webmanifest")} />
        <link rel="icon" href={withBasePath("/favicon.ico")} />
        <link rel="apple-touch-icon" href={withBasePath("/icons/apple-touch-icon.png")} />
      </head>
      <body>
        <div className="page-shell">
          <div className="motion-bg" aria-hidden="true">
            <div className="blob blob-a" />
            <div className="blob blob-b" />
            <div className="blob blob-c" />
            <ParticleBackground />
          </div>
          <RegisterSW />
          <AppFrame>{children}</AppFrame>
        </div>
      </body>
    </html>
  );
}
