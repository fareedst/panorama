// [IMPL-ROOT_LAYOUT] [ARCH-LAYOUT_PATTERN] [REQ-ROOT_LAYOUT] [REQ-CONFIG_DRIVEN_UI]
// Root layout component that wraps all pages with consistent HTML structure,
// font configuration, global styles, and theme CSS variable injection.
// Metadata, locale, and theme colors are driven by YAML configuration files.

import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

// [IMPL-CONFIG_LOADER] [ARCH-CONFIG_DRIVEN_UI] [REQ-CONFIG_DRIVEN_UI]
// Import config loader to read site metadata and theme colors from YAML files.
import { getSiteConfig, getThemeConfig, generateThemeCss } from "../lib/config";

// [IMPL-FONT_LOADING] [ARCH-GOOGLE_FONTS] [REQ-FONT_SYSTEM]
// Load Geist Sans font with next/font optimization. Creates CSS variable
// for global font usage. Includes only Latin subset to minimize file size.
// NOTE: Changing the font family requires editing this file because
// next/font/google needs static analysis at build time.
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

// [IMPL-FONT_LOADING] [ARCH-GOOGLE_FONTS] [REQ-FONT_SYSTEM]
// Load Geist Mono font for code/monospace text. Creates CSS variable for
// flexible application throughout the codebase.
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// [IMPL-METADATA] [ARCH-NEXTJS_FRAMEWORK] [REQ-METADATA] [REQ-CONFIG_DRIVEN_UI]
// Metadata values driven by config/site.yaml. Defines default page title and
// description that appear in browser tabs, bookmarks, and search engine results.
const siteConfig = getSiteConfig();
export const metadata: Metadata = {
  title: siteConfig.metadata.title,
  description: siteConfig.metadata.description,
};

// [IMPL-ROOT_LAYOUT] [ARCH-LAYOUT_PATTERN] [REQ-ROOT_LAYOUT] [REQ-CONFIG_DRIVEN_UI]
// Root layout function that defines the HTML document structure. Renders once
// per application load and persists across page navigation. Server component
// by default (no client JavaScript unless "use client" is added).
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // [IMPL-THEME_INJECTION] [ARCH-THEME_INJECTION] [REQ-CONFIG_DRIVEN_UI]
  // Read theme config and generate CSS custom properties for injection.
  const themeConfig = getThemeConfig();
  const themeCss = generateThemeCss(themeConfig);

  // [IMPL-CONFIG_LOADER] [REQ-CONFIG_DRIVEN_UI]
  // Read locale from site config for the HTML lang attribute.
  const { locale } = getSiteConfig();

  return (
    <html lang={locale}>
      <head>
        {/* [IMPL-THEME_INJECTION] [ARCH-THEME_INJECTION] [REQ-CONFIG_DRIVEN_UI]
            Inject CSS custom properties for light/dark mode colors from
            config/theme.yaml. This replaces the hard-coded :root values
            that were previously in globals.css. */}
        <style dangerouslySetInnerHTML={{ __html: themeCss }} />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
