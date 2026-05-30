// [IMPL-ROOT_LAYOUT] [ARCH-LAYOUT_PATTERN] [REQ-ROOT_LAYOUT]: Root layout server component — metadata export, html/body shell, font variable classes, children slot
// Root layout component that wraps all pages with consistent HTML structure,
// font configuration, global styles, and theme CSS variable injection.
// Metadata, locale, and theme colors are driven by YAML configuration files.

import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

// [IMPL-CONFIG_LOADER] [ARCH-CONFIG_DRIVEN_UI] [REQ-CONFIG_DRIVEN_UI]
// Import config loader to read site metadata and theme colors from YAML files.
import { getSiteConfig, getThemeConfig, generateThemeCss } from "../lib/config";

// [IMPL-FONT_LOADING] [ARCH-GOOGLE_FONTS] [ARCH-CSS_VARIABLES_FONTS] [REQ-FONT_SYSTEM]: how: instantiate Geist with variable --font-geist-sans and Geist_Mono with --font-geist-mono; latin subset only
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

// [IMPL-FONT_LOADING] [ARCH-GOOGLE_FONTS] [ARCH-CSS_VARIABLES_FONTS] [REQ-FONT_SYSTEM]: how: instantiate Geist with variable --font-geist-sans and Geist_Mono with --font-geist-mono; latin subset only
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// [IMPL-METADATA] [ARCH-NEXTJS_FRAMEWORK] [REQ-METADATA] [REQ-CONFIG_DRIVEN_UI]: how — call getSiteConfig once at module load; export metadata constant with title and description for Next.js Metadata API.
const siteConfig = getSiteConfig();
export const metadata: Metadata = {
  title: siteConfig.metadata.title,
  description: siteConfig.metadata.description,
};

// [IMPL-ROOT_LAYOUT] [ARCH-LAYOUT_PATTERN] [REQ-ROOT_LAYOUT] [REQ-CONFIG_DRIVEN_UI] [REQ-FONT_SYSTEM]: render html lang from site config, head theme style injection, body with Geist font variables and children
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // [IMPL-THEME_INJECTION] [ARCH-THEME_INJECTION] [REQ-CONFIG_DRIVEN_UI]: RootLayout loads theme config and renders generated CSS in head style tag (replaces hard-coded globals.css :root colors)
  const themeConfig = getThemeConfig();
  const themeCss = generateThemeCss(themeConfig);

  // [IMPL-CONFIG_LOADER] [REQ-CONFIG_DRIVEN_UI]
  // Read locale from site config for the HTML lang attribute.
  const { locale } = getSiteConfig();

  return (
    <html lang={locale}>
      <head>
        {/* [IMPL-THEME_INJECTION] [ARCH-THEME_INJECTION] [REQ-CONFIG_DRIVEN_UI]: RootLayout loads theme config and renders generated CSS in head style tag (replaces hard-coded globals.css :root colors) */}
        <style dangerouslySetInnerHTML={{ __html: themeCss }} />
      </head>
      {/* [IMPL-FONT_LOADING] [ARCH-GOOGLE_FONTS] [ARCH-CSS_VARIABLES_FONTS] [REQ-FONT_SYSTEM]: how: RootLayout body className concatenates both font variable classes and antialiased */}
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
