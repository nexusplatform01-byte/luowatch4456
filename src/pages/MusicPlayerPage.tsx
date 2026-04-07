import { useParams, Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { Share2, Download, X, Loader2 } from "lucide-react";
import { useMusicById, useMusicVideos } from "@/hooks/useFirestore";
import { incrementMusicPlays, logActivity } from "@/lib/firestore";
import { useAuth } from "@/contexts/AuthContext";
import { creditMusicianDownload } from "@/lib/earnings";
import CommentSection from "@/components/CommentSection";
import MusicVideoPlayer from "@/components/MusicVideoPlayer";
import SEOHead, { buildMusicStructuredData } from "@/components/SEOHead";
import { toast } from "sonner";
import { updateDoc, doc, increment } from "firebase/firestore";
import { db } from "@/lib/firebase";

const MusicPlayerPage = () => {
  const { id } = useParams();
  const { music: video } = useMusicById(id || "");
  const { music: allMusic } = useMusicVideos();
  const { user, setShowAuthModal, setAuthModalTab } = useAuth();
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [showDownloadModal, setShowDownloadModal] = useState(false);

  useEffect(() => {
    if (!id || !video) return;
    incrementMusicPlays(id).catch(() => {});
    if (user) {
      logActivity({
        type: "view", contentType: "music", contentId: id,
        contentTitle: video.title, userId: user.id,
        userName: `${user.firstName} ${user.lastName}`.trim() || user.email,
      }).catch(() => {});
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, !!video]);

  const relatedVideos = allMusic.filter(v => v.id !== id);

  const handleShare = async () => {
    if (!video) return;
    const url = window.location.href;
    if (user) logActivity({ type: "share", contentType: "music", contentId: id!, contentTitle: video.title, userId: user.id, userName: `${user.firstName} ${user.lastName}`.trim() || user.email }).catch(() => {});
    if (navigator.share) {
      try { await navigator.share({ title: video.title, url }); } catch {}
    } else {
      await navigator.clipboard.writeText(url);
      toast.success("Link copied!");
    }
  };

  const getDownloadEmbedUrl = () => {
    if (!video?.videoUrl) return "";
    if (video.videoUrl.includes("embed.dlsrv.online")) return video.videoUrl;
    const videoId = video.videoUrl.match(/videoId=([a-zA-Z0-9_-]+)/)?.[1];
    return videoId ? `https://embed.dlsrv.online/v1/full?videoId=${videoId}` : video.videoUrl;
  };

  const handleDownload = async () => {
    if (!video) return;
    if (!user) {
      setAuthModalTab("login");
      setShowAuthModal(true);
      toast.error("Please log in to download");
      return;
    }
    if (!video.videoUrl) { toast.error("No download available"); return; }
    try {
      await updateDoc(doc(db, "musicVideos", id!), { downloads: increment(1) });
      if (video.musicianId && video.musicianId !== "admin") {
        creditMusicianDownload(
          video.musicianId, video.musicianName || video.artist,
          id!, video.title, user.id,
          `${user.firstName} ${user.lastName}`.trim() || user.email
        ).catch(() => {});
      }
      logActivity({ type: "download", contentType: "music", contentId: id!, contentTitle: video.title, userId: user.id, userName: `${user.firstName} ${user.lastName}`.trim() || user.email }).catch(() => {});
    } catch {}
    setShowDownloadModal(true);
  };

  const artistName = video?.musicianName || video?.artist || "LUO WATCH";

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      {video && (
        <SEOHead
          title={`${video.title} — ${artistName}`}
          description={`Watch and download ${video.title} by ${artistName} for free on LUO WATCH. Stream Luo music videos online.`}
          image={video.thumbnailUrl}
          url={`/music/${id}`}
          type="music.song"
          artist={artistName}
          keywords={`${video.title}, ${artistName}, Luo music, Luo music video, Uganda music, download ${video.title}`}
          structuredData={buildMusicStructuredData(video)}
        />
      )}
      <div className="w-full px-4 md:px-6 xl:px-10 py-3">
        <div className="flex gap-4">

          <main className="flex-1 min-w-0">
            <div className="w-full aspect-video bg-black rounded-xl overflow-hidden mb-3 shadow-lg">
              {video?.videoUrl ? (
                <MusicVideoPlayer
                  src={video.videoUrl}
                  poster={video.thumbnailUrl}
                  title={video.title}
                  artist={video.musicianName || video.artist}
                />
              ) : video?.thumbnailUrl ? (
                <img src={video.thumbnailUrl} alt={video.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Loader2 className="w-10 h-10 animate-spin text-white/40" />
                </div>
              )}
            </div>

            {video ? (
              <h1 className="text-foreground text-sm font-bold mb-2 leading-tight">{video.title}</h1>
            ) : (
              <div className="h-4 w-2/3 bg-secondary rounded animate-pulse mb-2" />
            )}

            <div className="flex items-center justify-between flex-wrap gap-2 mb-4">
              {video ? (
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-[11px] font-bold text-muted-foreground">
                    {(video.musicianName || video.artist)?.[0]?.toUpperCase() || "M"}
                  </div>
                  <div>
                    <span className="text-foreground text-[11px] font-bold">{video.musicianName || video.artist}</span>
                    {video.verified && <span className="text-muted-foreground text-[10px] ml-1">✓</span>}
                  </div>
                  <button
                    onClick={() => setIsSubscribed(!isSubscribed)}
                    className={`ml-2 px-3 py-1 rounded-full text-[10px] font-bold transition-colors ${isSubscribed ? "bg-secondary text-secondary-foreground" : "bg-foreground text-background"}`}
                  >
                    {isSubscribed ? "Subscribed" : "Subscribe"}
                  </button>
                </div>
              ) : (
                <div className="h-8 w-48 bg-secondary rounded animate-pulse" />
              )}

              <div className="flex items-center gap-1">
                <button onClick={handleShare} className="flex items-center gap-1 bg-secondary rounded-full px-3 py-1.5 text-[10px] text-foreground hover:bg-muted transition-colors">
                  <Share2 className="w-3.5 h-3.5" /> Share
                </button>
                <button
                  onClick={handleDownload}
                  className="flex items-center gap-1 bg-primary rounded-full px-3 py-1.5 text-[10px] text-primary-foreground hover:bg-primary/90 transition-colors"
                >
                  <Download className="w-3.5 h-3.5" /> Download Free
                </button>
              </div>
            </div>

            {video && (
              <div className="bg-secondary rounded-lg p-3 mb-4">
                <div className="flex items-center gap-2 text-[11px] text-foreground font-bold">
                  <span>{video.plays} plays</span>
                  {video.genre && <><span>·</span><span>{video.genre}</span></>}
                  {video.year && <><span>·</span><span>{video.year}</span></>}
                </div>
              </div>
            )}

            <CommentSection contentId={id || ""} contentType="music" />
          </main>

          <aside className="w-72 flex-shrink-0 space-y-2 hidden md:block">
            {relatedVideos.map((v) => (
              <Link to={`/music/${v.id}`} key={v.id} className="flex gap-2 group">
                <div className="relative w-40 flex-shrink-0">
                  {v.thumbnailUrl
                    ? <img src={v.thumbnailUrl} alt="" className="w-full aspect-video object-cover rounded group-hover:scale-105 transition-transform" />
                    : <div className="w-full aspect-video bg-secondary rounded" />
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-foreground text-[10px] font-semibold leading-tight line-clamp-2">{v.title}</p>
                  <p className="text-muted-foreground text-[9px] mt-1">{v.musicianName || v.artist}</p>
                  <p className="text-muted-foreground text-[9px]">{v.plays} plays</p>
                </div>
              </Link>
            ))}
          </aside>

        </div>
      </div>

      {/* Download Modal */}
      {showDownloadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={() => setShowDownloadModal(false)}>
          <div className="relative bg-background rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <div>
                <h2 className="text-foreground text-sm font-bold">{video?.title}</h2>
                <p className="text-muted-foreground text-[10px]">Select quality and format to download</p>
              </div>
              <button onClick={() => setShowDownloadModal(false)} className="text-muted-foreground hover:text-foreground transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="w-full" style={{ height: "420px" }}>
              <iframe
                src={getDownloadEmbedUrl()}
                className="w-full h-full border-0"
                allowFullScreen
                allow="autoplay; fullscreen; picture-in-picture; encrypted-media"
                title="Download"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MusicPlayerPage;
