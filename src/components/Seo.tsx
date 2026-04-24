import { Helmet } from "react-helmet-async";

const SITE_URL = "https://www.servicios360.com.ar";
const DEFAULT_OG_IMAGE = `${SITE_URL}/og-image.png`;

export interface SeoProps {
  /** Page title. Gets suffixed with "| Servicios 360" unless already present. */
  title: string;
  /** Short description (~160 chars max for SERPs). */
  description: string;
  /** Canonical path (e.g. "/buscar"). Absolute URL is built automatically. */
  canonicalPath?: string;
  /** Override OG image; defaults to /og-image.png on this domain. */
  image?: string;
  /** "website" (default), "article", "profile". */
  ogType?: "website" | "article" | "profile";
  /** Extra JSON-LD structured data as a plain object (will be JSON.stringified). */
  jsonLd?: Record<string, unknown> | Record<string, unknown>[];
  /** If true, ask crawlers not to index this page (auth pages, dashboards). */
  noindex?: boolean;
}

/**
 * Centralised <head> management. Uses react-helmet-async so Suspense
 * boundaries can still render before Helmet resolves. Defaults are tuned
 * for a services marketplace in Argentina (es_AR locale).
 */
const Seo = ({
  title,
  description,
  canonicalPath,
  image = DEFAULT_OG_IMAGE,
  ogType = "website",
  jsonLd,
  noindex = false,
}: SeoProps) => {
  const fullTitle = title.includes("Servicios 360") ? title : `${title} | Servicios 360`;
  const canonical = canonicalPath ? `${SITE_URL}${canonicalPath}` : SITE_URL;
  const ldArray = jsonLd ? (Array.isArray(jsonLd) ? jsonLd : [jsonLd]) : [];

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={canonical} />
      {noindex && <meta name="robots" content="noindex, nofollow" />}

      {/* Open Graph */}
      <meta property="og:type" content={ogType} />
      <meta property="og:url" content={canonical} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:locale" content="es_AR" />
      <meta property="og:site_name" content="Servicios 360" />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />

      {/* JSON-LD structured data */}
      {ldArray.map((item, i) => (
        <script key={i} type="application/ld+json">
          {JSON.stringify(item)}
        </script>
      ))}
    </Helmet>
  );
};

export default Seo;
