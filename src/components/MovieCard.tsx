import { Link } from "react-router-dom";
import { FireMovie } from "@/lib/firestore";

interface MovieCardProps {
  movie: FireMovie;
  rank?: number;
}

const MovieCard = ({ movie, rank }: MovieCardProps) => {
  const isNew = (() => {
    if (!movie.createdAt) return false;
    const created = (movie.createdAt as any)?.toDate?.() ?? new Date(movie.createdAt as any);
    const diff = Date.now() - created.getTime();
    return diff < 1000 * 60 * 60 * 24 * 14;
  })();

  const subtitle = [movie.type === "series" ? "Series" : "Movie", movie.genre].filter(Boolean).join(" · ");

  return (
    <Link to={`/movie/${movie.id}`} className="group block">
      {/* Poster */}
      <div className="relative aspect-[2/3] overflow-hidden bg-secondary">
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

        {/* Bottom gradient for readability */}
        <div className="absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-t from-black/80 to-transparent pointer-events-none" />

        {/* Rank number — bottom left */}
        {rank !== undefined && (
          <span className="absolute bottom-1 left-1.5 text-white font-black text-sm leading-none drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]"
            style={{ textShadow: "0 0 6px rgba(0,0,0,0.9), 1px 1px 0 rgba(0,0,0,0.8)" }}>
            {rank}
          </span>
        )}

        {/* NEW badge — bottom right */}
        {isNew && (
          <span className="absolute bottom-1 right-1 bg-primary text-primary-foreground text-[6px] font-black px-1 py-0.5 leading-none tracking-wide shadow-lg uppercase">
            New
          </span>
        )}

        {/* VJ name — bottom center/right area above the bottom bar */}
        {movie.vjName && (
          <span className="absolute bottom-5 left-0 right-0 text-center text-[6px] font-bold text-white/80 truncate px-1 leading-none"
            style={{ textShadow: "0 1px 3px rgba(0,0,0,0.9)" }}>
            {movie.vjName}
          </span>
        )}
      </div>

      {/* Info below poster */}
      <div className="mt-1.5 px-0.5">
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
