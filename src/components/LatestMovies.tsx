import { useMovies } from "@/hooks/useFirestore";
import MovieCard from "./MovieCard";
import MovieCardSkeleton from "./MovieCardSkeleton";

interface LatestMoviesProps {
  selectedVJ?: string;
  genreFilter?: string;
  typeFilter?: string;
}

const LatestMovies = ({ selectedVJ, genreFilter, typeFilter }: LatestMoviesProps) => {
  const { movies, loading } = useMovies();
  let filtered = movies;
  if (selectedVJ) filtered = filtered.filter(m => m.vjName === selectedVJ);
  if (genreFilter) filtered = filtered.filter(m => m.genre.toLowerCase().includes(genreFilter.toLowerCase()));
  if (typeFilter) filtered = filtered.filter(m => m.type === typeFilter);

  return (
    <section className="mb-5">
      {/* Section header */}
      <div className="flex items-center gap-3 mb-3">
        <div className="flex items-center gap-2">
          <div className="w-0.5 h-4 bg-primary rounded-full" />
          <span className="text-foreground text-[11px] font-black tracking-widest uppercase">All Content</span>
        </div>
        <span className="text-muted-foreground text-[9px] font-semibold">Recently Added</span>
        {!loading && (
          <span className="ml-auto text-muted-foreground text-[9px] font-semibold tracking-wide">{filtered.length} Titles</span>
        )}
      </div>

      {loading ? (
        <div className="grid grid-cols-3 md:grid-cols-5 xl:grid-cols-6 gap-1.5">
          {Array.from({ length: 12 }).map((_, i) => <MovieCardSkeleton key={i} />)}
        </div>
      ) : filtered.length === 0 ? (
        <p className="text-muted-foreground text-[10px] py-4 text-center">No movies found.</p>
      ) : (
        <div className="grid grid-cols-3 md:grid-cols-5 xl:grid-cols-6 gap-1.5">
          {filtered.map((movie, i) => (
            <MovieCard key={movie.id} movie={movie} rank={i + 1} />
          ))}
        </div>
      )}
    </section>
  );
};

export default LatestMovies;
