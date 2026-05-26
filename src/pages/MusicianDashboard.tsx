import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import {
  LayoutDashboard, Upload, Music, List, Wallet, ArrowDownToLine,
  Receipt, Download, ChevronLeft, Plus, Edit2, Check, X,
  DollarSign, BarChart3, Play, Trash2, Loader2, Youtube, FolderOpen, Image
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useMusicianVideos } from "@/hooks/useFirestore";
import { addMusicVideo, deleteMusicVideo, updateMusicVideo } from "@/lib/firestore";
import { sendWithdrawal, formatPhone, pollPaymentStatus } from "@/lib/payments";
import { subscribeCreatorEarning, getCreatorTransactions, recordWithdrawal, getOrCreateEarning, CreatorEarning, EarningTransaction } from "@/lib/earnings";
import { uploadToR2, formatFileSize, R2UploadProgress } from "@/lib/r2Upload";
import { uploadToS3 } from "@/lib/s3Upload";

function extractYouTubeId(input: string): string | null {
  const dlMatch = input.match(/videoId=([a-zA-Z0-9_-]+)/);
  if (dlMatch) return dlMatch[1];
  const watchMatch = input.match(/[?&]v=([a-zA-Z0-9_-]{11})/);
  if (watchMatch) return watchMatch[1];
  const shortMatch = input.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/);
  if (shortMatch) return shortMatch[1];
  const otherMatch = input.match(/\/(?:shorts|embed)\/([a-zA-Z0-9_-]{11})/);
  if (otherMatch) return otherMatch[1];
  return null;
}

const sidebarItems = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "upload", label: "Upload Music Video", icon: Upload },
  { id: "manage", label: "Manage Videos", icon: List },
  { id: "wallet", label: "Wallet", icon: Wallet },
];

const MONTHLY_THRESHOLD = 10000;
const MONTHLY_PAYOUT = 50000;

