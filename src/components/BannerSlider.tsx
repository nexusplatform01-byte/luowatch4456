import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { Carousel, CarouselContent, CarouselItem } from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";
import BannerSkeleton from "./BannerSkeleton";
import { subscribeCarousels, FireCarousel } from "@/lib/carousels";
import { Play } from "lucide-react";

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
    <div className="relative w-full overflow-hidden" style={{ height: "clamp(160px, 32vw, 360px)" }}>
      <img
        src={item.imageUrl}
        alt={item.title}
        className="w-full h-full object-cover object-center"
      />

      {/* Bottom gradient for text legibility only */}
      <div className="absolute bottom-0 left-0 right-0 h-2/3 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />

      {item.title && (
        <div className="absolute bottom-0 left-0 right-0 p-3 md:p-5">
          <div className="flex items-end justify-between gap-2">
            <div className="flex-1 min-w-0">
              <h3 className="text-white text-sm md:text-2xl font-black leading-tight tracking-tight drop-shadow-lg line-clamp-2">
                {item.title}
              </h3>
              {item.description && (
                <p className="text-white/75 text-[10px] md:text-xs mt-0.5 line-clamp-1 md:line-clamp-2 font-medium">
                  {item.description}
                </p>
              )}
            </div>
            {item.linkUrl && (
              <div className="flex-shrink-0">
                <div className="flex items-center gap-1 bg-primary text-primary-foreground px-2.5 py-1.5 text-[9px] md:text-xs font-black tracking-wider">
                  <Play className="w-2.5 h-2.5 fill-current" /> WATCH
                </div>
              </div>
            )}
          </div>

          {carousels.length > 1 && (
            <div className="flex items-center gap-1 mt-2">
              {carousels.map((_, i) => (
                <div
                  key={i}
                  className={`h-0.5 rounded-full transition-all duration-300 ${i === activeIndex ? "w-4 bg-primary" : "w-1.5 bg-white/40"}`}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );

  return (
    <div className="relative mb-5 -mx-3 md:mx-0 overflow-hidden">
      <Carousel
        opts={{ loop: true, align: "start" }}
        plugins={[autoplayPlugin.current]}
        className="w-full"
        setApi={(api) => {
          if (!api) return;
          api.on("select", () => setActiveIndex(api.selectedScrollSnap()));
        }}
      >
        <CarouselContent className="-ml-0 gap-0">
          {carousels.map((item) => (
            <CarouselItem key={item.id} className="pl-0 basis-full">
              {item.linkUrl ? (
                <Link to={item.linkUrl} className="block">
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
