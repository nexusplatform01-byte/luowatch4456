import MuxPlayer from "@mux/mux-player-react";

interface MusicVideoPlayerProps {
  src: string;
  poster?: string;
  title?: string;
  artist?: string;
}

const EmbedPlayer = ({ src, title }: { src: string; title?: string }) => (
  <div className="relative w-full h-full bg-black">
    <iframe
      src={src}
      className="w-full h-full border-0"
      allowFullScreen
      allow="autoplay; fullscreen; picture-in-picture; encrypted-media"
      title={title || "Music Video"}
      referrerPolicy="no-referrer-when-downgrade"
    />
  </div>
);

const isEmbedUrl = (src: string) =>
  src.includes("embed.dlsrv.online") ||
  src.includes("youtube.com") ||
  src.includes("youtu.be") ||
  src.includes("drive.google.com") ||
  src.includes("iframe");

const MusicVideoPlayer = ({ src, poster, title, artist }: MusicVideoPlayerProps) => {
  if (isEmbedUrl(src)) {
    const embedSrc = src.startsWith("https://embed.dlsrv.online") ? src : src;
    return <EmbedPlayer src={embedSrc} title={title} />;
  }

  return (
    <div className="relative w-full h-full bg-black">
      <MuxPlayer
        src={src}
        poster={poster}
        metadata={{
          video_title: title,
          player_name: "LUO WATCH Music Player",
          video_series: artist,
        }}
        style={{ width: "100%", height: "100%", aspectRatio: "16/9" }}
        autoPlay
        streamType="on-demand"
        primaryColor="#ffffff"
        accentColor="#ef4444"
      />
    </div>
  );
};

export default MusicVideoPlayer;
