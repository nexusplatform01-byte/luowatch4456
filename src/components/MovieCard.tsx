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

        {/* NEW badge — top right */}
        {isNew && (
          <span className="absolute top-1.5 right-1.5 bg-primary text-primary-foreground text-[8px] font-black px-1.5 py-0.5 rounded-full leading-none tracking-wide shadow-lg">
            New
          </span>
        )}

        {/* Rank number — bottom left */}
        {rank !== undefined && (
          <span className="absolute bottom-1 left-1.5 text-white font-black text-sm leading-none drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]"
            style={{ textShadow: "0 0 6px rgba(0,0,0,0.9), 1px 1px 0 rgba(0,0,0,0.8)" }}>
            {rank}
          </span>
        )}

        {/* Bottom gradient for readability */}
        <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />
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
