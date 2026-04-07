import { Helmet } from "react-helmet-async";

interface SEOHeadProps {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  type?: "website" | "music.song" | "video.movie" | "video.other";
  structuredData?: object;
  keywords?: string;
  artist?: string;
  videoUrl?: string;
}

const SITE_NAME = "LUO WATCH";
const SITE_URL = "https://luowatch.replit.app";
const DEFAULT_IMAGE = "/og-image.png";
const DEFAULT_DESC = "LUO WATCH — Luo translated movies from top VJs, Luo music videos, Live TV, and Acholi TikTok. Stream and download free.";

const SEOHead = ({
  title,
  description,
  image,
  url,
  type = "website",
  structuredData,
  keywords,
  artist,
  videoUrl,
}: SEOHeadProps) => {
  const fullTitle = title ? `${title} | ${SITE_NAME}` : `${SITE_NAME} — Luo Movies, Music, Live TV`;
  const metaDesc = description || DEFAULT_DESC;
  const metaImage = image ? (image.startsWith("http") ? image : `${SITE_URL}${image}`) : `${SITE_URL}${DEFAULT_IMAGE}`;
  const metaUrl = url ? `${SITE_URL}${url}` : SITE_URL;

  return (
    <Helmet>
      {/* Primary */}
      <title>{fullTitle}</title>
      <meta name="description" content={metaDesc} />
      {keywords && <meta name="keywords" content={keywords} />}
      <link rel="canonical" href={metaUrl} />

      {/* Open Graph */}
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={metaDesc} />
      <meta property="og:image" content={metaImage} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:url" content={metaUrl} />
      <meta property="og:type" content={type} />
      {artist && <meta property="music:musician" content={artist} />}

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={metaDesc} />
      <meta name="twitter:image" content={metaImage} />

      {/* Structured Data JSON-LD */}
      {structuredData && (
        <script type="application/ld+json">
          {JSON.stringify(structuredData)}
        </script>
      )}
    </Helmet>
  );
};

export default SEOHead;

/* ─── Helpers for building structured data ─── */

export const buildMusicStructuredData = (video: {
  id: string;
  title: string;
  artist?: string;
  musicianName?: string;
  thumbnailUrl?: string;
  genre?: string;
  year?: string;
  duration?: string;
  plays?: number;
  downloads?: number;
}) => ({
  "@context": "https://schema.org",
  "@type": "MusicVideoObject",
  name: video.title,
  description: `Watch and download ${video.title} by ${video.musicianName || video.artist || "Unknown Artist"} on LUO WATCH — free Luo music streaming platform.`,
  thumbnailUrl: video.thumbnailUrl || `${SITE_URL}/og-image.png`,
  url: `${SITE_URL}/music/${video.id}`,
  contentUrl: `${SITE_URL}/music/${video.id}`,
  embedUrl: `${SITE_URL}/music/${video.id}`,
  byArtist: {
    "@type": "MusicGroup",
    name: video.musicianName || video.artist || "Unknown Artist",
  },
  genre: video.genre || "Luo Music",
  dateCreated: video.year || "",
  interactionStatistic: [
    {
      "@type": "InteractionCounter",
      interactionType: "https://schema.org/WatchAction",
      userInteractionCount: video.plays || 0,
    },
    {
      "@type": "InteractionCounter",
      interactionType: "https://schema.org/DownloadAction",
      userInteractionCount: video.downloads || 0,
    },
  ],
  inLanguage: "lug",
  publisher: {
    "@type": "Organization",
    name: "LUO WATCH",
    url: SITE_URL,
    logo: { "@type": "ImageObject", url: `${SITE_URL}/logo.png` },
  },
});

export const buildMovieStructuredData = (movie: {
  id: string;
  title: string;
  description?: string;
  thumbnailUrl?: string;
  genre?: string;
  year?: string;
  vjName?: string;
  plays?: number;
}) => ({
  "@context": "https://schema.org",
  "@type": "Movie",
  name: movie.title,
  description: movie.description || `Watch ${movie.title} on LUO WATCH — Luo translated movies streaming platform.`,
  image: movie.thumbnailUrl || `${SITE_URL}/og-image.png`,
  url: `${SITE_URL}/movie/${movie.id}`,
  genre: movie.genre || "Luo Movie",
  datePublished: movie.year || "",
  director: {
    "@type": "Person",
    name: movie.vjName || "LUO WATCH VJ",
  },
  inLanguage: "lug",
  countryOfOrigin: { "@type": "Country", name: "Uganda" },
  publisher: {
    "@type": "Organization",
    name: "LUO WATCH",
    url: SITE_URL,
    logo: { "@type": "ImageObject", url: `${SITE_URL}/logo.png` },
  },
  interactionStatistic: {
    "@type": "InteractionCounter",
    interactionType: "https://schema.org/WatchAction",
    userInteractionCount: movie.plays || 0,
  },
});

export const SITE_URL_EXPORT = SITE_URL;
