import React from "react";
import {
  Camera,
  CheckCircle2,
  CloudSun,
  Leaf,
  ScanLine,
  ShieldCheck,
  Sprout,
  TrendingUp,
  Upload,
  Waves,
} from "lucide-react";

export {
  Camera,
  CheckCircle2,
  CloudSun,
  Leaf,
  ScanLine,
  ShieldCheck,
  Sprout,
  TrendingUp,
  Upload,
  Waves,
};

export function CropGlyph() {
  return (
    <div className="relative h-28 w-28 animate-float rounded-[32px] bg-white/10 backdrop-blur-sm">
      <div className="absolute inset-4 rounded-[28px] border border-white/20 bg-white/10" />
      <div className="absolute inset-0 flex items-center justify-center">
        <Leaf className="h-10 w-10 text-cream" strokeWidth={1.8} />
      </div>
      <div className="absolute -bottom-2 -right-2 rounded-2xl bg-white/15 px-3 py-2 text-[10px] font-bold uppercase tracking-[0.22em] text-cream/90">
        Scan
      </div>
    </div>
  );
}
