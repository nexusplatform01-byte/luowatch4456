import { Link } from "react-router-dom";
import { FireMovie } from "@/lib/firestore";

interface MovieCardProps {
  movie: FireMovie;
  rank?: number;
}

const VJ_BADGE_PALETTES = [
  { bg: "linear-gradient(135deg,#e11d48,#fb7185)", text: "#fff" },
  { bg: "linear-gradient(135deg,#7c3aed,#a78bfa)", text: "#fff" },
  { bg: "linear-gradient(135deg,#0369a1,#38bdf8)", text: "#fff" },
  { bg: "linear-gradient(135deg,#15803d,#4ade80)", text: "#fff" },
  { bg: "linear-gradient(135deg,#c2410c,#fb923c)", text: "#fff" },
  { bg: "linear-gradient(135deg,#be185d,#f472b6)", text: "#fff" },
  { bg: "linear-gradient(135deg,#0e7490,#22d3ee)", text: "#fff" },
  { bg: "linear-gradient(135deg,#4d7c0f,#a3e635)", text: "#fff" },
  { bg: "linear-gradient(135deg,#6d28d9,#c084fc)", text: "#fff" },
  { bg: "linear-gradient(135deg,#92400e,#fbbf24)", text: "#fff" },
  { bg: "linear-gradient(135deg,#065f46,#34d399)", text: "#fff" },
  { bg: "linear-gradient(135deg,#9f1239,#fda4af)", text: "#fff" },
];

function getVJPalette(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return VJ_BADGE_PALETTES[Math.abs(hash) % VJ_BADGE_PALETTES.length];
}

const MovieCard = ({ movie }: MovieCardProps) => {
  const isNew = (() => {
    if (!movie.createdAt) return false;
    const created = (movie.createdAt as any)?.toDate?.() ?? new Date(movie.createdAt as any);
    const diff = Date.now() - created.getTime();
    return diff < 1000 * 60 * 60 * 24 * 14;
  })();

  const subtitle = [movie.type === "series" ? "Series" : "Movie", movie.genre].filter(Boolean).join(" · ");
  const palette = movie.vjName ? getVJPalette(movie.vjName) : null;

  return (
    <Link to={`/movie/${movie.id}`} className="group block w-full">
      {/* Poster */}
      <div className="relative aspect-[2/3] overflow-hidden bg-secondary w-full">
        {movie.posterUrl ? (
          <img
            src={movie.posterUrl}
            alt={movie.title}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-secondary">
            <span className="text-muted-foreground text-[9px] text-center px-1">No Poster</span>
          </div>
        )}

        {/* VJ badge — top right, gradient pill */}
        {movie.vjName && palette && (
          <span
            className="absolute top-1.5 right-1.5 text-[7px] font-black px-1.5 py-[3px] leading-none tracking-wider shadow-md uppercase whitespace-nowrap overflow-hidden"
            style={{
              background: palette.bg,
              color: palette.text,
              borderRadius: "3px",
              letterSpacing: "0.06em",
              boxShadow: "0 2px 6px rgba(0,0,0,0.45)",
              maxWidth: "calc(100% - 8px)",
              textOverflow: "ellipsis",
            }}
          >
            {movie.vjName}
          </span>
        )}

        {/* Bottom gradient */}
        <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-black/70 to-transparent pointer-events-none" />

        {/* NEW badge — bottom right */}
        {isNew && (
          <span className="absolute bottom-1 right-1 bg-primary text-primary-foreground text-[6px] font-black px-1 py-0.5 leading-none tracking-wide shadow-lg uppercase">
            New
          </span>
        )}
      </div>

      {/* Info below poster */}
      <div className="mt-1 px-0.5">
        <h3 className="text-[10px] font-bold text-foreground truncate leading-snug">
          {movie.title}
        </h3>
        <p className="text-[9px] text-muted-foreground mt-0.5 truncate">
          {subtitle || movie.year}
        </p>
      </div>
    </Link>
  );
};

export default MovieCard;
