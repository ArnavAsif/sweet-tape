import type { Metadata, Viewport } from "next";
import "./globals.css";
import CustomCursor from "@/components/CustomCursor";
import Preloader from "@/components/Preloader";
import SiteMenu from "@/components/SiteMenu";
import TopBand from "@/components/TopBand";
import SvgFilters from "@/components/SvgFilters";
import SmoothScroll from "@/components/SmoothScroll";

export const viewport: Viewport = {
  themeColor: "#034102",
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL("https://sweet-tape.com"),
  title: "SweetTape — Stick By You | Cloth, Masking & OPP Tapes",
  description:
    "Six tapes made in Malaysia, one for every job — cloth, masking, stationery, double-sided and more. Three generations of tape; meet the one who sticks.",
  icons: {
    icon: "/icon.svg",
    apple: "/apple-icon.png",
  },
  openGraph: {
    title: "SweetTape — Stick By You | Cloth, Masking & OPP Tapes",
    description:
      "Six tapes made in Malaysia, one for every job — cloth, masking, stationery, double-sided and more. Three generations of tape; meet the one who sticks.",
    url: "https://sweet-tape.com",
    siteName: "SweetTape",
    images: [
      {
        url: "/assets/og.jpg",
        width: 1200,
        height: 630,
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "SweetTape — Stick By You | Cloth, Masking & OPP Tapes",
    description:
      "Six tapes made in Malaysia, one for every job — cloth, masking, stationery, double-sided and more. Three generations of tape; meet the one who sticks.",
    images: ["/assets/og.jpg"],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" data-loading="" suppressHydrationWarning>
      <head>
        <link rel="stylesheet" href="https://use.typekit.net/wyl5nhy.css" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if (!window.location.hash) {
                if ('scrollRestoration' in history) {
                  history.scrollRestoration = 'manual';
                }
                window.scrollTo(0, 0);
              }
            `,
          }}
        />
      </head>
      <body suppressHydrationWarning>
        <SvgFilters />
        <CustomCursor />
        <Preloader />
        <TopBand />
        <SiteMenu />
        <SmoothScroll>
          <main id="main" tabIndex={-1}>
            {children}
          </main>
        </SmoothScroll>
      </body>
    </html>
  );
}
