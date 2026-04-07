import { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { subscribeMusicSlides, FireMusicSlide } from "@/lib/carousels";

const MusicHeroSlider = () => {
  const [slides, setSlides] = useState<FireMusicSlide[]>([]);
  const [current, setCurrent] = useState(0);
  const [fade, setFade] = useState(true);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const unsub = subscribeMusicSlides(setSlides);
    return unsub;
  }, []);

  const goTo = (idx: number) => {
    setFade(false);
    setTimeout(() => {
      setCurrent(idx);
      setFade(true);
    }, 200);
  };

  const prev = () => goTo((current - 1 + slides.length) % slides.length);
  const next = () => goTo((current + 1) % slides.length);

  useEffect(() => {
    if (slides.length <= 1) return;
    timerRef.current = setTimeout(next, 5000);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [current, slides.length]);

  if (slides.length === 0) return null;

  const slide = slides[current];
  const inner = (
    <div className={`relative w-full transition-opacity duration-300 ${fade ? "opacity-100" : "opacity-0"}`}>
      <img
        src={slide.imageUrl}
        alt={slide.title}
        className="w-full h-36 md:h-56 object-cover rounded-lg"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent rounded-lg" />
      {(slide.title || slide.description) && (
        <div className="absolute bottom-0 left-0 right-0 p-3 md:p-4">
          {slide.title && <h2 className="text-white text-xs md:text-sm font-bold leading-tight line-clamp-1">{slide.title}</h2>}
          {slide.description && <p className="text-white/80 text-[9px] md:text-[11px] mt-0.5 line-clamp-1">{slide.description}</p>}
        </div>
      )}
    </div>
  );

  return (
    <div className="relative mb-4 select-none">
      {slide.linkUrl ? (
        <Link to={slide.linkUrl} className="block">
          {inner}
        </Link>
      ) : (
        inner
      )}

      {slides.length > 1 && (
        <>
          <button
            onClick={(e) => { e.preventDefault(); prev(); }}
            className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/75 text-white rounded-full p-1 transition-colors z-10"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={(e) => { e.preventDefault(); next(); }}
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/75 text-white rounded-full p-1 transition-colors z-10"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1 z-10">
            {slides.map((_, i) => (
              <button
                key={i}
                onClick={(e) => { e.preventDefault(); goTo(i); }}
                className={`w-1.5 h-1.5 rounded-full transition-all ${i === current ? "bg-white w-3" : "bg-white/50"}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default MusicHeroSlider;
