import { Link, useLocation, useNavigate } from "react-router-dom";
import { User, LogOut, LayoutDashboard, Shield } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import SearchResults from "./SearchResults";
import InstallAppButton from "./InstallAppButton";
import logo from "@/assets/logo.png";

const Header = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, setShowAuthModal, setAuthModalTab, logout } = useAuth();

  const getDashboardPath = () => {
    if (!user) return "/";
    switch (user.role) {
      case "vj": return "/vj-dashboard";
      case "musician": return "/musician-dashboard";
      case "tiktoker": return "/tiktoker-dashboard";
      default: return "/";
    }
  };

  const navItems = [
    { label: "MOVIES", path: "/" },
    { label: "MUSIC", path: "/music" },
    { label: "LIVE TV", path: "/live-tv" },
    { label: "GAMES", path: "/games" },
  ];

  return (
    <header className="glass-header sticky top-0 z-50 hidden md:block">
      <div className="w-full px-4 md:px-8 xl:px-12">
        <div className="flex items-center justify-between h-12">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 flex-shrink-0">
            <img src={logo} alt="LUO WATCH" className="w-7 h-7 rounded" />
            <span className="text-primary font-black text-sm tracking-widest uppercase">LUO WATCH</span>
          </Link>

          {/* Nav */}
          <nav className="flex items-center gap-1">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    "relative px-3 py-1.5 rounded text-[11px] font-bold tracking-widest transition-all duration-200",
                    isActive
                      ? "text-primary"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {item.label}
                  {isActive && <span className="nav-active-dot" />}
                </Link>
              );
            })}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <InstallAppButton />
            <SearchResults />

            {user ? (
              <div className="flex items-center gap-1.5">
                {(user.email === "luowatch0@gmail.com" || user.email === "mainplatform.nexus@gmail.com") && (
                  <button
                    onClick={() => navigate("/admin")}
                    className="bg-primary/15 text-primary border border-primary/30 px-2.5 py-1 rounded text-[10px] font-bold tracking-wider hover:bg-primary/25 transition-all flex items-center gap-1"
                  >
                    <Shield className="w-3 h-3" /> ADMIN
                  </button>
                )}
                {user.role !== "viewer" && (
                  <button
                    onClick={() => navigate(getDashboardPath())}
                    className="bg-white/5 text-foreground border border-white/10 px-2.5 py-1 rounded text-[10px] font-bold tracking-wider hover:bg-white/10 transition-all flex items-center gap-1"
                  >
                    <LayoutDashboard className="w-3 h-3" /> DASHBOARD
                  </button>
                )}
                <div className="flex items-center gap-1.5 ml-1 pl-2 border-l border-white/10">
                  <span className="text-foreground text-[10px] font-bold tracking-wide uppercase">{user.firstName}</span>
                  <button onClick={logout} className="text-muted-foreground hover:text-destructive transition-colors p-1 rounded">
                    <LogOut className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => { setAuthModalTab("login"); setShowAuthModal(true); }}
                className="bg-primary text-primary-foreground px-4 py-1.5 rounded text-[11px] font-bold tracking-wider hover:bg-primary/90 transition-all btn-primary-glow flex items-center gap-1.5"
              >
                <User className="w-3.5 h-3.5" /> LOGIN
              </button>
            )}
          </div>

        </div>
      </div>
    </header>
  );
};

export default Header;
