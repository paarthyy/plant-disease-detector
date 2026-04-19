import React, { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, LayoutGroup, motion } from "framer-motion";
import {
  Camera,
  CloudSun,
  Leaf,
  ScanLine,
  ShieldCheck,
  Upload,
  Waves,
} from "./icons";
import { InteractiveCard, PremiumButton, Reveal } from "./motion";

const API_BASE_URL = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");

function apiUrl(path) {
  if (!API_BASE_URL) {
    return path;
  }
  return `${API_BASE_URL}${path}`;
}

const MODE_CONFIG = {
  image: {
    label: "Leaf Scan",
    short: "Photo check",
    icon: ScanLine,
  },
  text: {
    label: "Text Input",
    short: "Field values",
    icon: CloudSun,
  },
  fusion: {
    label: "Smart Fusion",
    short: "Photo + field values",
    icon: Waves,
  },
};

const STATUS_MAP = {
  green: {
    label: "Healthy",
    tone: "healthy",
    badge: "bg-emerald-100 text-emerald-700",
    glow: "status-glow-healthy",
    explanation: "The crop looks healthy right now. Keep checking it regularly.",
  },
  orange: {
    label: "Risk",
    tone: "warning",
    badge: "bg-amber-100 text-amber-700",
    glow: "status-glow-warning",
    explanation: "The crop may be at risk. Early action can help stop the problem from spreading.",
  },
  red: {
    label: "Disease",
    tone: "danger",
    badge: "bg-rose-100 text-rose-700",
    glow: "status-glow-danger",
    explanation: "A disease sign is visible. Quick action is important to protect the crop.",
  },
  gray: {
    label: "Check image",
    tone: "neutral",
    badge: "bg-slate-200 text-slate-600",
    glow: "",
    explanation: "The crop photo was not clear enough. Try again with a cleaner leaf image.",
  },
};

const DEFAULT_FORM = {
  temperature: "22",
  humidity: "75",
  wind_speed: "5",
  wind_bearing: "180",
  visibility: "10",
  pressure: "1015",
};

function SectionLabel({ icon: Icon, label, description, active, onClick }) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileHover={{ y: -3, scale: 1.01 }}
      whileTap={{ scale: 0.985 }}
      className={[
        "group relative overflow-hidden rounded-[22px] border p-4 text-left transition duration-300",
        active
          ? "border-moss/20 bg-gradient-to-br from-moss to-[#1a3b2b] text-cream shadow-lg shadow-moss/20"
          : "border-[#1d2b1f]/10 bg-white/65 text-slate-900 hover:shadow-soft",
      ].join(" ")}
    >
      {active ? (
        <motion.div
          layoutId="active-tab"
          className="absolute inset-0 rounded-[22px] border border-white/10 bg-gradient-to-br from-white/10 to-transparent"
          transition={{ type: "spring", stiffness: 320, damping: 28 }}
        />
      ) : null}
      <div className="relative flex items-start gap-3">
        <motion.div
          whileHover={{ rotate: -8, scale: 1.06 }}
          className={["flex h-12 w-12 items-center justify-center rounded-2xl", active ? "bg-white/15 text-cream" : "bg-moss/10 text-moss"].join(" ")}
        >
          <Icon className="h-5 w-5" />
        </motion.div>
        <div>
          <p className={["text-sm font-semibold tracking-[-0.03em]", active ? "text-cream" : "text-slate-900"].join(" ")}>{label}</p>
          <p className={["mt-1 text-xs leading-5", active ? "text-cream/75" : "text-slate-500"].join(" ")}>{description}</p>
        </div>
      </div>
    </motion.button>
  );
}

function CropOption({ active, label, description, onClick }) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileHover={{ y: -3, scale: 1.01 }}
      whileTap={{ scale: 0.985 }}
      className={[
        "relative overflow-hidden rounded-[20px] border p-4 text-left transition duration-300",
        active
          ? "border-moss/25 bg-gradient-to-br from-moss/10 to-leaf/15 shadow-soft"
          : "border-[#1d2b1f]/10 bg-white/70 hover:shadow-soft",
      ].join(" ")}
    >
      {active ? (
        <motion.div
          layoutId="crop-highlight"
          className="absolute inset-0 rounded-[20px] bg-gradient-to-br from-white/20 to-transparent"
          transition={{ type: "spring", stiffness: 320, damping: 26 }}
        />
      ) : null}
      <div className="relative">
        <p className="text-sm font-semibold tracking-[-0.03em] text-slate-900">{label}</p>
        <p className="mt-1 text-xs leading-5 text-slate-500">{description}</p>
      </div>
    </motion.button>
  );
}

