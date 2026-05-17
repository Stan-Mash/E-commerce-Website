"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { Play, Pause, Volume2, VolumeX } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ProductImage, ProductVideo } from "@nairobi-fashion/lib";

interface Props {
  images: ProductImage[];
  videos: ProductVideo[];
  productName: string;
}

type MediaItem =
  | ({ kind: "image" } & ProductImage)
  | ({ kind: "video" } & ProductVideo);

export function ProductGallery({ images, videos, productName }: Props) {
  const sortedImages = [...images].sort((a, b) => a.sort_order - b.sort_order);
  const sortedVideos = [...videos].sort((a, b) => a.sort_order - b.sort_order);

  // Videos first (video-first strategy)
  const mediaItems: MediaItem[] = [
    ...sortedVideos.map((v) => ({ kind: "video" as const, ...v })),
    ...sortedImages.map((i) => ({ kind: "image" as const, ...i })),
  ];

  const [activeIndex, setActiveIndex] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);

  const active = mediaItems[activeIndex];

  function togglePlay() {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      void videoRef.current.play();
    }
    setIsPlaying(!isPlaying);
  }

  function toggleMute() {
    if (!videoRef.current) return;
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Main media */}
      <div className="relative aspect-product w-full rounded-2xl overflow-hidden bg-surface-warm">
        {active?.kind === "video" ? (
          <>
            <video
              ref={videoRef}
              key={active.cloudinary_url}
              src={active.cloudinary_url}
              poster={active.thumbnail_url ?? undefined}
              autoPlay
              muted={isMuted}
              loop
              playsInline
              className="w-full h-full object-cover"
            />
            {/* Video controls overlay */}
            <div className="absolute bottom-3 left-3 flex items-center gap-2">
              <button
                onClick={togglePlay}
                className="rounded-full bg-black/50 p-2 text-white backdrop-blur-sm hover:bg-black/70 transition-colors"
                aria-label={isPlaying ? "Pause" : "Play"}
              >
                {isPlaying ? <Pause size={16} /> : <Play size={16} />}
              </button>
              <button
                onClick={toggleMute}
                className="rounded-full bg-black/50 p-2 text-white backdrop-blur-sm hover:bg-black/70 transition-colors"
                aria-label={isMuted ? "Unmute" : "Mute"}
              >
                {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
              </button>
            </div>
            <span className="absolute top-3 left-3 rounded-full bg-black/50 px-2 py-1 text-xs text-white backdrop-blur-sm">
              Video
            </span>
          </>
        ) : active?.kind === "image" ? (
          <Image
            src={active.url}
            alt={active.alt ?? productName}
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            className="object-cover"
            priority={activeIndex === 0}
          />
        ) : null}
      </div>

      {/* Thumbnail strip */}
      {mediaItems.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {mediaItems.map((item, i) => (
            <button
              key={i}
              onClick={() => setActiveIndex(i)}
              className={cn(
                "relative flex-shrink-0 w-16 h-20 rounded-xl overflow-hidden border-2 transition-all",
                activeIndex === i
                  ? "border-brand-500 shadow-md"
                  : "border-transparent opacity-70 hover:opacity-100"
              )}
              aria-label={`View ${item.kind === "video" ? "video" : "image"} ${i + 1}`}
            >
              {item.kind === "video" ? (
                <>
                  {item.thumbnail_url ? (
                    <Image src={item.thumbnail_url} alt="Video thumbnail" fill className="object-cover" />
                  ) : (
                    <div className="w-full h-full bg-ink/10 flex items-center justify-center">
                      <Play size={16} className="text-ink-muted" />
                    </div>
                  )}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="rounded-full bg-black/50 p-1">
                      <Play size={10} className="text-white" />
                    </div>
                  </div>
                </>
              ) : (
                <Image src={item.url} alt={item.alt ?? `Image ${i + 1}`} fill className="object-cover" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
