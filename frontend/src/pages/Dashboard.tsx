import { useState, useCallback } from "react";
import Navbar from "@/components/Navbar";
import {
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  XCircle,
  CheckCircle,
  Search,
  Loader2,
  Info,
  ArrowLeft,
  ArrowRight,
} from "lucide-react";

// Mock similar titles for live suggest
const existingSimilarTitles: Record<string, string[]> = {
  "today": ["TODAY TIMES", "TODAY EXPRESS", "TODAYS NEWS"],
  "morning": ["MORNING EXPRESS", "MORNING HERALD", "MORNING POST"],
  "delhi": ["DELHI GUARDIAN", "DELHI POST", "DELHI EXPRESS"],
  "times": ["MUMBAI TIMES", "MORADABAD TIMES", "MORBI TIMES", "HINDUSTAN TIMES"],
  "national": ["NATIONAL HERALD", "NATIONAL TIMES", "NATIONAL EXPRESS"],
};

const states = [
  { code: "UP", name: "Uttar Pradesh" },
  { code: "MH", name: "Maharashtra" },
  { code: "DL", name: "Delhi" },
  { code: "RJ", name: "Rajasthan" },
  { code: "KA", name: "Karnataka" },
  { code: "TN", name: "Tamil Nadu" },
  { code: "GJ", name: "Gujarat" },
  { code: "WB", name: "West Bengal" },
];

const periodicities = ["Daily", "Weekly", "Fortnightly", "Monthly", "Quarterly"];

interface VerificationResult {
  status: "REJECTED" | "REVIEW" | "APPROVED";
  decisionBasis: string;
  severity: string;
  probability: number;
  submissionId: string;
  timestamp: string;
  ruleViolations: { rule: string; description: string; type: string }[];
  similarity: {
    matchedWith: string;
    brandCluster: boolean;
    finalScore: number;
    semantic: number;
    lexical: number;
    phonetic: number;
    interpretation: string;
  } | null;
  advanced: {
    candidatePool: number;
    faissStatus: string;
    layersActive: number;
    model: string;
    auditLogId: string;
    processingTime: string;
  };
}

/* ── Shared input style ──────────────────────────────────────── */
const inputClass =
  "w-full px-4 py-3 rounded-xl text-[hsl(48_10%_88%)] font-body placeholder:text-[hsl(0_0%_38%)] " +
  "focus:outline-none transition-all duration-200 " +
  "bg-[hsl(0_0%_13%)] border border-[hsl(0_0%_22%)] " +
  "focus:border-[hsl(43_90%_50%/0.6)] focus:ring-1 focus:ring-[hsl(43_90%_50%/0.25)]";

/* ── STATUS helpers ──────────────────────────────────────────── */
const statusConfig = {
  REJECTED: { color: "text-[hsl(0_72%_55%)]", bg: "bg-[hsl(0_72%_55%/0.08)]", border: "border-[hsl(0_72%_55%/0.3)]", dot: "bg-[hsl(0_72%_55%)]" },
  REVIEW: { color: "text-[hsl(43_90%_55%)]", bg: "bg-[hsl(43_90%_50%/0.08)]", border: "border-[hsl(43_90%_50%/0.3)]", dot: "bg-[hsl(43_90%_55%)]" },
  APPROVED: { color: "text-[hsl(120_50%_55%)]", bg: "bg-[hsl(120_50%_50%/0.08)]", border: "border-[hsl(120_50%_50%/0.3)]", dot: "bg-[hsl(120_50%_55%)]" },
};

