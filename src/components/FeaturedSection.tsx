import { useFeaturedMovies } from "@/hooks/useFirestore";
import MovieCard from "./MovieCard";
import MovieCardSkeleton from "./MovieCardSkeleton";

interface FeaturedSectionProps {
  selectedVJ?: string;
  genreFilter?: string;
  typeFilter?: string;
}

const FeaturedSection = ({ selectedVJ, genreFilter, typeFilter }: FeaturedSectionProps) => {
  const { movies, loading } = useFeaturedMovies();
  let filtered = movies;
  if (selectedVJ) filtered = filtered.filter(m => m.vjName === selectedVJ);
  if (genreFilter) filtered = filtered.filter(m => m.genre.toLowerCase().includes(genreFilter.toLowerCase()));
  if (typeFilter) filtered = filtered.filter(m => m.type === typeFilter);

  if (!loading && filtered.length === 0) return null;

  return (
    <section className="mb-5">
      {/* Section header */}
      <div className="flex items-center gap-3 mb-3">
        <div className="flex items-center gap-2">
          <div className="w-0.5 h-4 bg-primary rounded-full" />
          <span className="text-foreground text-[11px] font-black tracking-widest uppercase">Featured</span>
        </div>
        {!loading && (
          <span className="text-muted-foreground text-[9px] font-semibold tracking-wide">{filtered.length} Titles</span>
        )}
      </div>

      {loading ? (
        <div className="grid grid-cols-3 md:grid-cols-5 xl:grid-cols-6 gap-1.5">
          {Array.from({ length: 8 }).map((_, i) => <MovieCardSkeleton key={i} />)}
        </div>
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

export default FeaturedSection;
