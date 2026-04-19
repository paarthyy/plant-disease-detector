import React from "react";
import { motion } from "framer-motion";
import { Leaf, ShieldCheck } from "./icons";

export default function Navbar() {
  return (
    <motion.header
      initial={{ opacity: 0, y: -18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      className="sticky top-3 z-40 mx-auto mt-4 flex w-full max-w-7xl items-center justify-between gap-4 rounded-[24px] border border-white/60 bg-white/70 px-5 py-4 shadow-soft backdrop-blur-xl"
    >
      <div className="flex items-center gap-3">
        <motion.div whileHover={{ rotate: -6, scale: 1.04 }} className="flex h-12 w-12 items-center justify-center rounded-2xl bg-hero-gradient text-cream shadow-lg">
          <Leaf className="h-6 w-6" />
        </motion.div>
        <div>
          <p className="text-sm font-bold tracking-[-0.03em] text-slate-900">Plant Disease Detector</p>
          <p className="text-xs text-slate-500">Simple crop checks for farmers in the field</p>
        </div>
      </div>

      <nav className="hidden items-center gap-6 text-sm font-medium text-slate-600 lg:flex">
        {[
          ["#home", "Home"],
          ["#diagnosis", "Diagnosis"],
          ["#how-it-works", "How It Works"],
          ["#footer", "Support"],
        ].map(([href, label]) => (
          <motion.a key={label} href={href} whileHover={{ y: -1 }} className="transition hover:text-moss">
            {label}
          </motion.a>
        ))}
      </nav>

      <motion.a
        href="#diagnosis"
        whileHover={{ scale: 1.04, y: -2 }}
        whileTap={{ scale: 0.985 }}
        className="pill-button hidden bg-moss text-cream shadow-lg shadow-moss/20 lg:inline-flex"
      >
        <ShieldCheck className="mr-2 h-4 w-4" />
        Start Diagnosis
      </motion.a>
    </motion.header>
  );
}
