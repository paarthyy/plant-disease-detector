import React from "react";
import { Leaf } from "./icons";

export default function Footer() {
  return (
    <footer
      id="footer"
      className="mt-10 rounded-[28px] border border-white/60 bg-white/65 px-6 py-6 shadow-soft backdrop-blur-xl"
    >
      <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-moss text-cream">
            <Leaf className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-900">Plant Disease Detection Dashboard</p>
            <p className="text-sm text-slate-500">Built for simple crop screening, treatment guidance, and future crop expansion.</p>
          </div>
        </div>
        <p className="max-w-xl text-sm leading-6 text-slate-500">
          Tomato text input and tomato smart fusion are kept out of the current workflow on purpose, so farmers only see features that are supported by available training data.
        </p>
      </div>
    </footer>
  );
}
