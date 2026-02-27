import { ArrowRight } from "lucide-react";

const principles = [
  "Rules are authoritative — compliance is deterministic",
  "AI provides advisory scoring — never overrides rules",
  "Every decision is explainable and auditable",
  "Audit logging captures full pipeline trace",
  "Semantic layer is optional and configurable",
];

const pipelineSteps = [
  { step: "01", label: "Input Normalization", desc: "Clean, normalize, detect language" },
  { step: "02", label: "Rule Engine", desc: "Deterministic policy checks" },
  { step: "03", label: "FAISS Retrieval", desc: "Fast approximate nearest neighbor search" },
  { step: "04", label: "Multi-Layer Scoring", desc: "Semantic + Lexical + Phonetic" },
  { step: "05", label: "Decision Synthesis", desc: "Aggregate scores, determine verdict" },
  { step: "06", label: "Audit & Response", desc: "Log, explain, return structured result" },
];

const ArchitectureSection = () => {
  return (
    <section id="architecture" className="relative py-32 min-h-screen flex items-center">
      <div className="absolute inset-0 gradient-section-fade" />

      <div className="container mx-auto px-6 relative z-10 w-full">
        <div className="text-center mb-16 space-y-4">
          <p className="text-xs font-body font-medium tracking-[0.25em] uppercase text-[hsl(43_90%_50%)]">
            Technical Architecture
          </p>
          <h2 className="text-3xl md:text-5xl font-heading font-bold text-[hsl(48_10%_88%)]">
            Explainable, Modular,{" "}
            <span className="text-gradient-mustard">Scalable</span>
          </h2>
        </div>

        {/* Pipeline flow */}
        <div className="max-w-4xl mx-auto mb-20">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {pipelineSteps.map((s, i) => (
              <div
                key={s.step}
                className="charcoal-card p-6 space-y-2 relative group"
              >
                {/* Mustard step number */}
                <span className="text-3xl font-heading font-bold text-[hsl(43_90%_50%/0.25)] group-hover:text-[hsl(43_90%_50%/0.5)] transition-colors duration-300">
                  {s.step}
                </span>
                <h4 className="text-sm font-heading font-semibold text-[hsl(48_10%_88%)]">{s.label}</h4>
                <p className="text-xs font-body text-[hsl(0_0%_50%)]">{s.desc}</p>

                {/* Arrow connector */}
                {i < pipelineSteps.length - 1 && (
                  <ArrowRight className="absolute -right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[hsl(43_90%_50%/0.3)] hidden md:block" />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Design principles */}
        <div id="docs" className="max-w-2xl mx-auto">
          <h3 className="text-lg font-heading font-semibold mb-6 text-center text-[hsl(48_10%_88%)]">
            Design Principles
          </h3>
          <div className="space-y-3">
            {principles.map((p) => (
              <div
                key={p}
                className="flex items-start gap-4 px-6 py-4 charcoal-card group"
              >
                <div className="w-2 h-2 rounded-full bg-[hsl(43_90%_50%)] mt-1.5 shrink-0 group-hover:shadow-[0_0_8px_hsl(43_90%_50%/0.6)] transition-shadow duration-300" />
                <p className="text-sm font-body text-[hsl(0_0%_55%)] group-hover:text-[hsl(0_0%_70%)] transition-colors duration-300">
                  {p}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default ArchitectureSection;