/* ═══════════════════════════════════════════════════════════════
   Dashboard Component
═══════════════════════════════════════════════════════════════ */
const Dashboard = () => {
  const [view, setView] = useState<"input" | "output">("input");
  const [title, setTitle] = useState("");
  const [stateCode, setStateCode] = useState("");
  const [city, setCity] = useState("");
  const [periodicity, setPeriodicity] = useState("");
  const [showFields, setShowFields] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isVerifying, setIsVerifying] = useState(false);
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [rulesExpanded, setRulesExpanded] = useState(false);
  const [advancedExpanded, setAdvancedExpanded] = useState(false);

  const handleTitleChange = useCallback((val: string) => {
    setTitle(val);
    const lower = val.toLowerCase().trim();
    if (lower.length < 3) { setSuggestions([]); return; }
    const found: string[] = [];
    Object.entries(existingSimilarTitles).forEach(([key, titles]) => {
      if (lower.includes(key)) found.push(...titles);
    });
    setSuggestions([...new Set(found)].slice(0, 5));
  }, []);

  const handleVerify = () => {
    setIsVerifying(true);
    setResult(null);
    setTimeout(() => {
      const mockResult: VerificationResult = {
        status: title.toLowerCase().includes("times") ? "REVIEW" : title.toLowerCase().includes("herald") ? "REJECTED" : "APPROVED",
        decisionBasis: title.toLowerCase().includes("herald") ? "DETERMINISTIC_RULE" : "AI_SIMILARITY_ENGINE",
        severity: title.toLowerCase().includes("times") ? "HIGH" : title.toLowerCase().includes("herald") ? "SEVERE" : "LOW",
        probability: title.toLowerCase().includes("times") ? 7.53 : title.toLowerCase().includes("herald") ? 2.1 : 82.4,
        submissionId: `VLX-2024-${String(Math.floor(Math.random() * 9000) + 1000)}`,
        timestamp: new Date().toISOString().replace("T", " ").slice(0, 19),
        ruleViolations: title.toLowerCase().includes("herald")
          ? [{ rule: "EXACT_DUPLICATE", description: "Title already exists in same state and city.", type: "Hard Rejection" }]
          : [],
        similarity: title.toLowerCase().includes("herald") ? null : {
          matchedWith: "TODAY TIMES",
          brandCluster: false,
          finalScore: 92.47,
          semantic: 86.97,
          lexical: 95.24,
          phonetic: 100,
          interpretation: "SEVERE similarity detected due to: phonetic equivalence, strong lexical overlap, high semantic alignment.",
        },
        advanced: {
          candidatePool: 200,
          faissStatus: "enabled",
          layersActive: 3,
          model: "paraphrase-multilingual-MiniLM-L12-v2",
          auditLogId: `AUD-${Date.now()}`,
          processingTime: `${Math.floor(Math.random() * 200) + 80}ms`,
        },
      };
      setResult(mockResult);
      setIsVerifying(false);
      setView("output");
    }, 2200);
  };

  const goBack = () => {
    setView("input");
    setRulesExpanded(false);
    setAdvancedExpanded(false);
  };

  const normalized = title.toLowerCase().replace(/[^a-z0-9\s]/g, "").trim();
  const hasRestricted = ["police", "government", "official"].some((w) => normalized.includes(w));

  /* ── INPUT SCREEN ─────────────────────────────────────────── */
  if (view === "input") {
    return (
      <div className="min-h-screen" style={{ background: "hsl(0 0% 8%)" }}>
        <Navbar />

        {/* Background glow */}
        <div
          className="fixed inset-0 pointer-events-none"
          style={{ background: "radial-gradient(ellipse at 35% 40%, hsl(43 90% 50% / 0.06) 0%, transparent 55%)" }}
        />

        <div className="container mx-auto px-6 pt-28 pb-20 relative z-10">
          <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="mb-12 space-y-3 screen-enter">
              <p className="text-xs font-body font-medium tracking-[0.25em] uppercase text-[hsl(43_90%_50%)]">
                Step 1 of 2
              </p>
              <h1 className="text-3xl md:text-4xl font-heading font-bold text-[hsl(48_10%_88%)]">
                Submit Title for{" "}
                <span className="text-gradient-mustard">Verification</span>
              </h1>
              <p className="text-sm font-body text-[hsl(0_0%_50%)]">
                Runs compliance rules + similarity engine within target latency.
              </p>
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
              {/* Main form */}
              <div className="lg:col-span-2 space-y-5 screen-enter">
                <div
                  className="p-8 space-y-6 relative"
                  style={{
                    background: "hsl(0 0% 11%)",
                    border: "1px solid hsl(0 0% 22%)",
                    borderRadius: "1rem",
                  }}
                >
                  {/* Title input */}
                  <div className="space-y-2">
                    <label className="text-xs font-body text-[hsl(0_0%_50%)] uppercase tracking-wider">
                      Title Name *
                    </label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => handleTitleChange(e.target.value)}
                      onFocus={() => setShowFields(true)}
                      placeholder="Enter title to verify..."
                      className={inputClass}
                    />
                  </div>

                  {/* Extra fields */}
                  {showFields && (
                    <div className="grid md:grid-cols-3 gap-4 animate-fade-in-up">
                      <div className="space-y-2">
                        <label className="text-xs font-body text-[hsl(0_0%_50%)] uppercase tracking-wider">
                          State
                        </label>
                        <select
                          value={stateCode}
                          onChange={(e) => setStateCode(e.target.value)}
                          className={inputClass}
                          style={{ cursor: "pointer" }}
                        >
                          <option value="">Select state</option>
                          {states.map((s) => (
                            <option key={s.code} value={s.code}>
                              {s.code} — {s.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-body text-[hsl(0_0%_50%)] uppercase tracking-wider">
                          City
                        </label>
                        <input
                          type="text"
                          value={city}
                          onChange={(e) => setCity(e.target.value)}
                          placeholder="Enter city"
                          className={inputClass}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-body text-[hsl(0_0%_50%)] uppercase tracking-wider">
                          Periodicity
                        </label>
                        <select
                          value={periodicity}
                          onChange={(e) => setPeriodicity(e.target.value)}
                          className={inputClass}
                          style={{ cursor: "pointer" }}
                        >
                          <option value="">Select periodicity</option>
                          {periodicities.map((p) => (
                            <option key={p} value={p}>{p}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  )}

                  {/* AI Hints Strip */}
                  {title.trim().length > 0 && (
                    <div
                      className="px-5 py-4 rounded-xl flex flex-wrap gap-5 text-xs font-body animate-fade-in-up"
                      style={{ background: "hsl(0 0% 14%)", border: "1px solid hsl(0 0% 20%)" }}
                    >
                      <span className="text-[hsl(0_0%_50%)]">
                        Length:{" "}
                        <span className="text-[hsl(48_10%_80%)] font-medium">{title.length} chars</span>
                      </span>
                      <span className="text-[hsl(0_0%_50%)]">
                        Normalized:{" "}
                        <span className="text-[hsl(48_10%_80%)] font-medium font-mono">"{normalized}"</span>
                      </span>
                      <span className="text-[hsl(0_0%_50%)]">
                        Language: <span className="text-[hsl(48_10%_80%)] font-medium">English</span>
                      </span>
                      {hasRestricted ? (
                        <span className="text-[hsl(0_72%_55%)] flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" /> Contains restricted term
                        </span>
                      ) : (
                        <span className="text-[hsl(120_50%_55%)] flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" /> No policy keywords detected
                        </span>
                      )}
                    </div>
                  )}

                  {/* Verify button */}
                  <button
                    onClick={handleVerify}
                    disabled={!title.trim() || isVerifying}
                    className="btn-mustard flex items-center gap-2 px-8 py-3.5 text-sm font-body font-semibold disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                    style={{ borderRadius: "0.875rem" }}
                  >
                    {isVerifying ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Verifying...
                      </>
                    ) : (
                      <>
                        <Search className="w-4 h-4" />
                        Verify Title
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Suggestions sidebar */}
              <div className="space-y-5">
                {suggestions.length > 0 ? (
                  <div
                    className="p-6 space-y-4 animate-fade-in-up"
                    style={{ background: "hsl(0 0% 11%)", border: "1px solid hsl(43 90% 50% / 0.2)", borderRadius: "1rem" }}
                  >
                    <h4 className="text-xs font-body text-[hsl(43_90%_50%)] uppercase tracking-wider">
                      Similar Existing Titles
                    </h4>
                    <div className="space-y-2">
                      {suggestions.map((s) => (
                        <div
                          key={s}
                          className="px-3 py-2.5 rounded-lg text-sm font-body text-[hsl(48_10%_80%)] border border-[hsl(0_0%_20%)] hover:border-[hsl(43_90%_50%/0.3)] transition-colors duration-200"
                          style={{ background: "hsl(0 0% 14%)" }}
                        >
                          {s}
                        </div>
                      ))}
                    </div>
                    <p className="text-[10px] font-body text-[hsl(0_0%_40%)]">
                      Tip: Modify title structure to reduce resemblance.
                    </p>
                  </div>
                ) : (
                  <div
                    className="p-6 space-y-3"
                    style={{ background: "hsl(0 0% 11%)", border: "1px solid hsl(0 0% 20%)", borderRadius: "1rem" }}
                  >
                    <h4 className="text-xs font-body text-[hsl(0_0%_45%)] uppercase tracking-wider">
                      Live Suggestions
                    </h4>
                    <p className="text-xs font-body text-[hsl(0_0%_40%)]">
                      Start typing a title to see similar existing entries in real-time.
                    </p>
                  </div>
                )}

                {/* Info card */}
                <div
                  className="p-6 space-y-3"
                  style={{ background: "hsl(0 0% 11%)", border: "1px solid hsl(0 0% 20%)", borderRadius: "1rem" }}
                >
                  <h4 className="text-xs font-body text-[hsl(0_0%_45%)] uppercase tracking-wider">
                    How it works
                  </h4>
                  <ul className="space-y-2">
                    {["Input normalized & cleaned", "12 deterministic rules checked", "FAISS retrieves 200 candidates", "3-layer similarity scored", "Decision synthesized"].map((step, i) => (
                      <li key={step} className="flex items-start gap-2.5 text-xs font-body text-[hsl(0_0%_45%)]">
                        <span className="text-[hsl(43_90%_50%)] font-heading font-bold shrink-0">0{i + 1}</span>
                        {step}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ── OUTPUT SCREEN ────────────────────────────────────────── */
  const cfg = result ? statusConfig[result.status] : statusConfig.APPROVED;
  const StatusIcon = result?.status === "REJECTED" ? XCircle : result?.status === "REVIEW" ? AlertTriangle : CheckCircle;

  return (
    <div className="min-h-screen" style={{ background: "hsl(0 0% 8%)" }}>
      <Navbar />

      {/* Background glow */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{ background: "radial-gradient(ellipse at 65% 40%, hsl(43 90% 50% / 0.05) 0%, transparent 55%)" }}
      />

      <div className="container mx-auto px-6 pt-28 pb-20 relative z-10">
        <div className="max-w-4xl mx-auto">
          {/* Header with back button */}
          <div className="mb-10 flex items-center gap-4 screen-enter">
            <button
              onClick={goBack}
              className="flex items-center gap-2 px-4 py-2.5 text-sm font-body text-[hsl(0_0%_50%)] hover:text-[hsl(43_90%_55%)] border border-[hsl(0_0%_22%)] hover:border-[hsl(43_90%_50%/0.4)] rounded-xl transition-all duration-200"
              style={{ background: "hsl(0 0% 12%)" }}
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Input
            </button>

            <div>
              <p className="text-xs font-body font-medium tracking-[0.25em] uppercase text-[hsl(43_90%_50%)]">
                Step 2 of 2
              </p>
              <h1 className="text-2xl md:text-3xl font-heading font-bold text-[hsl(48_10%_88%)]">
                Verification <span className="text-gradient-mustard">Results</span>
              </h1>
            </div>
          </div>

          {result && (
            <div className="space-y-5 screen-enter">
              {/* Decision Summary card */}
              <div
                className="p-8 relative overflow-hidden"
                style={{
                  background: "hsl(0 0% 11%)",
                  border: `1px solid ${cfg.border.replace("border-[", "").replace("]", "")}`,
                  borderRadius: "1rem",
                }}
              >
                {/* Top glow line */}
                <div
                  className="absolute top-0 left-0 right-0 h-0.5 opacity-60"
                  style={{ background: `linear-gradient(90deg, transparent, ${cfg.dot.replace("bg-[", "").replace("]", "")}, transparent)` }}
                />

                <div className="flex flex-col md:flex-row gap-8 items-start">
                  <div className="flex-1 space-y-5">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl ${cfg.bg} ${cfg.border} border flex items-center justify-center`}>
                        <StatusIcon className={`w-5 h-5 ${cfg.color}`} />
                      </div>
                      <span className={`text-2xl font-heading font-bold ${cfg.color}`}>{result.status}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm font-body">
                      <div>
                        <p className="text-[hsl(0_0%_45%)] text-xs mb-1 uppercase tracking-wider">Decision Basis</p>
                        <p className="text-[hsl(48_10%_85%)] font-medium">{result.decisionBasis}</p>
                      </div>
                      <div>
                        <p className="text-[hsl(0_0%_45%)] text-xs mb-1 uppercase tracking-wider">Severity</p>
                        <p className="text-[hsl(48_10%_85%)] font-medium">{result.severity}</p>
                      </div>
                      <div>
                        <p className="text-[hsl(0_0%_45%)] text-xs mb-1 uppercase tracking-wider">Submission ID</p>
                        <p className="text-[hsl(48_10%_75%)] font-mono text-xs">{result.submissionId}</p>
                      </div>
                      <div>
                        <p className="text-[hsl(0_0%_45%)] text-xs mb-1 uppercase tracking-wider">Timestamp</p>
                        <p className="text-[hsl(48_10%_75%)] font-mono text-xs">{result.timestamp}</p>
                      </div>
                    </div>
                  </div>

                  {/* Probability ring */}
                  <div className="shrink-0">
                    <div className="relative w-36 h-36">
                      <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                        <circle cx="50" cy="50" r="40" fill="none" stroke="hsl(0 0% 18%)" strokeWidth="6" />
                        <circle
                          cx="50" cy="50" r="40" fill="none"
                          stroke={result.probability > 50 ? "hsl(120 50% 50%)" : result.probability > 20 ? "hsl(43 90% 50%)" : "hsl(0 72% 55%)"}
                          strokeWidth="6"
                          strokeDasharray={`${result.probability * 2.51} ${251.2 - result.probability * 2.51}`}
                          strokeLinecap="round"
                        />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-2xl font-heading font-bold text-[hsl(48_10%_88%)]">{result.probability}%</span>
                        <span className="text-[10px] font-body text-[hsl(0_0%_45%)] text-center leading-tight">
                          Verification<br />Probability
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Rule Violations */}
              {result.ruleViolations.length > 0 && (
                <div
                  className="overflow-hidden"
                  style={{ background: "hsl(0 0% 11%)", border: "1px solid hsl(0 72% 55% / 0.25)", borderRadius: "1rem" }}
                >
                  <button
                    onClick={() => setRulesExpanded(!rulesExpanded)}
                    className="w-full flex items-center justify-between px-6 py-4 text-sm font-body hover:bg-[hsl(0_0%_13%)] transition-colors"
                  >
                    <span className="text-[hsl(0_72%_55%)] font-medium">
                      {result.ruleViolations.length} rule violation{result.ruleViolations.length > 1 ? "s" : ""} found
                    </span>
                    {rulesExpanded ? <ChevronUp className="w-4 h-4 text-[hsl(0_0%_45%)]" /> : <ChevronDown className="w-4 h-4 text-[hsl(0_0%_45%)]" />}
                  </button>
                  {rulesExpanded && (
                    <div className="px-6 pb-5 space-y-3 border-t border-[hsl(0_0%_18%)]">
                      {result.ruleViolations.map((v, i) => (
                        <div key={i} className="pt-4 space-y-1">
                          <p className="text-sm font-heading font-semibold text-[hsl(0_72%_55%)]">{v.rule}</p>
                          <p className="text-xs font-body text-[hsl(0_0%_50%)]">{v.description}</p>
                          <p className="text-[10px] font-body text-[hsl(0_0%_38%)]">Rule Type: {v.type}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Similarity Breakdown */}
              {result.similarity && (
                <div
                  className="p-8 space-y-6"
                  style={{ background: "hsl(0 0% 11%)", border: "1px solid hsl(0 0% 22%)", borderRadius: "1rem" }}
                >
                  <h4 className="font-heading font-semibold text-[hsl(48_10%_88%)]">Similarity Breakdown</h4>

                  <div className="flex flex-wrap gap-6 text-sm font-body">
                    <span className="text-[hsl(0_0%_50%)]">
                      Matched With:{" "}
                      <span className="text-[hsl(48_10%_85%)] font-medium">{result.similarity.matchedWith}</span>
                    </span>
                    <span className="text-[hsl(0_0%_50%)]">
                      Brand Cluster:{" "}
                      <span className="text-[hsl(48_10%_85%)] font-medium">{result.similarity.brandCluster ? "Yes" : "No"}</span>
                    </span>
                    <span className="text-[hsl(0_0%_50%)]">
                      Final Score:{" "}
                      <span className="text-[hsl(43_90%_55%)] font-heading font-bold">{result.similarity.finalScore}%</span>
                    </span>
                  </div>

                  <div className="space-y-4">
                    {[
                      { label: "Semantic", value: result.similarity.semantic },
                      { label: "Lexical", value: result.similarity.lexical },
                      { label: "Phonetic", value: result.similarity.phonetic },
                      { label: "Final Score", value: result.similarity.finalScore },
                    ].map((bar) => (
                      <div key={bar.label} className="space-y-1.5">
                        <div className="flex justify-between text-xs font-body">
                          <span className="text-[hsl(0_0%_50%)]">{bar.label}</span>
                          <span className="text-[hsl(48_10%_85%)] font-heading font-semibold">{bar.value}%</span>
                        </div>
                        <div className="score-bar">
                          <div className="score-bar-fill" style={{ width: `${bar.value}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>

                  <div
                    className="rounded-xl p-4"
                    style={{ background: "hsl(0 0% 14%)", border: "1px solid hsl(0 0% 20%)" }}
                  >
                    <p className="text-xs font-body text-[hsl(0_0%_50%)] leading-relaxed">
                      {result.similarity.interpretation}
                    </p>
                  </div>
                </div>
              )}

              {/* Advanced Details */}
              <div
                className="overflow-hidden"
                style={{ background: "hsl(0 0% 11%)", border: "1px solid hsl(0 0% 22%)", borderRadius: "1rem" }}
              >
                <button
                  onClick={() => setAdvancedExpanded(!advancedExpanded)}
                  className="w-full flex items-center justify-between px-6 py-4 text-sm font-body hover:bg-[hsl(0_0%_13%)] transition-colors"
                >
                  <span className="text-[hsl(0_0%_50%)] flex items-center gap-2">
                    <Info className="w-3.5 h-3.5" />
                    Advanced Details (Audit &amp; Runtime)
                  </span>
                  {advancedExpanded ? <ChevronUp className="w-4 h-4 text-[hsl(0_0%_45%)]" /> : <ChevronDown className="w-4 h-4 text-[hsl(0_0%_45%)]" />}
                </button>
                {advancedExpanded && (
                  <div className="px-6 pb-5 border-t border-[hsl(0_0%_18%)]">
                    <div className="grid grid-cols-2 gap-2 pt-4 text-xs font-body">
                      {Object.entries({
                        "Candidate pool size": result.advanced.candidatePool,
                        "FAISS status": result.advanced.faissStatus,
                        "Similarity layers active": result.advanced.layersActive,
                        "Model": result.advanced.model,
                        "Audit Log ID": result.advanced.auditLogId,
                        "Processing time": result.advanced.processingTime,
                      }).map(([key, val]) => (
                        <div key={key} className="flex justify-between py-2 border-b border-[hsl(0_0%_16%)]">
                          <span className="text-[hsl(0_0%_45%)]">{key}</span>
                          <span className="text-[hsl(48_10%_80%)] font-mono">{String(val)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Verify another */}
              <div className="pt-2 flex gap-3">
                <button
                  onClick={goBack}
                  className="btn-outline-mustard flex items-center gap-2 px-6 py-3 text-sm font-body font-medium"
                  style={{ borderRadius: "0.875rem" }}
                >
                  <ArrowLeft className="w-4 h-4" />
                  Verify Another Title
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
