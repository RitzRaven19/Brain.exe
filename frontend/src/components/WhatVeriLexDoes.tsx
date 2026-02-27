import { Landmark, BarChart3, Scale } from "lucide-react";

const pillars = [
  {
    icon: Landmark,
    title: "Regulatory Decision Support System",
    description: "Enforces deterministic compliance checks and policy-based rejection. Rules are always authoritative.",
  },
  {
    icon: BarChart3,
    title: "Transparent AI Risk Analysis",
    description: "Multi-layer similarity scoring with explainable breakdown, confidence values, and audit trail.",
  },
  {
    icon: Scale,
    title: "Deterministic + AI Hybrid Engine",
    description: "Hard rules reject instantly; AI similarity informs review severity and approval probability.",
  },
];

const WhatVeriLexDoes = () => {
  return (
    <section id="dashboard" className="relative py-32 min-h-screen flex items-center">
      <div className="absolute inset-0 gradient-section-fade" />

      {/* Subtle mustard glow from center */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "radial-gradient(ellipse at 50% 50%, hsl(43 90% 50% / 0.05) 0%, transparent 65%)",
        }}
      />

      <div className="container mx-auto px-6 relative z-10 w-full">
        <div className="text-center mb-16 space-y-4">
          <p className="text-xs font-body font-medium tracking-[0.25em] uppercase text-[hsl(43_90%_50%)]">
            What VeriLex Does
          </p>
          <h2 className="text-3xl md:text-5xl font-heading font-bold text-[hsl(48_10%_88%)]">
            Regulatory Decision Support
            <br />
            <span className="text-gradient-mustard">for Title Validation</span>
          </h2>
          <p className="text-sm font-body text-[hsl(0_0%_50%)] max-w-xl mx-auto">
            A purpose-built engine combining deterministic policy rules with multi-layer AI similarity scoring.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {pillars.map((pillar, i) => (
            <div
              key={pillar.title}
              className="charcoal-card p-8 space-y-5 relative overflow-hidden group"
              style={{ animationDelay: `${i * 0.15}s` }}
            >
              {/* Top accent line */}
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[hsl(43_90%_50%/0.4)] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

              <div className="w-12 h-12 rounded-xl bg-[hsl(43_90%_50%/0.1)] border border-[hsl(43_90%_50%/0.2)] flex items-center justify-center">
                <pillar.icon className="w-6 h-6 text-[hsl(43_90%_50%)]" />
              </div>

              <h3 className="font-heading font-semibold text-lg text-[hsl(48_10%_88%)] leading-snug">
                {pillar.title}
              </h3>
              <p className="text-sm font-body text-[hsl(0_0%_55%)] leading-relaxed">
                {pillar.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default WhatVeriLexDoes;