function MetricField({ id, label, value, onChange }) {
  return (
    <label className="block">
      <span className="mb-2 block text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">{label}</span>
      <motion.div whileHover={{ y: -1 }} className="field-shell">
        <input
          id={id}
          type="number"
          value={value}
          onChange={onChange}
          className="w-full bg-transparent text-sm text-slate-900 outline-none"
        />
      </motion.div>
    </label>
  );
}

function LoadingCard() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 12 }}
      className="flex min-h-[420px] items-center justify-center rounded-[28px] border border-[#1d2b1f]/10 bg-white/70 p-6"
    >
      <div className="w-full max-w-md text-center">
        <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full border border-moss/10 bg-gradient-to-br from-moss to-[#335942] text-cream shadow-lg shadow-moss/20">
          <Leaf className="h-10 w-10 animate-pulse-leaf" />
        </div>

        <div className="mx-auto mt-8 h-40 w-full max-w-sm overflow-hidden rounded-[24px] border border-moss/10 bg-gradient-to-br from-moss/90 to-[#3b6548] text-cream shadow-soft scan-surface">
          <div className="scan-grid" />
          <div className="skeleton-shimmer absolute inset-4 rounded-[18px] border border-white/15 bg-white/5" />
          <div className="absolute inset-x-6 bottom-6 top-6 rounded-[18px] border border-white/8" />
          <div className="absolute inset-x-10 top-10 h-20 rounded-[20px] border border-white/10 bg-white/5 blur-[2px]" />
        </div>

        <div className="mt-6 flex items-center justify-center gap-1 text-lg font-semibold tracking-[-0.03em] text-slate-900">
          <span>Analyzing your crop</span>
          <span className="inline-flex gap-1">
            {[0, 1, 2].map((dot) => (
              <motion.span
                key={dot}
                animate={{ opacity: [0.25, 1, 0.25], y: [0, -2, 0] }}
                transition={{ duration: 1.1, repeat: Infinity, delay: dot * 0.16 }}
              >
                .
              </motion.span>
            ))}
          </span>
        </div>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          Please wait while we scan the crop condition and prepare the result.
        </p>
      </div>
    </motion.div>
  );
}

function EmptyResult() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex min-h-[420px] items-center justify-center rounded-[28px] border border-dashed border-[#1d2b1f]/15 bg-white/55 p-6"
    >
      <div className="max-w-md">
        <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-moss">Result panel</p>
        <h3 className="mt-3 font-display text-4xl leading-none tracking-[-0.05em] text-slate-900">
          Ready to check your plant
        </h3>
        <p className="mt-4 text-sm leading-7 text-slate-500">
          Upload a crop image or enter field values on the left. The result card will appear here with crop status, confidence, and simple treatment steps.
        </p>
        <div className="mt-5 grid gap-3">
          <div className="rounded-2xl border border-[#1d2b1f]/10 bg-white/70 px-4 py-3 text-sm text-slate-600">Photo scan: potato and tomato</div>
          <div className="rounded-2xl border border-[#1d2b1f]/10 bg-white/70 px-4 py-3 text-sm text-slate-600">Text input: potato only</div>
          <div className="rounded-2xl border border-[#1d2b1f]/10 bg-white/70 px-4 py-3 text-sm text-slate-600">Smart fusion: potato only</div>
        </div>
      </div>
    </motion.div>
  );
}

