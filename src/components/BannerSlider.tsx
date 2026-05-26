import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { Carousel, CarouselContent, CarouselItem } from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";
import BannerSkeleton from "./BannerSkeleton";
import { subscribeCarousels, FireCarousel } from "@/lib/carousels";
import { ChevronRight, Play } from "lucide-react";

const BannerSlider = () => {
  const [carousels, setCarousels] = useState<FireCarousel[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);
  const autoplayPlugin = useRef(Autoplay({ delay: 4500, stopOnInteraction: false }));

  useEffect(() => {
    const unsub = subscribeCarousels((data) => {
      setCarousels(data);
      setLoading(false);
    });
    return unsub;
  }, []);

  if (loading) return <BannerSkeleton />;
  if (carousels.length === 0) return null;

  const BannerContent = ({ item }: { item: FireCarousel }) => (
    <div className="relative block overflow-hidden group" style={{ height: "clamp(160px, 32vw, 360px)" }}>
      {/* Background image */}
      <img
        src={item.imageUrl}
        alt={item.title}
        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
      />

      {/* Gradient overlays */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-transparent to-transparent" />

      {/* Content */}
      {item.title && (
        <div className="absolute bottom-0 left-0 right-0 p-4 md:p-6">
          <div className="flex items-end justify-between">
            <div className="flex-1 min-w-0">
              <h3 className="text-white text-base md:text-2xl font-black leading-tight tracking-tight drop-shadow-lg line-clamp-2">
                {item.title}
              </h3>
              {item.description && (
                <p className="text-white/70 text-[10px] md:text-xs mt-1 line-clamp-2 max-w-md font-medium">
                  {item.description}
                </p>
              )}
            </div>
            {item.linkUrl && (
              <div className="flex-shrink-0 ml-3">
                <div className="flex items-center gap-1 bg-primary text-primary-foreground px-3 py-1.5 rounded-full text-[10px] md:text-xs font-black tracking-wider opacity-0 group-hover:opacity-100 transition-all duration-200 translate-y-2 group-hover:translate-y-0">
                  <Play className="w-3 h-3 fill-current" /> WATCH
                </div>
              </div>
            )}
          </div>

          {/* Dots indicator */}
          {carousels.length > 1 && (
            <div className="flex items-center gap-1.5 mt-3">
              {carousels.map((_, i) => (
                <div
                  key={i}
                  className={`slider-dot ${i === activeIndex ? "active" : ""}`}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Edge shimmer */}
      <div className="absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-background/20 to-transparent pointer-events-none" />
    </div>
  );

  return (
    <div className="relative mb-5 -mx-3 md:mx-0 md:rounded-xl overflow-hidden">
      <Carousel
        opts={{ loop: true, align: "start" }}
        plugins={[autoplayPlugin.current]}
        className="w-full"
        setApi={(api) => {
          if (!api) return;
          api.on("select", () => setActiveIndex(api.selectedScrollSnap()));
        }}
      >
        <CarouselContent className="-ml-0">
          {carousels.map((item) => (
            <CarouselItem key={item.id} className="pl-0">
              {item.linkUrl ? (
                <Link to={item.linkUrl} className="block cursor-pointer">
                  <BannerContent item={item} />
                </Link>
              ) : (
                <BannerContent item={item} />
              )}
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>
    </div>
  );
};

export default BannerSlider;
