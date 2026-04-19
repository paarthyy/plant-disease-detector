import React from "react";
import { motion } from "framer-motion";
import { CheckCircle2, CropGlyph, ShieldCheck, Sprout, TrendingUp } from "./icons";
import { InteractiveCard, Reveal } from "./motion";

const stats = [
  { label: "Supported image crops", value: "Potato + Tomato" },
  { label: "Checks in one place", value: "Leaf, text, fusion" },
  { label: "Farmer-friendly output", value: "Clear action steps" },
];

const headlineWords = ["Detect", "plant", "diseases", "early.", "Protect", "your", "crop."];

export default function HeroSection() {
  return (
    <section id="home" className="grid gap-6 pt-8 lg:grid-cols-[1.15fr_0.85fr]">
      <motion.div
        initial={{ opacity: 0, y: 32 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
        className="relative overflow-hidden rounded-[36px] bg-hero-gradient px-7 py-8 text-cream shadow-panel md:px-10 md:py-10"
      >
        <motion.div
          animate={{ backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"] }}
          transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
          className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,.18),transparent_24%),radial-gradient(circle_at_80%_16%,rgba(255,255,255,.08),transparent_22%),radial-gradient(circle_at_84%_85%,rgba(193,216,141,.18),transparent_25%)] bg-[length:160%_160%]"
        />
        <motion.div
          animate={{ x: [0, 24, -10, 0], y: [0, -14, 12, 0] }}
          transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -left-10 top-16 h-40 w-40 rounded-full bg-white/10 blur-3xl"
        />
        <motion.div
          animate={{ x: [0, -26, 14, 0], y: [0, 16, -18, 0] }}
          transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
          className="absolute right-0 top-6 h-48 w-48 rounded-full bg-leaf/20 blur-3xl"
        />

        <div className="relative z-10 max-w-3xl">
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55 }}
            className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.24em] text-cream/90"
          >
            <Sprout className="h-4 w-4" />
            Premium agri-tech diagnosis
          </motion.div>

          <h1 className="max-w-4xl font-display text-5xl leading-[0.92] tracking-[-0.06em] text-cream md:text-6xl xl:text-7xl">
            {headlineWords.map((word, index) => (
              <motion.span
                key={word + index}
                initial={{ opacity: 0, y: 28, filter: "blur(6px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                transition={{ duration: 0.6, delay: 0.14 + index * 0.06, ease: [0.22, 1, 0.36, 1] }}
                className="mr-[0.28em] inline-block"
              >
                {word}
              </motion.span>
            ))}
          </h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.5 }}
            className="mt-5 max-w-2xl text-sm leading-7 text-cream/80 md:text-base"
          >
            Upload a leaf photo, check field conditions, and get a clear crop result with simple next steps.
            Built to feel calm, trustworthy, and easy for farmers to use in the field.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.62 }}
            className="mt-7 flex flex-wrap gap-3"
          >
            <motion.a
              href="#diagnosis"
              whileHover={{ scale: 1.035, y: -2 }}
              whileTap={{ scale: 0.985 }}
              className="pill-button bg-cream text-moss shadow-lg shadow-black/10 hover:shadow-xl"
            >
              <ShieldCheck className="mr-2 h-4 w-4" />
              Start Diagnosis
            </motion.a>
            <motion.a
              href="#how-it-works"
              whileHover={{ scale: 1.03, y: -2 }}
              whileTap={{ scale: 0.985 }}
              className="pill-button border border-white/20 bg-white/10 text-cream hover:bg-white/15"
            >
              <CheckCircle2 className="mr-2 h-4 w-4" />
              How it works
            </motion.a>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.74 }}
            className="mt-8 grid gap-3 sm:grid-cols-3"
          >
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                whileHover={{ y: -5, rotateX: 2, rotateY: -2 }}
                transition={{ type: "spring", stiffness: 240, damping: 20 }}
                className="rounded-[22px] border border-white/15 bg-white/10 p-4 backdrop-blur-sm"
                style={{ transformStyle: "preserve-3d" }}
              >
                <p className="text-lg font-semibold tracking-[-0.04em]">{stat.value}</p>
                <p className="mt-1 text-xs leading-5 text-cream/70">{stat.label}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </motion.div>

      <Reveal>
        <div className="glass-panel relative overflow-hidden px-6 py-6 md:px-7 md:py-7">
          <div className="absolute right-5 top-5 rounded-full border border-moss/10 bg-white/70 px-3 py-2 text-[11px] font-bold uppercase tracking-[0.22em] text-moss">
            Field-ready
          </div>
          <div className="flex min-h-[420px] flex-col justify-between">
            <InteractiveCard>
              <div className="rounded-[28px] bg-gradient-to-br from-moss via-[#355f43] to-[#a6c57a] p-6 text-cream shadow-soft">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-cream/70">Crop health scan</p>
                    <h2 className="mt-2 font-display text-3xl leading-none tracking-[-0.05em]">
                      One workspace. Clear crop decisions.
                    </h2>
                    <p className="mt-3 max-w-xs text-sm leading-6 text-cream/80">
                      Farmers do not need technical knowledge. The app speaks in simple crop language and clear recommended action.
                    </p>
                  </div>
                  <motion.div animate={{ y: [0, -8, 0] }} transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }}>
                    <CropGlyph />
                  </motion.div>
                </div>
              </div>
            </InteractiveCard>

            <div className="mt-5 grid gap-3">
              <InteractiveCard>
                <div className="soft-card premium-glow p-5">
                  <div className="flex items-start gap-3">
                    <motion.div whileHover={{ rotate: -8, scale: 1.08 }} className="flex h-11 w-11 items-center justify-center rounded-2xl bg-moss/10 text-moss">
                      <TrendingUp className="h-5 w-5" />
                    </motion.div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900">Visual crop checks first</p>
                      <p className="mt-1 text-sm leading-6 text-slate-500">
                        Photo diagnosis supports both potato and tomato leaves.
                      </p>
                    </div>
                  </div>
                </div>
              </InteractiveCard>

              <InteractiveCard>
                <div className="soft-card premium-glow p-5">
                  <div className="flex items-start gap-3">
                    <motion.div whileHover={{ rotate: 8, scale: 1.08 }} className="flex h-11 w-11 items-center justify-center rounded-2xl bg-wheat/15 text-[#a7751f]">
                      <CheckCircle2 className="h-5 w-5" />
                    </motion.div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900">Honest workflow limits</p>
                      <p className="mt-1 text-sm leading-6 text-slate-500">
                        Text input and smart fusion stay potato-only until tomato field data is added.
                      </p>
                    </div>
                  </div>
                </div>
              </InteractiveCard>
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
