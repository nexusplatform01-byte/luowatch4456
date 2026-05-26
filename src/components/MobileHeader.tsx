import { useState } from "react";
import { Link, useNavigate, useSearchParams, useLocation } from "react-router-dom";
import { Search, User, LogOut, LayoutDashboard, X, Film, Tv, ChevronDown, ChevronRight } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { categories } from "@/data/categories";
import SearchResults from "./SearchResults";
import InstallAppButton from "./InstallAppButton";
import logo from "@/assets/logo.png";

const MobileHeader = () => {
  const { user, setShowAuthModal, setAuthModalTab, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [showSearch, setShowSearch] = useState(false);
  const [showCategories, setShowCategories] = useState(false);

  const isHomePage = location.pathname === "/";
  const currentType = searchParams.get("type") || "movie";

  const handleTypeSwitch = (type: string) => {
    const params = new URLSearchParams(searchParams);
    params.set("type", type);
    setSearchParams(params);
  };

  const getDashboardPath = () => {
    if (!user) return "/";
    switch (user.role) {
      case "vj": return "/vj-dashboard";
      case "musician": return "/musician-dashboard";
      case "tiktoker": return "/tiktoker-dashboard";
      default: return "/";
    }
  };

  return (
    <header className="glass-header sticky top-0 z-50 md:hidden">
      <div className="flex items-center justify-between px-3 h-12">

        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 flex-shrink-0">
          <img src={logo} alt="LUO WATCH" className="w-6 h-6 rounded" />
          <span className="text-primary font-black text-sm tracking-widest uppercase">LUO</span>
        </Link>

        {/* Controls */}
        <div className="flex items-center gap-1.5">
          <InstallAppButton />

          {isHomePage && (
            <>
              <div className="flex bg-white/5 border border-white/10 rounded-md overflow-hidden">
                <button
                  onClick={() => handleTypeSwitch("movie")}
                  className={`flex items-center gap-0.5 px-2.5 py-1 text-[9px] font-black tracking-wider uppercase transition-all ${
                    currentType === "movie"
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground"
                  }`}
                >
                  <Film className="w-2.5 h-2.5" /> Movies
                </button>
                <button
                  onClick={() => handleTypeSwitch("series")}
                  className={`flex items-center gap-0.5 px-2.5 py-1 text-[9px] font-black tracking-wider uppercase transition-all ${
                    currentType === "series"
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground"
                  }`}
                >
                  <Tv className="w-2.5 h-2.5" /> Series
                </button>
              </div>
              <button
                onClick={() => { setShowCategories(!showCategories); setShowSearch(false); }}
                className="text-muted-foreground hover:text-foreground transition-colors p-1"
              >
                <ChevronDown className={`w-4 h-4 transition-transform ${showCategories ? "rotate-180" : ""}`} />
              </button>
            </>
          )}

          <button
            onClick={() => { setShowSearch(!showSearch); setShowCategories(false); }}
            className="text-muted-foreground hover:text-primary transition-colors p-1"
          >
            {showSearch ? <X className="w-4 h-4" /> : <Search className="w-4 h-4" />}
          </button>

          {user ? (
            <div className="flex items-center gap-1">
              {user.role !== "viewer" && (
                <button onClick={() => navigate(getDashboardPath())} className="text-muted-foreground hover:text-primary transition-colors p-1">
                  <LayoutDashboard className="w-4 h-4" />
                </button>
              )}
              <button onClick={logout} className="text-muted-foreground hover:text-destructive transition-colors p-1">
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => { setAuthModalTab("login"); setShowAuthModal(true); }}
              className="bg-primary text-primary-foreground px-3 py-1 rounded text-[10px] font-black tracking-wider flex items-center gap-1"
            >
              <User className="w-3 h-3" /> LOGIN
            </button>
          )}
        </div>
      </div>

      {/* Search panel */}
      {showSearch && (
        <div className="px-3 pb-2.5 pt-1 border-t border-white/5">
          <SearchResults onClose={() => setShowSearch(false)} />
        </div>
      )}

      {/* Categories panel */}
      {showCategories && isHomePage && (
        <div className="px-3 pb-3 pt-1 border-t border-white/5 max-h-56 overflow-y-auto">
          <ul className="grid grid-cols-2 gap-1">
            {categories.map((cat) => (
              <li key={cat.name}>
                <Link
                  to={`/?genre=${encodeURIComponent(cat.name)}&type=${currentType}`}
                  onClick={() => setShowCategories(false)}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded text-[10px] font-semibold text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all"
                >
                  <ChevronRight className="w-2.5 h-2.5 text-primary flex-shrink-0" />
                  {cat.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </header>
  );
};

export default MobileHeader;
