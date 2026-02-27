import { useNavigate } from "react-router-dom";
import { Shield, Layers, FileCheck } from "lucide-react";

const features = [
  { icon: Shield, label: "Deterministic Compliance Rules" },
  { icon: Layers, label: "Hybrid Similarity Scoring" },
  { icon: FileCheck, label: "Explainable Output + Audit Logs" },
];

const stats = [
  { value: "160K+", label: "Titles in DB" },
  { value: "3", label: "Similarity Layers" },
  { value: "12", label: "Rules Active" },
  { value: "<200ms", label: "Latency" },
];

const HeroSection = () => {
  const navigate = useNavigate();

  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden gradient-hero-bg">
      {/* Background floating orbs */}
      <div
        className="absolute top-[15%] left-[8%] w-72 h-72 rounded-full opacity-[0.08] animate-float-slow"
        style={{ background: "radial-gradient(circle, hsl(43 90% 50%), transparent 70%)" }}
      />
      <div
        className="absolute bottom-[20%] right-[10%] w-56 h-56 rounded-full opacity-[0.06] animate-float-medium"
        style={{ background: "radial-gradient(circle, hsl(43 80% 45%), transparent 70%)", animationDelay: "2s" }}
      />
      <div
        className="absolute top-[50%] right-[25%] w-40 h-40 rounded-full opacity-[0.05] animate-float-slow"
        style={{ background: "radial-gradient(circle, hsl(45 95% 60%), transparent 70%)", animationDelay: "4s" }}
      />

      {/* Subtle grid overlay */}
      <div
        className="absolute inset-0 opacity-[0.025]"
        style={{
          backgroundImage: `linear-gradient(hsl(43 90% 50% / 0.15) 1px, transparent 1px), linear-gradient(90deg, hsl(43 90% 50% / 0.15) 1px, transparent 1px)`,
          backgroundSize: "72px 72px",
        }}
      />

      {/* Content */}
      <div className="relative z-10 container mx-auto px-6 pt-24 pb-16 flex flex-col items-center text-center">

        {/* Eyebrow label */}
        <div className="inline-flex items-center gap-2 px-4 py-2 mb-8 rounded-full border border-[hsl(43_90%_50%/0.3)] bg-[hsl(43_90%_50%/0.06)]">
          <div className="w-1.5 h-1.5 rounded-full bg-[hsl(43_90%_50%)] animate-pulse-glow" />
          <span className="text-xs font-body font-medium tracking-[0.2em] uppercase text-[hsl(43_90%_55%)]">
            Regulatory AI Decision Support
          </span>
        </div>

        {/* Giant VERILEX title */}
        <h1
          className="font-heading font-bold tracking-tight mb-6 hero-title-glow"
          style={{
            fontSize: "clamp(4rem, 14vw, 11rem)",
            lineHeight: 0.95,
            background: "linear-gradient(135deg, hsl(43 90% 55%), hsl(46 100% 70%), hsl(43 85% 50%))",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          VERILEX
        </h1>

        {/* Subtitle */}
        <p className="text-lg md:text-xl font-body text-[hsl(0_0%_60%)] max-w-2xl leading-relaxed mb-4">
          AI-Powered Title Similarity &amp; Compliance Validation System
        </p>

        <p className="text-sm font-body text-[hsl(0_0%_45%)] max-w-xl mb-10">
          Regulatory-grade title uniqueness verification for PRGI-scale datasets (160,000+ titles).
          Deterministic rules meet advanced semantic AI.
        </p>

        {/* Feature pills */}
        <div className="flex flex-wrap justify-center gap-3 mb-12">
          {features.map((f) => (
            <div
              key={f.label}
              className="flex items-center gap-2 px-4 py-2.5 rounded-full border border-[hsl(0_0%_25%)] bg-[hsl(0_0%_12%/0.8)] text-xs font-body text-[hsl(0_0%_60%)] hover:border-[hsl(43_90%_50%/0.3)] hover:text-[hsl(43_90%_55%)] transition-all duration-300"
            >
              <f.icon className="w-3.5 h-3.5 text-[hsl(43_90%_50%)]" />
              {f.label}
            </div>
          ))}
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 mb-20">
          <button
            onClick={() => navigate("/dashboard")}
            className="btn-mustard px-8 py-3.5 text-base font-body font-semibold"
            style={{ borderRadius: "0.875rem" }}
          >
            Start Verification →
          </button>
          <button
            onClick={() => document.querySelector("#metrics")?.scrollIntoView({ behavior: "smooth" })}
            className="btn-outline-mustard px-8 py-3.5 text-base font-body font-medium"
            style={{ borderRadius: "0.875rem" }}
          >
            View System Metrics
          </button>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 w-full max-w-3xl">
          {stats.map((s, i) => (
            <div
              key={s.label}
              className="charcoal-card p-5 text-center relative overflow-hidden"
              style={{ animationDelay: `${i * 0.1}s` }}
            >
              <div className="text-2xl font-heading font-bold text-gradient-mustard mb-1">{s.value}</div>
              <div className="text-xs font-body text-[hsl(0_0%_50%)]">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Animated bottom separator */}
      <div className="absolute bottom-0 left-0 right-0 h-px animate-separator bg-[length:200%_100%]" />
    </section>
  );
};

export default HeroSection;