function ResultPanel({ result, loading, onReset }) {
  const status = STATUS_MAP[result?.color] ?? STATUS_MAP.gray;
  const [displayConfidence, setDisplayConfidence] = useState(0);

  useEffect(() => {
    if (!result) {
      setDisplayConfidence(0);
      return;
    }
    let frame;
    let start;
    const target = Number(result.confidence || 0);
    const duration = 1100;

    const tick = (timestamp) => {
      if (!start) start = timestamp;
      const progress = Math.min((timestamp - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayConfidence(Math.round(target * eased));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [result]);

  if (loading) return <LoadingCard />;
  if (!result) return <EmptyResult />;

  const heroClasses = {
    healthy: "from-moss to-[#7ca05a]",
    warning: "from-[#a76d15] to-[#ddb14f]",
    danger: "from-[#8b3727] to-[#c16349]",
    neutral: "from-slate-500 to-slate-400",
  };

  return (
    <motion.div
      key={`${result.mode}-${result.disease}-${result.confidence}`}
      initial={{ opacity: 0, y: 28, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      className="space-y-4"
    >
      <div className={`relative overflow-hidden rounded-[30px] bg-gradient-to-br ${heroClasses[status.tone]} p-6 text-cream shadow-panel ${status.glow}`}>
        <motion.div
          animate={{ opacity: [0.4, 0.7, 0.4], scale: [1, 1.04, 1] }}
          transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut" }}
          className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.18),transparent_30%),radial-gradient(circle_at_bottom_left,rgba(255,255,255,0.08),transparent_28%)]"
        />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-cream/75">Result</p>
            <motion.h3
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.55, delay: 0.06 }}
              className="mt-2 font-display text-4xl leading-none tracking-[-0.05em]"
            >
              {result.disease}
            </motion.h3>
            <p className="mt-3 max-w-xl text-sm leading-7 text-cream/85">{status.explanation}</p>
          </div>
          <motion.span
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.12 }}
            className={`inline-flex rounded-full px-3 py-2 text-xs font-bold ${status.badge}`}
          >
            {status.label}
          </motion.span>
        </div>

        <div className="relative mt-6 space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-cream/80">Confidence</span>
            <motion.span className="font-semibold">{displayConfidence}%</motion.span>
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-white/20">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${result.confidence}%` }}
              transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1], delay: 0.15 }}
              className="h-full rounded-full bg-white/90 shadow-[0_0_18px_rgba(255,255,255,0.45)]"
            />
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <InteractiveCard>
          <div className="soft-card premium-glow p-5">
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500">Crop checked</p>
            <p className="mt-2 text-lg font-semibold tracking-[-0.03em] text-slate-900">
              {(result.crop || "potato").charAt(0).toUpperCase() + (result.crop || "potato").slice(1)}
            </p>
          </div>
        </InteractiveCard>
        <InteractiveCard>
          <div className="soft-card premium-glow p-5">
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500">Quick note</p>
            <p className="mt-2 text-sm leading-6 text-slate-600">{result.urgency}</p>
          </div>
        </InteractiveCard>
      </div>

      {result.mode === "fusion" ? (
        <div className="grid gap-4 md:grid-cols-3">
          {[
            ["Photo score", result.image_conf],
            ["Field score", result.text_conf],
            ["Combined result", result.confidence],
          ].map(([label, value]) => (
            <InteractiveCard key={label}>
              <div className="soft-card premium-glow p-5">
                <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500">{label}</p>
                <p className="mt-2 text-lg font-semibold text-slate-900">{value}%</p>
              </div>
            </InteractiveCard>
          ))}
        </div>
      ) : null}

      {result.gradcam ? (
        <InteractiveCard>
          <figure className="soft-card premium-glow overflow-hidden p-3">
            <img
              src={result.gradcam}
              alt="Scan attention"
              className="h-auto w-full rounded-[20px] border border-[#1d2b1f]/10 object-cover"
            />
            <figcaption className="px-2 pb-2 pt-3 text-sm leading-6 text-slate-500">
              Highlighted leaf regions that helped the crop scan result.
            </figcaption>
          </figure>
        </InteractiveCard>
      ) : null}

      <InteractiveCard>
        <div className="soft-card premium-glow p-5">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500">Recommended action</p>
          <div className="mt-4 space-y-3">
            {result.steps?.map((step, index) => (
              <motion.div
                key={step}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: 0.08 * index }}
                className="flex gap-3"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-moss text-xs font-bold text-cream">
                  {index + 1}
                </div>
                <p className="pt-1 text-sm leading-6 text-slate-700">{step}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </InteractiveCard>

      <InteractiveCard>
        <div className="soft-card premium-glow p-5">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500">Prevention</p>
          <p className="mt-3 text-sm leading-7 text-slate-600">{result.prevention}</p>
        </div>
      </InteractiveCard>

      <PremiumButton
        type="button"
        onClick={onReset}
        className="pill-button w-full border border-[#1d2b1f]/10 bg-white/80 text-slate-800 hover:shadow-soft hover:shadow-glow"
      >
        Check another plant
      </PremiumButton>
    </motion.div>
  );
}

