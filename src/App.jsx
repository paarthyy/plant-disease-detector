import React from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import DiagnosisWorkspace from "./components/DiagnosisWorkspace";
import Footer from "./components/Footer";
import HeroSection from "./components/HeroSection";
import Navbar from "./components/Navbar";
import { CheckCircle2, CloudSun, Leaf, ShieldCheck } from "./components/icons";
import { InteractiveCard, Reveal } from "./components/motion";

const featureCards = [
  {
    icon: Leaf,
    title: "Leaf-first checking",
    body: "Designed for farmers who want to quickly scan a crop image and see a clear, trustworthy result.",
  },
  {
    icon: CloudSun,
    title: "Clear workflow choices",
    body: "Leaf scan, text input, and smart fusion are separated clearly so every step feels simple.",
  },
  {
    icon: ShieldCheck,
    title: "Simple treatment guidance",
    body: "Results are translated into recommended action instead of technical system language.",
  },
];

const leafParticles = [
  { left: "6%", bottom: "14%", size: 18, delay: "0s", duration: "12s", alt: false },
  { left: "18%", bottom: "8%", size: 12, delay: "3s", duration: "15s", alt: true },
  { left: "36%", bottom: "10%", size: 15, delay: "1.5s", duration: "13s", alt: false },
  { left: "58%", bottom: "12%", size: 14, delay: "5s", duration: "16s", alt: true },
  { left: "74%", bottom: "9%", size: 16, delay: "2s", duration: "14s", alt: false },
  { left: "88%", bottom: "11%", size: 11, delay: "6s", duration: "17s", alt: true },
];

export default function App() {
  const { scrollY } = useScroll();
  const topBlobY = useTransform(scrollY, [0, 1200], [0, 80]);
  const rightBlobY = useTransform(scrollY, [0, 1200], [0, -110]);
  const bottomBlobY = useTransform(scrollY, [0, 1200], [0, 60]);
  const bottomRightBlobY = useTransform(scrollY, [0, 1200], [0, -70]);

  return (
    <div className="min-h-screen pb-8">
      <div className="noise-overlay" />
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <motion.div style={{ y: topBlobY }} className="absolute left-[-6%] top-24 h-72 w-72 animate-drift rounded-full bg-leaf/20 blur-3xl" />
        <motion.div style={{ y: rightBlobY }} className="absolute right-[-8%] top-40 h-80 w-80 animate-drift-slow rounded-full bg-wheat/20 blur-3xl" />
        <motion.div style={{ y: bottomBlobY }} className="absolute bottom-16 left-1/4 h-64 w-64 animate-drift rounded-full bg-moss/10 blur-3xl" />
        <motion.div style={{ y: bottomRightBlobY }} className="absolute bottom-24 right-1/4 h-52 w-52 animate-drift-slow rounded-full bg-sage/20 blur-3xl" />
        {leafParticles.map((particle, index) => (
          <span
            key={`${particle.left}-${index}`}
            className={`leaf-particle ${particle.alt ? "animate-leaf-alt" : "animate-leaf"} opacity-70`}
            style={{
              left: particle.left,
              bottom: particle.bottom,
              width: `${particle.size}px`,
              height: `${particle.size * 1.6}px`,
              animationDelay: particle.delay,
              animationDuration: particle.duration,
            }}
          />
        ))}
      </div>

      <motion.div
        className="mx-auto w-full max-w-7xl px-3 md:px-5"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.85, ease: [0.22, 1, 0.36, 1] }}
      >
        <Navbar />
        <HeroSection />

        <section id="how-it-works" className="mt-8 grid gap-4 lg:grid-cols-3">
          {featureCards.map((card, index) => {
            const Icon = card.icon;
            return (
              <Reveal key={card.title} delay={index * 0.08}>
                <InteractiveCard>
                  <article className="soft-card premium-glow p-6">
                    <motion.div whileHover={{ rotate: -5, scale: 1.05 }} className="flex h-14 w-14 items-center justify-center rounded-3xl bg-moss/10 text-moss">
                      <Icon className="h-6 w-6" />
                    </motion.div>
                    <h2 className="mt-5 text-xl font-semibold tracking-[-0.04em] text-slate-900">{card.title}</h2>
                    <p className="mt-3 text-sm leading-7 text-slate-500">{card.body}</p>
                  </article>
                </InteractiveCard>
              </Reveal>
            );
          })}
        </section>

        <DiagnosisWorkspace />

        <section className="mt-8 grid gap-4 lg:grid-cols-[1.25fr_0.75fr]">
          <Reveal>
            <div className="glass-panel premium-glow p-6 md:p-7">
              <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-moss">Why farmers can trust this</p>
              <h2 className="mt-3 font-display text-4xl leading-none tracking-[-0.05em] text-slate-900">
                Calm design. Clear answers. Better field decisions.
              </h2>
              <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600">
                The redesign focuses on clarity first. It avoids technical jargon, highlights the next step, and keeps the main workspace simple enough for real field use on both desktop and mobile.
              </p>
            </div>
          </Reveal>
          <Reveal delay={0.1}>
            <InteractiveCard>
              <div className="soft-card premium-glow p-6">
                <div className="flex items-center gap-3">
                  <motion.div whileHover={{ rotate: -8, scale: 1.06 }} className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
                    <CheckCircle2 className="h-6 w-6" />
                  </motion.div>
                  <div>
                    <p className="text-lg font-semibold tracking-[-0.03em] text-slate-900">Farmer-first words</p>
                    <p className="text-sm text-slate-500">No confusing model terms in the core UI.</p>
                  </div>
                </div>
                <ul className="mt-5 space-y-3 text-sm leading-7 text-slate-600">
                  <li>Use “Scan crop”, “Check plant”, and “Result”.</li>
                  <li>Show crop status with visual color and simple meaning.</li>
                  <li>Keep unsupported paths clearly explained, not hidden.</li>
                </ul>
              </div>
            </InteractiveCard>
          </Reveal>
        </section>

        <Footer />
      </motion.div>
    </div>
  );
}
