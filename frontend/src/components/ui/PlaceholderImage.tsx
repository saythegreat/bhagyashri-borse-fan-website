import React from "react";
import { Sparkles, Camera } from "lucide-react";

interface PlaceholderImageProps {
  title?: string;
  category?: string;
  className?: string;
}

export default function PlaceholderImage({
  title = "Editorial Tribute",
  category = "Editorial",
  className = "",
}: PlaceholderImageProps) {
  return (
    <div
      className={`w-full h-full min-h-[300px] bg-gradient-to-br from-burgundy-900 via-burgundy-800 to-cinema-dark flex flex-col items-center justify-center p-6 text-center border border-gold-400/20 rounded-2xl relative overflow-hidden ${className}`}
    >
      <div className="absolute inset-0 bg-cinema-vignette opacity-80" />
      <div className="relative z-10 space-y-3">
        <div className="w-14 h-14 mx-auto rounded-full bg-burgundy-700/60 border border-gold-400/40 flex items-center justify-center shadow-gold">
          <Camera className="w-6 h-6 text-gold-400" />
        </div>
        <span className="inline-block text-[10px] tracking-widest uppercase font-semibold text-rose-300 bg-rose-500/10 px-2.5 py-0.5 rounded-full border border-rose-400/20">
          {category}
        </span>
        <h3 className="font-cinzel text-base font-bold text-ivory max-w-xs line-clamp-2">
          {title}
        </h3>
        <p className="text-[11px] text-blush/60 max-w-xs italic font-editorial">
          Authentic photograph pending verification & approval.
        </p>
      </div>
    </div>
  );
}