const MusicianDashboard = () => {
  const { user } = useAuth();
  const { music: videos, loading } = useMusicianVideos(user?.id || "");
  const [activeTab, setActiveTab] = useState("overview");

  const [vTitle, setVTitle] = useState("");
  const [vArtist, setVArtist] = useState("");
  const [vGenre, setVGenre] = useState("Afrobeat");
  const [vYear, setVYear] = useState("");
  const [vDuration, setVDuration] = useState("");

  const [vYoutubeLink, setVYoutubeLink] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  // File upload mode
  const [uploadMode, setUploadMode] = useState<"youtube" | "file">("youtube");
  const [vVideoFile, setVVideoFile] = useState<File | null>(null);
  const [vThumbnailFile, setVThumbnailFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState<R2UploadProgress | null>(null);
  const [uploadStep, setUploadStep] = useState("");
  const videoInputRef = useRef<HTMLInputElement>(null);
  const thumbInputRef = useRef<HTMLInputElement>(null);

  // Edit
  const [editId, setEditId] = useState<string | null>(null);
  const [editData, setEditData] = useState<any>({});

  // Wallet
  const [wPhone, setWPhone] = useState(""); const [wAmount, setWAmount] = useState(""); const [withdrawing, setWithdrawing] = useState(false);

  // Earnings from Firestore
  const [earning, setEarning] = useState<CreatorEarning | null>(null);
  const [transactions, setTransactions] = useState<EarningTransaction[]>([]);

  useEffect(() => {
    if (user?.id) {
      getOrCreateEarning(user.id, `${user.firstName} ${user.lastName}`.trim() || user.email, "musician").catch(() => {});
      const unsub = subscribeCreatorEarning(user.id, setEarning);
      getCreatorTransactions(user.id).then(setTransactions).catch(() => {});
      return unsub;
    }
  }, [user?.id]);

  const totalPlays = videos.reduce((s, v) => s + (v.plays || 0), 0);
  const totalDownloads = earning?.totalDownloads || 0;
  const monthlyDownloads = earning?.monthlyDownloads || 0;
  const totalEarned = earning?.totalEarned || 0;
  const totalWithdrawn = earning?.totalWithdrawn || 0;
  const balance = earning?.balance || 0;

  const now = new Date();
  const isSaturday = now.getDay() === 6;
  const isWithdrawWindow = isSaturday && now.getHours() >= 12;

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vTitle) { toast.error("Song title is required"); return; }
    if (!vYoutubeLink.trim()) { toast.error("Please enter a YouTube link"); return; }
    if (!user) return;

    const videoId = extractYouTubeId(vYoutubeLink.trim());
    if (!videoId) { toast.error("Could not extract video ID from that link"); return; }

    const videoUrl = `https://embed.dlsrv.online/v1/full?videoId=${videoId}`;
    const thumbnailUrl = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;

    setIsUploading(true);
    try {
      await addMusicVideo({
        title: vTitle,
        artist: vArtist || `${user.firstName} ${user.lastName}`.trim(),
        genre: vGenre,
        year: vYear,
        duration: vDuration,
        thumbnailUrl,
        videoUrl,
        musicianId: user.id,
        musicianName: `${user.firstName} ${user.lastName}`.trim() || user.email,
        verified: true,
      });
      setVTitle(""); setVArtist(""); setVYear(""); setVDuration(""); setVYoutubeLink("");
      toast.success("Music video uploaded successfully!");
    } catch (err: any) {
      toast.error("Upload failed: " + (err.message || "Unknown error"));
    }
    setIsUploading(false);
  };

  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vTitle) { toast.error("Song title is required"); return; }
    if (!vVideoFile) { toast.error("Please select a video file"); return; }
    if (!user) return;

    setIsUploading(true);
    try {
      let thumbnailUrl = "";
      if (vThumbnailFile) {
        setUploadStep("Uploading thumbnail...");
        thumbnailUrl = await uploadToS3(vThumbnailFile, "thumbnails");
      }

      setUploadStep("Uploading video...");
      setUploadProgress(null);
      const videoUrl = await uploadToR2(vVideoFile, (progress) => {
        setUploadProgress(progress);
      });

      setUploadStep("Saving...");
      await addMusicVideo({
        title: vTitle,
        artist: vArtist || `${user.firstName} ${user.lastName}`.trim(),
        genre: vGenre,
        year: vYear,
        duration: vDuration,
        thumbnailUrl,
        videoUrl,
        musicianId: user.id,
        musicianName: `${user.firstName} ${user.lastName}`.trim() || user.email,
        verified: true,
      });

      setVTitle(""); setVArtist(""); setVYear(""); setVDuration("");
      setVVideoFile(null); setVThumbnailFile(null);
      setUploadProgress(null); setUploadStep("");
      if (videoInputRef.current) videoInputRef.current.value = "";
      if (thumbInputRef.current) thumbInputRef.current.value = "";
      toast.success("Music video uploaded successfully!");
    } catch (err: any) {
      toast.error("Upload failed: " + (err.message || "Unknown error"));
      setUploadStep("");
      setUploadProgress(null);
    }
    setIsUploading(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this video?")) return;
    try { await deleteMusicVideo(id); toast.success("Deleted"); } catch { toast.error("Failed"); }
  };

  const handleSaveEdit = async (id: string) => {
    try { await updateMusicVideo(id, editData); setEditId(null); toast.success("Updated!"); } catch { toast.error("Failed"); }
  };

  const calcWithdrawFee = (amount: number): number => {
    if (amount <= 0) return 0;
    if (amount <= 5000) return Math.round(amount * 0.20);
    return Math.round(amount * 0.10);
  };

  const wAmountNum = Number(wAmount) || 0;
  const wFee = calcWithdrawFee(wAmountNum);
  const wNet = wAmountNum - wFee;

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isWithdrawWindow) { toast.error("Withdrawals only on Saturdays 12PM - Midnight"); return; }
    if (!wPhone || !wAmount || wAmountNum <= 0) { toast.error("Invalid amount or phone"); return; }
    if (wAmountNum < 1000) { toast.error("Minimum withdrawal is UGX 1,000"); return; }
    if (wAmountNum > balance) { toast.error("Insufficient balance"); return; }
    if (!user) return;
    setWithdrawing(true);
    const creatorName = `${user.firstName} ${user.lastName}`.trim() || user.email;
    const formattedPhone = formatPhone(wPhone);
    try {
      const res = await sendWithdrawal(formattedPhone, wNet, "Musician earnings withdrawal");
      if (!res.success) {
        await recordWithdrawal(user.id, creatorName, wAmountNum, formattedPhone, "failed");
        toast.error(res.message || "Withdrawal failed");
        setWithdrawing(false);
        return;
      }
      if (res.internal_reference) {
        toast.info("Processing payment, please wait...");
        pollPaymentStatus(
          res.internal_reference,
          async () => {
            await recordWithdrawal(user.id, creatorName, wAmountNum, formattedPhone, "completed");
            toast.success(`Withdrawal successful! ${formatUGX(wNet)} sent to your phone.`);
            setWPhone(""); setWAmount("");
            getCreatorTransactions(user.id).then(setTransactions).catch(() => {});
            setWithdrawing(false);
          },
          async (data) => {
            await recordWithdrawal(user.id, creatorName, wAmountNum, formattedPhone, "failed");
            toast.error(data.message || "Withdrawal could not be completed. Balance not deducted.");
            setWithdrawing(false);
          },
          () => {}
        );
      } else {
        await recordWithdrawal(user.id, creatorName, wAmountNum, formattedPhone, "completed");
        toast.success(`Withdrawal successful! ${formatUGX(wNet)} sent to your phone.`);
        setWPhone(""); setWAmount("");
        getCreatorTransactions(user.id).then(setTransactions).catch(() => {});
        setWithdrawing(false);
      }
    } catch {
      toast.error("Withdrawal failed");
      setWithdrawing(false);
    }
  };

  const formatUGX = (n: number) => `UGX ${n.toLocaleString()}`;
  const inputCls = "w-full bg-secondary text-foreground text-xs px-3 py-2 rounded border border-border focus:outline-none focus:ring-1 focus:ring-primary";

  const stats = [
    { label: "Total Videos", value: String(videos.length), icon: Music, color: "text-primary" },
    { label: "Total Plays", value: String(totalPlays), icon: Play, color: "text-badge-hd" },
    { label: "Monthly Downloads", value: `${monthlyDownloads} / ${MONTHLY_THRESHOLD}`, icon: Download, color: "text-badge-new" },
    { label: "Balance", value: formatUGX(balance), icon: DollarSign, color: "text-accent" },
  ];

  const milestoneProgress = Math.min((monthlyDownloads / MONTHLY_THRESHOLD) * 100, 100);

  return (
    <div className="min-h-screen bg-background">
      <div className="flex">
        <aside className="w-48 bg-card border-r border-border min-h-screen flex-shrink-0 hidden md:block">
          <div className="p-3 border-b border-border"><Link to="/" className="text-primary text-xs font-bold flex items-center gap-1"><ChevronLeft className="w-3 h-3" /> Back to LUO WATCH</Link></div>
          <div className="p-2">
            <p className="text-[9px] text-muted-foreground uppercase font-bold px-2 mb-2">Musician Dashboard</p>
            {sidebarItems.map((item) => (
              <button key={item.id} onClick={() => setActiveTab(item.id)} className={cn("w-full flex items-center gap-2 px-2 py-1.5 rounded text-[11px] font-semibold transition-colors mb-0.5", activeTab === item.id ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground hover:bg-secondary")}>
                <item.icon className="w-3.5 h-3.5" />{item.label}
              </button>
            ))}
          </div>
        </aside>

        <div className="md:hidden fixed top-11 left-0 right-0 z-40 bg-card border-b border-border overflow-x-auto">
          <div className="flex gap-1 p-2">
            {sidebarItems.map((item) => (
              <button key={item.id} onClick={() => setActiveTab(item.id)} className={cn("flex items-center gap-1 px-2 py-1 rounded text-[9px] font-semibold whitespace-nowrap", activeTab === item.id ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground")}>
                <item.icon className="w-3 h-3" />{item.label}
              </button>
            ))}
          </div>
        </div>

        <main className="flex-1 p-4 md:p-6 mt-10 md:mt-0 mb-14 md:mb-0">
          {activeTab === "overview" && (
            <div>
              <h2 className="text-foreground text-sm font-bold mb-4">Overview</h2>
              
              {/* Monthly Milestone Progress */}
              <div className="bg-card border border-border rounded-lg p-3 mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-foreground text-[11px] font-bold">🎯 Monthly Download Milestone</span>
                  <span className="text-[10px] text-muted-foreground">{monthlyDownloads} / {MONTHLY_THRESHOLD.toLocaleString()}</span>
                </div>
                <div className="w-full bg-secondary rounded-full h-3 mb-1.5 overflow-hidden">
                  <div className="bg-gradient-to-r from-primary to-accent h-3 rounded-full transition-all" style={{ width: `${milestoneProgress}%` }} />
                </div>
                <p className="text-[9px] text-muted-foreground">
                  Reach {MONTHLY_THRESHOLD.toLocaleString()} confirmed downloads this month to earn <span className="text-primary font-bold">{formatUGX(MONTHLY_PAYOUT)}</span>
                </p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                {stats.map((s) => (
                  <div key={s.label} className="bg-card border border-border rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2"><s.icon className={cn("w-4 h-4", s.color)} /><BarChart3 className="w-3 h-3 text-muted-foreground" /></div>
                    <p className="text-foreground text-base font-bold">{s.value}</p>
                    <p className="text-[10px] text-muted-foreground">{s.label}</p>
                  </div>
                ))}
              </div>
              {videos.length > 0 && (
                <>
                  <h3 className="text-foreground text-xs font-bold mb-2">Recent Uploads</h3>
                  <div className="bg-card border border-border rounded-lg overflow-hidden">
                    <table className="w-full text-[11px]">
                      <thead><tr className="border-b border-border"><th className="text-left text-muted-foreground font-semibold p-2">Title</th><th className="text-left text-muted-foreground font-semibold p-2">Plays</th><th className="text-left text-muted-foreground font-semibold p-2">Status</th></tr></thead>
                      <tbody>{videos.slice(0, 5).map(v => (<tr key={v.id} className="border-b border-border last:border-0"><td className="p-2 text-foreground font-semibold">{v.title}</td><td className="p-2 text-muted-foreground">{v.plays}</td><td className="p-2"><span className="text-[9px] bg-badge-new text-primary-foreground px-1.5 py-0.5 rounded font-bold">Published</span></td></tr>))}</tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          )}

          {activeTab === "upload" && (
            <div>
              <h2 className="text-foreground text-sm font-bold mb-4">Upload Music Video</h2>
              <div className="bg-card border border-border rounded-lg p-4 max-w-lg">

                {/* Mode toggle */}
                <div className="flex gap-1 mb-4 bg-secondary rounded p-0.5">
                  <button
                    type="button"
                    onClick={() => setUploadMode("youtube")}
                    className={cn("flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded text-[11px] font-bold transition-colors", uploadMode === "youtube" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}
                  >
                    <Youtube className="w-3.5 h-3.5 text-red-500" /> YouTube Link
                  </button>
                  <button
                    type="button"
                    onClick={() => setUploadMode("file")}
                    className={cn("flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded text-[11px] font-bold transition-colors", uploadMode === "file" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}
                  >
                    <FolderOpen className="w-3.5 h-3.5 text-primary" /> Upload File
                  </button>
                </div>

                {/* Shared fields */}
                <form className="space-y-3" onSubmit={uploadMode === "youtube" ? handleUpload : handleFileUpload}>
                  <div>
                    <label className="text-foreground text-[11px] font-semibold mb-1 block">Song Title *</label>
                    <input className={inputCls} placeholder="Enter song title" value={vTitle} onChange={e => setVTitle(e.target.value)} />
                  </div>
                  <div>
                    <label className="text-foreground text-[11px] font-semibold mb-1 block">Artist Name</label>
                    <input className={inputCls} placeholder="Artist name" value={vArtist} onChange={e => setVArtist(e.target.value)} />
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="text-foreground text-[11px] font-semibold mb-1 block">Genre</label>
                      <select className={inputCls} value={vGenre} onChange={e => setVGenre(e.target.value)}>
                        <option>Afrobeat</option><option>Hip Hop</option><option>Gospel</option><option>Dancehall</option><option>RnB</option><option>Traditional</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-foreground text-[11px] font-semibold mb-1 block">Year</label>
                      <input className={inputCls} placeholder="2026" value={vYear} onChange={e => setVYear(e.target.value)} />
                    </div>
                    <div>
                      <label className="text-foreground text-[11px] font-semibold mb-1 block">Duration</label>
                      <input className={inputCls} placeholder="3:45" value={vDuration} onChange={e => setVDuration(e.target.value)} />
                    </div>
                  </div>

                  {uploadMode === "youtube" ? (
                    <div>
                      <label className="text-foreground text-[11px] font-semibold mb-1 block">YouTube Link *</label>
                      <div className="relative">
                        <Youtube className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-red-500" />
                        <input
                          className={`${inputCls} pl-8`}
                          placeholder="https://youtu.be/... or https://youtube.com/watch?v=..."
                          value={vYoutubeLink}
                          onChange={e => setVYoutubeLink(e.target.value)}
                        />
                      </div>
                      {vYoutubeLink && (() => {
                        const id = extractYouTubeId(vYoutubeLink);
                        if (!id) return <p className="text-destructive text-[9px] mt-1">Could not detect video ID — check the link</p>;
                        return (
                          <div className="mt-2 flex items-center gap-2">
                            <img src={`https://img.youtube.com/vi/${id}/mqdefault.jpg`} className="w-20 h-12 rounded object-cover border border-border" alt="thumb" />
                            <p className="text-green-400 text-[9px]">Video ID: {id} ✓</p>
                          </div>
                        );
                      })()}
                      <p className="text-muted-foreground text-[9px] mt-1">Paste any YouTube share link. Thumbnail is auto-fetched.</p>
                    </div>
                  ) : (
                    <>
                      <div>
                        <label className="text-foreground text-[11px] font-semibold mb-1 block">Video File * <span className="text-muted-foreground font-normal">(MP4, max 200MB)</span></label>
                        <div
                          className="border-2 border-dashed border-border rounded-lg p-4 text-center cursor-pointer hover:border-primary transition-colors"
                          onClick={() => videoInputRef.current?.click()}
                        >
                          <input
                            ref={videoInputRef}
                            type="file"
                            accept="video/*"
                            className="hidden"
                            onChange={e => setVVideoFile(e.target.files?.[0] || null)}
                          />
                          {vVideoFile ? (
                            <div className="flex items-center justify-center gap-2">
                              <FolderOpen className="w-4 h-4 text-primary" />
                              <div className="text-left">
                                <p className="text-foreground text-[11px] font-semibold truncate max-w-[200px]">{vVideoFile.name}</p>
                                <p className="text-muted-foreground text-[9px]">{formatFileSize(vVideoFile.size)}</p>
                              </div>
                            </div>
                          ) : (
                            <>
                              <FolderOpen className="w-6 h-6 text-muted-foreground mx-auto mb-1" />
                              <p className="text-muted-foreground text-[10px]">Click to select video file</p>
                            </>
                          )}
                        </div>
                      </div>

                      <div>
                        <label className="text-foreground text-[11px] font-semibold mb-1 block">Thumbnail Image <span className="text-muted-foreground font-normal">(optional)</span></label>
                        <div
                          className="border-2 border-dashed border-border rounded-lg p-3 text-center cursor-pointer hover:border-primary transition-colors"
                          onClick={() => thumbInputRef.current?.click()}
                        >
                          <input
                            ref={thumbInputRef}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={e => setVThumbnailFile(e.target.files?.[0] || null)}
                          />
                          {vThumbnailFile ? (
                            <div className="flex items-center justify-center gap-2">
                              <Image className="w-4 h-4 text-primary" />
                              <div className="text-left">
                                <p className="text-foreground text-[11px] font-semibold truncate max-w-[200px]">{vThumbnailFile.name}</p>
                                <p className="text-muted-foreground text-[9px]">{formatFileSize(vThumbnailFile.size)}</p>
                              </div>
                            </div>
                          ) : (
                            <>
                              <Image className="w-5 h-5 text-muted-foreground mx-auto mb-1" />
                              <p className="text-muted-foreground text-[10px]">Click to select thumbnail</p>
                            </>
                          )}
                        </div>
                      </div>

                      {isUploading && (
                        <div className="bg-secondary rounded-lg p-3 space-y-2">
                          <p className="text-foreground text-[11px] font-semibold">{uploadStep}</p>
                          {uploadProgress && (
                            <>
                              <div className="w-full bg-border rounded-full h-2 overflow-hidden">
                                <div
                                  className="bg-primary h-2 rounded-full transition-all"
                                  style={{ width: `${uploadProgress.percent}%` }}
                                />
                              </div>
                              <p className="text-muted-foreground text-[9px]">
                                {formatFileSize(uploadProgress.loaded)} / {formatFileSize(uploadProgress.total)} — {uploadProgress.percent}%
                              </p>
                            </>
                          )}
                        </div>
                      )}
                    </>
                  )}

                  <button
                    type="submit"
                    disabled={isUploading}
                    className="bg-primary text-primary-foreground px-6 py-2 rounded text-xs font-bold hover:bg-primary/90 transition-colors flex items-center gap-1.5 disabled:opacity-50"
                  >
                    {isUploading
                      ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> {uploadStep || "Uploading..."}</>
                      : <><Plus className="w-3.5 h-3.5" /> Upload Video</>
                    }
                  </button>
                </form>
              </div>
            </div>
          )}

          {activeTab === "manage" && (
            <div>
              <h2 className="text-foreground text-sm font-bold mb-4">Manage Videos</h2>
              {videos.length === 0 ? <p className="text-muted-foreground text-xs">No videos yet.</p> : (
                <div className="grid gap-2">
                  {videos.map(v => (
                    <div key={v.id} className="bg-card border border-border rounded-lg p-3 flex items-center gap-3">
                      <div className="w-12 h-8 rounded overflow-hidden flex-shrink-0 bg-secondary">
                        {v.thumbnailUrl && <img src={v.thumbnailUrl} alt="" className="w-full h-full object-cover" />}
                      </div>
                      {editId === v.id ? (
                        <div className="flex-1 space-y-1">
                          <input className={inputCls} value={editData.title || ""} onChange={e => setEditData({ ...editData, title: e.target.value })} placeholder="Title" />
                          <input className={inputCls} value={editData.artist || ""} onChange={e => setEditData({ ...editData, artist: e.target.value })} placeholder="Artist" />
                          <div className="flex gap-1">
                            <button onClick={() => handleSaveEdit(v.id)} className="text-[9px] bg-primary text-primary-foreground px-2 py-0.5 rounded flex items-center gap-0.5"><Check className="w-2.5 h-2.5" /> Save</button>
                            <button onClick={() => setEditId(null)} className="text-[9px] bg-secondary text-foreground px-2 py-0.5 rounded"><X className="w-2.5 h-2.5" /></button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-foreground text-[11px] font-bold truncate">{v.title}</h4>
                            <p className="text-muted-foreground text-[9px]">{v.artist} • {v.genre} • {v.plays} plays</p>
                          </div>
                          <div className="flex gap-1">
                            <button onClick={() => { setEditId(v.id); setEditData({ title: v.title, artist: v.artist, genre: v.genre }); }} className="text-[9px] bg-secondary text-foreground px-1.5 py-0.5 rounded flex items-center gap-0.5"><Edit2 className="w-2.5 h-2.5" /> Edit</button>
                            <button onClick={() => handleDelete(v.id)} className="text-[9px] bg-destructive text-destructive-foreground px-1.5 py-0.5 rounded flex items-center gap-0.5"><Trash2 className="w-2.5 h-2.5" /> Delete</button>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "wallet" && (
            <div>
              <h2 className="text-foreground text-sm font-bold mb-4">Wallet</h2>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">
                <div className="bg-card border border-border rounded-lg p-4"><p className="text-[10px] text-muted-foreground mb-1">Available Balance</p><p className="text-primary text-xl font-bold">{formatUGX(balance)}</p></div>
                <div className="bg-card border border-border rounded-lg p-4"><p className="text-[10px] text-muted-foreground mb-1">Total Earned</p><p className="text-foreground text-xl font-bold">{formatUGX(totalEarned)}</p></div>
                <div className="bg-card border border-border rounded-lg p-4"><p className="text-[10px] text-muted-foreground mb-1">Withdrawn</p><p className="text-foreground text-xl font-bold">{formatUGX(totalWithdrawn)}</p></div>
                <div className="bg-card border border-border rounded-lg p-4"><p className="text-[10px] text-muted-foreground mb-1">Monthly Downloads</p><p className="text-foreground text-xl font-bold">{monthlyDownloads} / {MONTHLY_THRESHOLD.toLocaleString()}</p></div>
              </div>

              <div className="bg-card border border-border rounded-lg p-4 max-w-sm mb-4">
                <h3 className="text-foreground text-xs font-bold mb-2">Withdraw to Mobile Money</h3>
                {!isWithdrawWindow && <p className="text-destructive text-[10px] mb-2">⚠ Withdrawals open Saturdays 12PM - Midnight</p>}
                <form className="space-y-3" onSubmit={handleWithdraw}>
                  <div><label className="text-foreground text-[11px] font-semibold mb-1 block">Amount to Withdraw (UGX)</label><input className={inputCls} value={wAmount} onChange={e => setWAmount(e.target.value)} placeholder="Min UGX 1,000" type="number" /></div>
                  {wAmountNum >= 1000 && (
                    <div className="bg-secondary rounded p-2.5 space-y-1">
                      <div className="flex justify-between text-[10px]"><span className="text-muted-foreground">Withdrawal fee ({wAmountNum <= 5000 ? "20%" : "10%"})</span><span className="text-destructive font-bold">- {formatUGX(wFee)}</span></div>
                      <div className="flex justify-between text-[10px] border-t border-border pt-1"><span className="text-muted-foreground font-bold">You will receive</span><span className="text-green-400 font-bold">{formatUGX(wNet)}</span></div>
                    </div>
                  )}
                  <div><label className="text-foreground text-[11px] font-semibold mb-1 block">Mobile Money Number</label><input className={inputCls} value={wPhone} onChange={e => setWPhone(e.target.value)} placeholder="0770 000 000" /></div>
                  <button type="submit" disabled={withdrawing || !isWithdrawWindow || balance === 0} className="bg-primary text-primary-foreground px-6 py-2 rounded text-xs font-bold hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-1.5">
                    {withdrawing ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Processing...</> : <><ArrowDownToLine className="w-3.5 h-3.5" /> Withdraw</>}
                  </button>
                </form>
              </div>

              <div className="bg-card border border-border rounded-lg p-4 mb-4">
                <h3 className="text-foreground text-xs font-bold mb-2">Transaction History</h3>
                {transactions.length === 0 ? <p className="text-muted-foreground text-[10px]">No transactions yet.</p> : (
                  <table className="w-full text-[10px]">
                    <thead><tr className="border-b border-border"><th className="text-left p-1.5 text-muted-foreground font-semibold">Type</th><th className="text-left p-1.5 text-muted-foreground font-semibold">Amount</th><th className="text-left p-1.5 text-muted-foreground font-semibold">Status</th><th className="text-left p-1.5 text-muted-foreground font-semibold">Date</th></tr></thead>
                    <tbody>{transactions.map(t => (<tr key={t.id} className="border-b border-border last:border-0"><td className="p-1.5 text-foreground capitalize">{t.type}</td><td className="p-1.5 text-foreground">{formatUGX(t.amount)}</td><td className="p-1.5"><span className={cn("px-1.5 py-0.5 rounded text-[9px] font-bold", t.status === "completed" ? "bg-badge-new text-primary-foreground" : "bg-secondary text-muted-foreground")}>{t.status}</span></td><td className="p-1.5 text-muted-foreground">{t.createdAt?.toDate?.()?.toLocaleDateString() || "—"}</td></tr>))}</tbody>
                  </table>
                )}
              </div>

              <div className="bg-card border border-border rounded-lg p-4">
                <h3 className="text-foreground text-xs font-bold mb-2">💰 How Earnings Work</h3>
                <ul className="text-[10px] text-muted-foreground space-y-1 list-disc list-inside">
                  <li>Reach <span className="text-primary font-bold">{MONTHLY_THRESHOLD.toLocaleString()}</span> confirmed downloads in a month</li>
                  <li>Earn <span className="text-primary font-bold">{formatUGX(MONTHLY_PAYOUT)}</span> milestone bonus</li>
                  <li>Only downloads by subscribed users count</li>
                  <li>Downloads by VJs, musicians, admins, and tiktokers don't count</li>
                  <li>Withdrawals available every Saturday 12PM - Midnight</li>
                  <li>Minimum withdrawal: <span className="text-primary font-bold">UGX 1,000</span></li>
                  <li>Withdrawal fee: <span className="text-primary font-bold">20%</span> for UGX 1,000–5,000 | <span className="text-primary font-bold">10%</span> for above UGX 5,000</li>
                </ul>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default MusicianDashboard;
