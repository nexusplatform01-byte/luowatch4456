import { Link, useLocation } from "react-router-dom";
import { Film, Music, Tv, Gamepad2 } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { label: "MOVIES", path: "/", icon: Film },
  { label: "MUSIC", path: "/music", icon: Music },
  { label: "LIVE TV", path: "/live-tv", icon: Tv },
  { label: "GAMES", path: "/games", icon: Gamepad2 },
];

const MobileNav = () => {
  const location = useLocation();

  return (
    <nav className="glass-nav fixed bottom-0 left-0 right-0 z-50 md:hidden safe-area-inset-bottom">
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-xl transition-all duration-200 relative min-w-0 flex-1",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground active:scale-95"
              )}
            >
              {/* Active background glow */}
              {isActive && (
                <span className="absolute inset-0 rounded-xl bg-primary/10" />
              )}

              <item.icon
                className={cn(
                  "w-5 h-5 transition-all duration-200 relative z-10",
                  isActive ? "text-primary scale-110" : "text-muted-foreground"
                )}
                strokeWidth={isActive ? 2.5 : 1.8}
              />
              <span
                className={cn(
                  "text-[8px] font-black tracking-widest relative z-10 transition-all duration-200",
                  isActive ? "text-primary" : "text-muted-foreground"
                )}
              >
                {item.label}
              </span>

              {/* Active dot */}
              {isActive && (
                <span className="absolute top-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default MobileNav;