export default function DiagnosisWorkspace() {
  const [mode, setMode] = useState("image");
  const [crop, setCrop] = useState("potato");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [fusionPreview, setFusionPreview] = useState("");
  const [fusionFile, setFusionFile] = useState(null);
  const [metrics, setMetrics] = useState(DEFAULT_FORM);
  const imageInputRef = useRef(null);
  const fusionInputRef = useRef(null);

  const headingCopy = useMemo(() => {
    return {
      image: "Upload a leaf image and we will check the crop condition.",
      text: "Enter field values to check the potato crop condition from weather and environment data.",
      fusion: "Use both a potato leaf image and field values for a stronger combined check.",
    }[mode];
  }, [mode]);

  const activePreview = mode === "fusion" ? fusionPreview : imagePreview;

  function updateMetrics(key, value) {
    setMetrics((current) => ({ ...current, [key]: value }));
  }

  function resetWorkspace() {
    setLoading(false);
    setResult(null);
  }

  function readFilePreview(file, target) {
    const reader = new FileReader();
    reader.onload = (event) => {
      if (target === "image") {
        setImagePreview(event.target?.result || "");
      } else {
        setFusionPreview(event.target?.result || "");
      }
    };
    reader.readAsDataURL(file);
  }

  function handleImageSelection(file, target = "image") {
    if (!file) return;
    if (target === "image") {
      setImageFile(file);
      readFilePreview(file, "image");
    } else {
      setFusionFile(file);
      readFilePreview(file, "fusion");
    }
  }

  function handleDrop(event, target = "image") {
    event.preventDefault();
    setDragging(false);
    const file = event.dataTransfer.files?.[0];
    handleImageSelection(file, target);
  }

  async function parseResponse(response) {
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || "Something went wrong while checking the crop.");
    }
    return data;
  }

  async function analyzeImage() {
    if (!imageFile) {
      alert("Please upload a crop image first.");
      return;
    }

    setLoading(true);
    const form = new FormData();
    form.append("image", imageFile);
    form.append("crop", crop);

    try {
      const response = await fetch(apiUrl("/predict/image"), {
        method: "POST",
        body: form,
      });
      const data = await parseResponse(response);
      setResult(data);
    } catch (error) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  }

  async function analyzeText() {
    setLoading(true);
    try {
      const response = await fetch(apiUrl("/predict/text"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(metrics),
      });
      const data = await parseResponse(response);
      setResult(data);
    } catch (error) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  }

  async function analyzeFusion() {
    if (!fusionFile) {
      alert("Please upload a potato leaf image first.");
      return;
    }

    setLoading(true);
    const form = new FormData();
    form.append("image", fusionFile);
    Object.entries(metrics).forEach(([key, value]) => form.append(key, value));

    try {
      const response = await fetch(apiUrl("/predict/fusion"), {
        method: "POST",
        body: form,
      });
      const data = await parseResponse(response);
      setResult(data);
    } catch (error) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  }

  function submitCurrentMode() {
    if (mode === "image") {
      analyzeImage();
      return;
    }
    if (mode === "text") {
      analyzeText();
      return;
    }
    analyzeFusion();
  }

  return (
    <section id="diagnosis" className="mt-8">
      <Reveal className="max-w-3xl">
        <p className="inline-flex rounded-full border border-moss/10 bg-white/70 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.24em] text-moss">
          Diagnosis workspace
        </p>
        <h2 className="mt-4 font-display text-4xl leading-none tracking-[-0.05em] text-slate-900 md:text-5xl">
          Clean input on the left. Clear crop result on the right.
        </h2>
        <p className="mt-4 text-sm leading-7 text-slate-600 md:text-base">
          This workspace is designed to feel simple in the field: choose the check type, add the crop image or values, and get a result that is easy to understand.
        </p>
      </Reveal>

      <div className="mt-8 grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <Reveal>
          <div className="glass-panel premium-glow p-6 md:p-7">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <p className="text-lg font-semibold tracking-[-0.04em] text-slate-900">Input panel</p>
                <p className="mt-1 text-sm leading-6 text-slate-500">{headingCopy}</p>
              </div>
              <motion.div whileHover={{ rotate: -8, scale: 1.06 }} className="hidden rounded-2xl bg-moss/10 p-3 text-moss md:block">
                <ShieldCheck className="h-5 w-5" />
              </motion.div>
            </div>

            <LayoutGroup>
              <div className="grid gap-3 md:grid-cols-3">
                {Object.entries(MODE_CONFIG).map(([key, config]) => (
                  <SectionLabel
                    key={key}
                    icon={config.icon}
                    label={config.label}
                    description={config.short}
                    active={mode === key}
                    onClick={() => setMode(key)}
                  />
                ))}
              </div>

              <AnimatePresence mode="wait">
                <motion.div
                  key={mode}
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                >
                  {mode === "image" ? (
                    <div className="mt-6">
                      <div className="grid gap-3 md:grid-cols-2">
                        <CropOption
                          active={crop === "potato"}
                          label="Potato"
                          description="Use this when you are scanning a potato leaf."
                          onClick={() => setCrop("potato")}
                        />
                        <CropOption
                          active={crop === "tomato"}
                          label="Tomato"
                          description="Use this when you are scanning a tomato leaf."
                          onClick={() => setCrop("tomato")}
                        />
                      </div>

                      <motion.div
                        whileHover={{ y: -4, scale: 1.005 }}
                        className={[
                          "premium-glow mt-5 rounded-[26px] border border-dashed p-6 text-center transition duration-300",
                          dragging ? "border-moss/40 bg-moss/5 shadow-soft" : "border-moss/20 bg-white/70",
                        ].join(" ")}
                        onDragOver={(event) => {
                          event.preventDefault();
                          setDragging(true);
                        }}
                        onDragLeave={() => setDragging(false)}
                        onDrop={(event) => handleDrop(event, "image")}
                      >
                        <input
                          ref={imageInputRef}
                          type="file"
                          accept="image/*"
                          capture="environment"
                          className="hidden"
                          onChange={(event) => handleImageSelection(event.target.files?.[0], "image")}
                        />
                        <motion.div whileHover={{ rotate: -8, scale: 1.05 }} className="mx-auto flex h-20 w-20 items-center justify-center rounded-[24px] bg-gradient-to-br from-moss to-[#183224] text-cream shadow-lg shadow-moss/20">
                          <Upload className="h-8 w-8" />
                        </motion.div>
                        <p className="mt-4 text-lg font-semibold tracking-[-0.03em] text-slate-900">Drop a leaf photo here</p>
                        <p className="mt-2 text-sm leading-6 text-slate-500">
                          Or choose a photo from your phone camera or gallery.
                        </p>
                        <div className="mt-5 flex flex-wrap justify-center gap-3">
                          <PremiumButton
                            type="button"
                            onClick={() => imageInputRef.current?.click()}
                            className="pill-button bg-moss text-cream hover:shadow-lg hover:shadow-moss/20"
                          >
                            <Upload className="mr-2 h-4 w-4" />
                            Upload photo
                          </PremiumButton>
                          <PremiumButton
                            type="button"
                            onClick={() => imageInputRef.current?.click()}
                            className="pill-button border border-[#1d2b1f]/10 bg-white/80 text-slate-700"
                          >
                            <Camera className="mr-2 h-4 w-4" />
                            Open camera
                          </PremiumButton>
                        </div>
                      </motion.div>
                    </div>
                  ) : null}

                  {mode === "text" ? (
                    <div className="mt-6">
                      <motion.div layout className="rounded-[22px] border border-amber-200 bg-amber-50/80 p-4 text-sm leading-6 text-amber-800">
                        Tomato field-value checks are not available yet, so this mode stays focused on potato only.
                      </motion.div>
                    </div>
                  ) : null}

                  {mode === "fusion" ? (
                    <div className="mt-6">
                      <motion.div layout className="rounded-[22px] border border-amber-200 bg-amber-50/80 p-4 text-sm leading-6 text-amber-800">
                        Smart Fusion currently uses a potato leaf image plus potato field values together.
                      </motion.div>
                      <motion.div
                        whileHover={{ y: -4, scale: 1.005 }}
                        className="premium-glow mt-5 rounded-[26px] border border-dashed border-moss/20 bg-white/70 p-6 text-center"
                        onDragOver={(event) => {
                          event.preventDefault();
                          setDragging(true);
                        }}
                        onDragLeave={() => setDragging(false)}
                        onDrop={(event) => handleDrop(event, "fusion")}
                      >
                        <input
                          ref={fusionInputRef}
                          type="file"
                          accept="image/*"
                          capture="environment"
                          className="hidden"
                          onChange={(event) => handleImageSelection(event.target.files?.[0], "fusion")}
                        />
                        <motion.div whileHover={{ rotate: -8, scale: 1.05 }} className="mx-auto flex h-20 w-20 items-center justify-center rounded-[24px] bg-gradient-to-br from-moss to-[#183224] text-cream shadow-lg shadow-moss/20">
                          <Leaf className="h-8 w-8" />
                        </motion.div>
                        <p className="mt-4 text-lg font-semibold tracking-[-0.03em] text-slate-900">Upload potato leaf photo</p>
                        <p className="mt-2 text-sm leading-6 text-slate-500">
                          Add one clear image first, then enter the field values below.
                        </p>
                        <div className="mt-5 flex flex-wrap justify-center gap-3">
                          <PremiumButton
                            type="button"
                            onClick={() => fusionInputRef.current?.click()}
                            className="pill-button bg-moss text-cream hover:shadow-lg hover:shadow-moss/20"
                          >
                            <Upload className="mr-2 h-4 w-4" />
                            Upload photo
                          </PremiumButton>
                          <PremiumButton
                            type="button"
                            onClick={() => fusionInputRef.current?.click()}
                            className="pill-button border border-[#1d2b1f]/10 bg-white/80 text-slate-700"
                          >
                            <Camera className="mr-2 h-4 w-4" />
                            Open camera
                          </PremiumButton>
                        </div>
                      </motion.div>
                    </div>
                  ) : null}
                </motion.div>
              </AnimatePresence>
            </LayoutGroup>

            {(mode === "text" || mode === "fusion") ? (
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="mt-5 grid gap-4 md:grid-cols-2"
              >
                <MetricField id="temperature" label="Temperature" value={metrics.temperature} onChange={(event) => updateMetrics("temperature", event.target.value)} />
                <MetricField id="humidity" label="Humidity" value={metrics.humidity} onChange={(event) => updateMetrics("humidity", event.target.value)} />
                <MetricField id="wind_speed" label="Wind speed" value={metrics.wind_speed} onChange={(event) => updateMetrics("wind_speed", event.target.value)} />
                <MetricField id="wind_bearing" label="Wind bearing" value={metrics.wind_bearing} onChange={(event) => updateMetrics("wind_bearing", event.target.value)} />
                <MetricField id="visibility" label="Visibility" value={metrics.visibility} onChange={(event) => updateMetrics("visibility", event.target.value)} />
                <MetricField id="pressure" label="Pressure" value={metrics.pressure} onChange={(event) => updateMetrics("pressure", event.target.value)} />
              </motion.div>
            ) : null}

            <AnimatePresence>
              {activePreview ? (
                <motion.div
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="premium-glow mt-5 overflow-hidden rounded-[24px] border border-[#1d2b1f]/10 bg-white/75 p-3"
                >
                  <img src={activePreview} alt="Crop preview" className="h-60 w-full rounded-[18px] object-cover" />
                </motion.div>
              ) : null}
            </AnimatePresence>

            <PremiumButton
              type="button"
              onClick={submitCurrentMode}
              className="mt-6 inline-flex w-full items-center justify-center rounded-[20px] bg-hero-gradient px-5 py-4 text-sm font-semibold text-cream shadow-lg shadow-moss/20 transition duration-200 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-glow"
            >
              <ScanLine className="mr-2 h-4 w-4" />
              Analyze Crop
            </PremiumButton>
          </div>
        </Reveal>

        <Reveal delay={0.08}>
          <div className="glass-panel premium-glow p-6 md:p-7">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <p className="text-lg font-semibold tracking-[-0.04em] text-slate-900">Result panel</p>
                <p className="mt-1 text-sm leading-6 text-slate-500">
                  Disease name, confidence, crop status, and recommended action appear here.
                </p>
              </div>
              <motion.div whileHover={{ rotate: -8, scale: 1.06 }} className="hidden rounded-2xl bg-moss/10 p-3 text-moss md:block">
                <ShieldCheck className="h-5 w-5" />
              </motion.div>
            </div>

            <AnimatePresence mode="wait">
              <ResultPanel result={result} loading={loading} onReset={resetWorkspace} />
            </AnimatePresence>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
