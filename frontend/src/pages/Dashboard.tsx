import { useEffect, useMemo, useState } from "react";
import Navbar from "@/components/Navbar";
import {
  Activity,
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  Copy,
  Database,
  FileCode2,
  GitBranch,
  Loader2,
  Radar,
  RefreshCw,
  Search,
  ShieldAlert,
  Sparkles,
  XCircle,
} from "lucide-react";

type VerifyRequest = {
  title: string;
  state_code: string;
  city: string;
  periodicity: string;
};

type RuleViolation = {
  type: string;
  message: string;
};

type SimilarityScores = {
  semantic?: number;
  lexical: number;
  phonetic: number;
  final: number;
};

type SimilarityPayload = {
  best_match: string | null;
  scores: SimilarityScores | null;
  is_brand_cluster: boolean;
};

type VerifyResponse = {
  status: "REJECTED" | "REVIEW";
  decision_basis: "DETERMINISTIC_RULE" | "AI_SIMILARITY_ENGINE";
  severity: "SEVERE" | "HIGH" | "MODERATE" | "LOW" | null;
  verification_probability: number | null;
  concept_density: number | null;
  density_zone: "SPARSE" | "MODERATE" | "DENSE" | "SATURATED" | null;
  collision_index: number | null;
  rule_violations: RuleViolation[];
  similarity: SimilarityPayload | null;
  explanation: string;
};

type SuggestResult = {
  id: number;
  title: string;
};

type SuggestResponse = {
  query: string;
  results: SuggestResult[];
};

type SuggestTraceStep = {
  prefix: string;
  count: number | null;
  status: "WAITING" | "HIT" | "MISS" | "ERROR";
  latencyMs: number | null;
};

type SystemMetrics = {
  total_titles: number;
  brand_clusters: number;
  brand_threshold: number;
  semantic_enabled: boolean;
  faiss_index_size: number;
  rules_enabled: number;
  similarity_layers: number;
  model: string;
  average_density: number;
  dense_title_count: number;
  saturated_title_count: number;
};

const API_BASE = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.trim() || "http://127.0.0.1:8000";

const states = [
  { code: "AND", name: "Andaman and Nicobar" },
  { code: "UP", name: "Uttar Pradesh" },
  { code: "DEL", name: "Delhi" },
  { code: "MAH", name: "Maharashtra" },
  { code: "MP", name: "Madhya Pradesh" },
  { code: "RAJ", name: "Rajasthan" },
];

const periodicities = [
  { label: "Daily", value: "D" },
  { label: "Weekly", value: "W" },
  { label: "Fortnightly", value: "F" },
  { label: "Monthly", value: "M" },
];

function formatPct(value: number | null, digits = 2): string {
  if (value === null || Number.isNaN(value)) return "N/A";
  return `${value.toFixed(digits)}%`;
}

function formatRatio(value: number | null, digits = 3): string {
  if (value === null || Number.isNaN(value)) return "N/A";
  return value.toFixed(digits);
}

function normalizeForSuggest(text: string): string {
  return text
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const statusStyles = {
  REJECTED: "text-[hsl(0_72%_55%)] border-[hsl(0_72%_55%/0.4)] bg-[hsl(0_72%_55%/0.08)]",
  REVIEW: "text-[hsl(43_90%_55%)] border-[hsl(43_90%_55%/0.4)] bg-[hsl(43_90%_55%/0.08)]",
};

const severityStyles: Record<string, string> = {
  SEVERE: "text-[hsl(0_72%_55%)]",
  HIGH: "text-[hsl(24_85%_58%)]",
  MODERATE: "text-[hsl(43_90%_55%)]",
  LOW: "text-[hsl(120_50%_55%)]",
};

const sectionCard = "relative overflow-hidden rounded-2xl border border-[hsl(0_0%_22%)] bg-[linear-gradient(180deg,hsl(0_0%_12%),hsl(0_0%_10%))] p-5 shadow-[0_8px_30px_hsl(0_0%_0%/0.25)]";
const fieldClass =
  "w-full px-4 py-3 rounded-xl bg-[hsl(0_0%_12%)] border border-[hsl(0_0%_22%)] text-[hsl(48_10%_88%)] placeholder:text-[hsl(0_0%_45%)] focus:outline-none focus:ring-1 focus:ring-[hsl(43_90%_50%/0.45)] focus:border-[hsl(43_90%_50%/0.35)]";

const Dashboard = () => {
  const [payload, setPayload] = useState<VerifyRequest>({
    title: "",
    state_code: "AND",
    city: "port blair",
    periodicity: "D",
  });
  const [suggestions, setSuggestions] = useState<SuggestResult[]>([]);
  const [suggestTrace, setSuggestTrace] = useState<SuggestTraceStep[]>([]);
  const [suggestError, setSuggestError] = useState<string | null>(null);
  const [isSuggestLoading, setIsSuggestLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [result, setResult] = useState<VerifyResponse | null>(null);
  const [verifyError, setVerifyError] = useState<string | null>(null);
  const [health, setHealth] = useState<string>("checking...");
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [isMetricsLoading, setIsMetricsLoading] = useState(true);
  const [showJson, setShowJson] = useState(true);
  const [jsonView, setJsonView] = useState<"request" | "response">("response");

  const canVerify = useMemo(
    () => payload.title.trim().length > 1 && payload.state_code && payload.city.trim().length > 1 && payload.periodicity,
    [payload],
  );
  const normalizedTitle = useMemo(() => normalizeForSuggest(payload.title), [payload.title]);

  const refreshSystem = async () => {
    setIsMetricsLoading(true);
    try {
      const [healthRes, metricsRes] = await Promise.all([fetch(`${API_BASE}/health`), fetch(`${API_BASE}/system-metrics`)]);
      if (!healthRes.ok) throw new Error(`health ${healthRes.status}`);
      if (!metricsRes.ok) throw new Error(`metrics ${metricsRes.status}`);
      const healthJson = (await healthRes.json()) as { status: string };
      const metricsJson = (await metricsRes.json()) as SystemMetrics;
      setHealth(healthJson.status);
      setMetrics(metricsJson);
    } catch (error) {
      setHealth("backend unreachable");
      setMetrics(null);
      setVerifyError(`System check failed: ${error instanceof Error ? error.message : "unknown error"}`);
    } finally {
      setIsMetricsLoading(false);
    }
  };

  useEffect(() => {
    void refreshSystem();
  }, []);

  useEffect(() => {
    if (!normalizedTitle) {
      setSuggestions([]);
      setSuggestTrace([]);
      setSuggestError(null);
      return;
    }

    if (normalizedTitle.length === 1) {
      setSuggestions([]);
      setSuggestError(null);
      setSuggestTrace([{ prefix: normalizedTitle, count: null, status: "WAITING", latencyMs: null }]);
      return;
    }

    const timer = window.setTimeout(async () => {
      setIsSuggestLoading(true);
      setSuggestError(null);
      const trace: SuggestTraceStep[] = [];

      try {
        const maxPrefixLength = Math.min(normalizedTitle.length, 8);
        const prefixes = Array.from({ length: maxPrefixLength - 1 }, (_, i) => normalizedTitle.slice(0, i + 2));

        let latestResults: SuggestResult[] = [];
        for (const prefix of prefixes) {
          const startedAt = performance.now();
          const response = await fetch(`${API_BASE}/suggest?q=${encodeURIComponent(prefix)}`);
          if (!response.ok) throw new Error(`suggest ${response.status}`);
          const json = (await response.json()) as SuggestResponse;
          const latency = Math.round(performance.now() - startedAt);
          const count = (json.results || []).length;

          trace.push({
            prefix,
            count,
            status: count > 0 ? "HIT" : "MISS",
            latencyMs: latency,
          });
          latestResults = json.results || [];
        }

        setSuggestTrace(trace);
        setSuggestions(latestResults);
      } catch (error) {
        setSuggestions([]);
        setSuggestTrace(trace);
        setSuggestError(`Suggest pipeline failed: ${error instanceof Error ? error.message : "unknown error"}`);
      } finally {
        setIsSuggestLoading(false);
      }
    }, 250);

    return () => window.clearTimeout(timer);
  }, [normalizedTitle]);

  const handleVerify = async () => {
    setVerifyError(null);
    setIsVerifying(true);
    setResult(null);
    setJsonView("response");
    try {
      const response = await fetch(`${API_BASE}/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error(`verify ${response.status}`);
      const json = (await response.json()) as VerifyResponse;
      setResult(json);
      setShowJson(true);
    } catch (error) {
      setVerifyError(`Verification failed: ${error instanceof Error ? error.message : "unknown error"}`);
    } finally {
      setIsVerifying(false);
    }
  };

  const currentJson = jsonView === "request" ? payload : result;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="fixed inset-0 pointer-events-none opacity-60" style={{ background: "radial-gradient(ellipse at 20% 10%, hsl(43 90% 50% / 0.06), transparent 45%), radial-gradient(ellipse at 85% 30%, hsl(43 90% 50% / 0.05), transparent 40%)" }} />
      <div className="container mx-auto px-6 pt-28 pb-20 space-y-6">
        <header className="space-y-3 relative z-10">
          <p className="text-xs font-medium tracking-[0.25em] uppercase text-[hsl(43_90%_50%)]">Verification Console</p>
          <h1 className="text-3xl md:text-4xl font-heading font-bold text-[hsl(48_10%_88%)]">Structured Technical Dashboard</h1>
          <p className="text-sm text-[hsl(0_0%_55%)]">Live backend integration with clearly separated request, telemetry, decision, and JSON inspector blocks.</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-1">
            <div className="rounded-xl border border-[hsl(0_0%_22%)] bg-[hsl(0_0%_11%)] px-3 py-2">
              <p className="text-[10px] uppercase tracking-wider text-[hsl(0_0%_45%)]">Health</p>
              <p className={`text-sm font-semibold ${health === "backend running" ? "text-[hsl(120_50%_55%)]" : "text-[hsl(0_72%_55%)]"}`}>{health}</p>
            </div>
            <div className="rounded-xl border border-[hsl(0_0%_22%)] bg-[hsl(0_0%_11%)] px-3 py-2">
              <p className="text-[10px] uppercase tracking-wider text-[hsl(0_0%_45%)]">Semantic</p>
              <p className={`text-sm font-semibold ${metrics?.semantic_enabled ? "text-[hsl(120_50%_55%)]" : "text-[hsl(24_85%_58%)]"}`}>{metrics?.semantic_enabled ? "Enabled" : "Disabled"}</p>
            </div>
            <div className="rounded-xl border border-[hsl(0_0%_22%)] bg-[hsl(0_0%_11%)] px-3 py-2">
              <p className="text-[10px] uppercase tracking-wider text-[hsl(0_0%_45%)]">FAISS Size</p>
              <p className="text-sm font-semibold text-[hsl(48_10%_88%)]">{metrics?.faiss_index_size ?? "N/A"}</p>
            </div>
            <div className="rounded-xl border border-[hsl(0_0%_22%)] bg-[hsl(0_0%_11%)] px-3 py-2">
              <p className="text-[10px] uppercase tracking-wider text-[hsl(0_0%_45%)]">Rules</p>
              <p className="text-sm font-semibold text-[hsl(48_10%_88%)]">{metrics?.rules_enabled ?? "N/A"}</p>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
          <section className="md:col-span-7 space-y-6">
            <div className={sectionCard}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-heading text-lg text-[hsl(48_10%_88%)] inline-flex items-center gap-2"><Search className="w-4 h-4 text-[hsl(43_90%_55%)]" /> 1) Request Builder</h2>
                <span className="text-xs text-[hsl(0_0%_45%)]">POST {API_BASE}/verify</span>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="md:col-span-2 space-y-2">
                  <label className="text-xs uppercase tracking-wider text-[hsl(0_0%_50%)]">Title</label>
                  <input
                    value={payload.title}
                    onChange={(e) => setPayload((prev) => ({ ...prev, title: e.target.value }))}
                    placeholder="Enter title to verify"
                    className={fieldClass}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs uppercase tracking-wider text-[hsl(0_0%_50%)]">State Code</label>
                  <select
                    value={payload.state_code}
                    onChange={(e) => setPayload((prev) => ({ ...prev, state_code: e.target.value }))}
                    className={fieldClass}
                  >
                    {states.map((state) => (
                      <option key={state.code} value={state.code}>
                        {state.code} ({state.name})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs uppercase tracking-wider text-[hsl(0_0%_50%)]">Periodicity</label>
                  <select
                    value={payload.periodicity}
                    onChange={(e) => setPayload((prev) => ({ ...prev, periodicity: e.target.value }))}
                    className={fieldClass}
                  >
                    {periodicities.map((item) => (
                      <option key={item.value} value={item.value}>
                        {item.label} ({item.value})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="md:col-span-2 space-y-2">
                  <label className="text-xs uppercase tracking-wider text-[hsl(0_0%_50%)]">City</label>
                  <input
                    value={payload.city}
                    onChange={(e) => setPayload((prev) => ({ ...prev, city: e.target.value }))}
                    placeholder="Enter publication city"
                    className={fieldClass}
                  />
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-3">
                <button
                  onClick={handleVerify}
                  disabled={!canVerify || isVerifying}
                  className="btn-mustard px-6 py-3 text-sm font-semibold inline-flex items-center gap-2 disabled:opacity-50"
                >
                  {isVerifying ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                  {isVerifying ? "Verifying..." : "Run Verification"}
                </button>
                <button
                  onClick={() => {
                    setPayload({ title: "", state_code: "AND", city: "port blair", periodicity: "D" });
                    setSuggestions([]);
                    setSuggestTrace([]);
                    setSuggestError(null);
                    setResult(null);
                    setVerifyError(null);
                  }}
                  className="btn-outline-mustard px-6 py-3 text-sm"
                >
                  Reset
                </button>
              </div>
            </div>

            <div className={sectionCard}>
              <h2 className="font-heading text-lg text-[hsl(48_10%_88%)] mb-3 inline-flex items-center gap-2"><Sparkles className="w-4 h-4 text-[hsl(43_90%_55%)]" /> 2) Live Suggest Candidates</h2>
              <p className="text-xs text-[hsl(0_0%_50%)] mb-3">GET {API_BASE}/suggest?q=...</p>
              <div className="mb-3 p-3 rounded-lg border border-[hsl(0_0%_20%)] bg-[hsl(0_0%_12%)]">
                <p className="text-[10px] uppercase tracking-wider text-[hsl(0_0%_45%)] mb-2">Normalization + Letter-Wise Prefix Walk</p>
                <p className="text-xs text-[hsl(0_0%_65%)] mb-2">
                  raw: <span className="text-[hsl(48_10%_85%)]">{payload.title || "--"}</span>
                </p>
                <p className="text-xs text-[hsl(0_0%_65%)]">
                  normalized: <span className="text-[hsl(43_90%_55%)]">{normalizedTitle || "--"}</span>
                </p>
              </div>

              {isSuggestLoading ? (
                <p className="text-sm text-[hsl(0_0%_60%)] inline-flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" /> querying /suggest...
                </p>
              ) : suggestError ? (
                <p className="text-sm text-[hsl(0_72%_55%)] inline-flex items-center gap-2">
                  <XCircle className="w-4 h-4" /> {suggestError}
                </p>
              ) : suggestTrace.length > 0 ? (
                <div className="mb-3 grid sm:grid-cols-2 gap-2">
                  {suggestTrace.map((step) => (
                    <div key={step.prefix} className="px-3 py-2 rounded-lg border border-[hsl(0_0%_20%)] bg-[hsl(0_0%_12%)]">
                      <p className="text-xs text-[hsl(48_10%_84%)] font-mono">prefix: "{step.prefix}"</p>
                      <p className="text-[10px] text-[hsl(0_0%_55%)]">
                        status:{" "}
                        <span className={step.status === "HIT" ? "text-[hsl(120_50%_55%)]" : step.status === "MISS" ? "text-[hsl(24_85%_58%)]" : step.status === "ERROR" ? "text-[hsl(0_72%_55%)]" : "text-[hsl(43_90%_55%)]"}>
                          {step.status}
                        </span>
                        {" • "}
                        hits: {step.count === null ? "N/A" : step.count}
                        {" • "}
                        latency: {step.latencyMs === null ? "N/A" : `${step.latencyMs}ms`}
                      </p>
                    </div>
                  ))}
                </div>
              ) : suggestions.length > 0 ? (
                <></>
              ) : (
                <p className="text-sm text-[hsl(0_0%_60%)]">No suggestions yet. Type at least 2 characters in title.</p>
              )}

              {suggestions.length > 0 && (
                <div className="mt-3 rounded-lg border border-[hsl(0_0%_20%)] bg-[hsl(0_0%_12%)] overflow-hidden">
                  <div className="grid grid-cols-12 px-3 py-2 text-[10px] uppercase tracking-wider text-[hsl(0_0%_45%)] border-b border-[hsl(0_0%_20%)]">
                    <span className="col-span-1">#</span>
                    <span className="col-span-2">ID</span>
                    <span className="col-span-9">Title</span>
                  </div>
                  {suggestions.map((item, index) => (
                    <button
                      key={item.id}
                      onClick={() => setPayload((prev) => ({ ...prev, title: item.title }))}
                      className="w-full grid grid-cols-12 px-3 py-2 text-left border-b last:border-b-0 border-[hsl(0_0%_18%)] hover:bg-[hsl(43_90%_50%/0.06)] transition-colors"
                    >
                      <span className="col-span-1 text-xs text-[hsl(0_0%_50%)]">{index + 1}</span>
                      <span className="col-span-2 text-xs text-[hsl(0_0%_60%)]">{item.id}</span>
                      <span className="col-span-9 text-sm text-[hsl(48_10%_85%)]">{item.title}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {verifyError && (
              <div className={`${sectionCard} border border-[hsl(0_72%_55%/0.45)]`}>
                <p className="text-sm text-[hsl(0_72%_55%)] inline-flex items-center gap-2">
                  <XCircle className="w-4 h-4" /> {verifyError}
                </p>
              </div>
            )}

            {result && (
              <section className={`${sectionCard} space-y-5`}>
                <h2 className="font-heading text-lg text-[hsl(48_10%_88%)] inline-flex items-center gap-2"><BarChart3 className="w-4 h-4 text-[hsl(43_90%_55%)]" /> 5) Decision Output</h2>

                <div className="flex flex-wrap items-center gap-3">
                  <span className={`px-3 py-1 rounded-full border text-sm font-semibold ${statusStyles[result.status]}`}>{result.status}</span>
                  <span className="px-3 py-1 rounded-full border border-[hsl(0_0%_22%)] text-sm text-[hsl(0_0%_65%)]">{result.decision_basis}</span>
                  {result.severity && <span className={`text-sm font-semibold ${severityStyles[result.severity] || "text-[hsl(0_0%_80%)]"}`}>severity: {result.severity}</span>}
                </div>

                <div className="grid md:grid-cols-3 gap-4">
                  <div className="rounded-lg border border-[hsl(0_0%_20%)] bg-[hsl(0_0%_12%)] p-4">
                    <p className="text-[10px] uppercase tracking-wider text-[hsl(0_0%_45%)]">verification probability</p>
                    <p className="text-lg font-heading text-[hsl(48_10%_88%)]">{formatPct(result.verification_probability, 2)}</p>
                  </div>
                  <div className="rounded-lg border border-[hsl(0_0%_20%)] bg-[hsl(0_0%_12%)] p-4">
                    <p className="text-[10px] uppercase tracking-wider text-[hsl(0_0%_45%)]">concept density</p>
                    <p className="text-lg font-heading text-[hsl(48_10%_88%)]">{formatRatio(result.concept_density, 3)}</p>
                    <p className="text-xs text-[hsl(0_0%_55%)] mt-1">zone: {result.density_zone || "N/A"}</p>
                  </div>
                  <div className="rounded-lg border border-[hsl(0_0%_20%)] bg-[hsl(0_0%_12%)] p-4">
                    <p className="text-[10px] uppercase tracking-wider text-[hsl(0_0%_45%)]">collision index</p>
                    <p className="text-lg font-heading text-[hsl(48_10%_88%)]">{formatRatio(result.collision_index, 3)}</p>
                  </div>
                </div>

                <div className="grid lg:grid-cols-2 gap-4">
                  <div className="rounded-lg border border-[hsl(0_0%_20%)] bg-[hsl(0_0%_12%)] p-4">
                    <p className="text-sm font-semibold text-[hsl(48_10%_88%)] inline-flex items-center gap-2 mb-3">
                      <ShieldAlert className="w-4 h-4 text-[hsl(43_90%_55%)]" /> Rule Violations
                    </p>
                    {result.rule_violations.length > 0 ? (
                      <div className="space-y-2">
                        {result.rule_violations.map((rule) => (
                          <div key={`${rule.type}-${rule.message}`} className="p-3 rounded-lg border border-[hsl(0_72%_55%/0.25)] bg-[hsl(0_72%_55%/0.06)]">
                            <p className="text-xs text-[hsl(0_72%_55%)] font-semibold">{rule.type}</p>
                            <p className="text-sm text-[hsl(0_0%_70%)]">{rule.message}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-[hsl(0_0%_60%)]">No deterministic rule violations returned.</p>
                    )}
                  </div>

                  <div className="rounded-lg border border-[hsl(0_0%_20%)] bg-[hsl(0_0%_12%)] p-4">
                    <p className="text-sm font-semibold text-[hsl(48_10%_88%)] inline-flex items-center gap-2 mb-3">
                      <Sparkles className="w-4 h-4 text-[hsl(43_90%_55%)]" /> Similarity Layers
                    </p>
                    {result.similarity?.scores ? (
                      <div className="space-y-3">
                        <p className="text-xs text-[hsl(0_0%_55%)]">
                          best match: <span className="text-[hsl(48_10%_85%)]">{result.similarity.best_match || "N/A"}</span> | brand cluster:{" "}
                          <span className="text-[hsl(48_10%_85%)]">{result.similarity.is_brand_cluster ? "true" : "false"}</span>
                        </p>
                        {[
                          { key: "semantic", value: result.similarity.scores.semantic ?? 0 },
                          { key: "lexical", value: result.similarity.scores.lexical },
                          { key: "phonetic", value: result.similarity.scores.phonetic },
                          { key: "final", value: result.similarity.scores.final },
                        ].map((score) => (
                          <div key={score.key} className="space-y-1">
                            <div className="flex justify-between text-xs text-[hsl(0_0%_60%)]">
                              <span>{score.key}</span>
                              <span className="text-[hsl(48_10%_88%)]">{score.value.toFixed(2)}%</span>
                            </div>
                            <div className="h-2 rounded-full bg-[hsl(0_0%_18%)] overflow-hidden">
                              <div
                                className="h-full rounded-full bg-gradient-to-r from-[hsl(40_85%_40%)] to-[hsl(45_95%_60%)]"
                                style={{ width: `${Math.max(0, Math.min(score.value, 100))}%` }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-[hsl(0_0%_60%)]">Similarity payload unavailable for this decision.</p>
                    )}
                  </div>
                </div>

                <div className="rounded-lg border border-[hsl(0_0%_20%)] bg-[hsl(0_0%_12%)] p-4">
                  <p className="text-sm font-semibold text-[hsl(48_10%_88%)] mb-2">Explanation</p>
                  <p className="text-sm text-[hsl(0_0%_70%)] leading-relaxed inline-flex items-start gap-2">
                    {result.status === "REJECTED" ? (
                      <AlertTriangle className="w-4 h-4 mt-0.5 text-[hsl(0_72%_55%)]" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4 mt-0.5 text-[hsl(43_90%_55%)]" />
                    )}
                    <span>{result.explanation}</span>
                  </p>
                </div>
              </section>
            )}
          </section>

          <section className="md:col-span-5 space-y-6 md:sticky md:top-24 md:pl-2 md:border-l md:border-[hsl(0_0%_18%)]">
            <div className={sectionCard}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-heading text-lg text-[hsl(48_10%_88%)] inline-flex items-center gap-2"><Activity className="w-4 h-4 text-[hsl(43_90%_55%)]" /> 3) System Snapshot</h2>
                <button
                  onClick={() => void refreshSystem()}
                  className="text-[hsl(43_90%_55%)] hover:text-[hsl(45_95%_68%)] inline-flex items-center gap-1 text-xs"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isMetricsLoading ? "animate-spin" : ""}`} />
                  refresh
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs mb-3">
                <div className="rounded-lg border border-[hsl(0_0%_20%)] bg-[hsl(0_0%_12%)] p-3">
                  <p className="text-[hsl(0_0%_45%)] uppercase tracking-wider mb-1">health</p>
                  <p className="text-[hsl(48_10%_85%)] inline-flex items-center gap-1">
                    <Activity className="w-3.5 h-3.5 text-[hsl(43_90%_55%)]" /> {health}
                  </p>
                </div>
                <div className="rounded-lg border border-[hsl(0_0%_20%)] bg-[hsl(0_0%_12%)] p-3">
                  <p className="text-[hsl(0_0%_45%)] uppercase tracking-wider mb-1">semantic</p>
                  <p className="text-[hsl(48_10%_85%)] inline-flex items-center gap-1">
                    <Radar className="w-3.5 h-3.5 text-[hsl(43_90%_55%)]" />
                    {metrics?.semantic_enabled ? "enabled" : "disabled"}
                  </p>
                </div>
              </div>

              <div className="mb-3 p-3 rounded-lg border border-[hsl(0_0%_20%)] bg-[hsl(0_0%_12%)]">
                <p className="text-[10px] uppercase tracking-wider text-[hsl(0_0%_45%)] mb-2">Backend Signal Flow</p>
                <div className="grid grid-cols-2 gap-2 text-[10px]">
                  <div className="px-2 py-1 rounded border border-[hsl(0_0%_20%)]">
                    <span className="text-[hsl(0_0%_50%)]">/health</span>{" "}
                    <span className={health === "backend running" ? "text-[hsl(120_50%_55%)]" : "text-[hsl(0_72%_55%)]"}>{health === "backend running" ? "OK" : "FAIL"}</span>
                  </div>
                  <div className="px-2 py-1 rounded border border-[hsl(0_0%_20%)]">
                    <span className="text-[hsl(0_0%_50%)]">/suggest</span>{" "}
                    <span className={!suggestError ? "text-[hsl(120_50%_55%)]" : "text-[hsl(0_72%_55%)]"}>{!suggestError ? "OK" : "FAIL"}</span>
                  </div>
                  <div className="px-2 py-1 rounded border border-[hsl(0_0%_20%)]">
                    <span className="text-[hsl(0_0%_50%)]">FAISS</span>{" "}
                    <span className={metrics?.semantic_enabled ? "text-[hsl(120_50%_55%)]" : "text-[hsl(24_85%_58%)]"}>{metrics?.semantic_enabled ? "ENABLED" : "DISABLED"}</span>
                  </div>
                  <div className="px-2 py-1 rounded border border-[hsl(0_0%_20%)]">
                    <span className="text-[hsl(0_0%_50%)]">/verify</span>{" "}
                    <span className={result ? "text-[hsl(120_50%_55%)]" : "text-[hsl(43_90%_55%)]"}>{result ? "RESPONDED" : "IDLE"}</span>
                  </div>
                </div>
              </div>

              {metrics ? (
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between text-[hsl(0_0%_60%)]"><span className="inline-flex items-center gap-1"><Database className="w-3.5 h-3.5" /> total titles</span><span className="text-[hsl(48_10%_85%)]">{metrics.total_titles}</span></div>
                  <div className="flex justify-between text-[hsl(0_0%_60%)]"><span className="inline-flex items-center gap-1"><GitBranch className="w-3.5 h-3.5" /> brand clusters</span><span className="text-[hsl(48_10%_85%)]">{metrics.brand_clusters}</span></div>
                  <div className="flex justify-between text-[hsl(0_0%_60%)]"><span>brand threshold</span><span className="text-[hsl(48_10%_85%)]">{metrics.brand_threshold}</span></div>
                  <div className="flex justify-between text-[hsl(0_0%_60%)]"><span>faiss vectors</span><span className="text-[hsl(48_10%_85%)]">{metrics.faiss_index_size}</span></div>
                  <div className="flex justify-between text-[hsl(0_0%_60%)]"><span>rules enabled</span><span className="text-[hsl(48_10%_85%)]">{metrics.rules_enabled}</span></div>
                  <div className="flex justify-between text-[hsl(0_0%_60%)]"><span>layers active</span><span className="text-[hsl(48_10%_85%)]">{metrics.similarity_layers}</span></div>
                  <div className="flex justify-between text-[hsl(0_0%_60%)]"><span>avg density</span><span className="text-[hsl(48_10%_85%)]">{metrics.average_density.toFixed(3)}</span></div>
                  <div className="flex justify-between text-[hsl(0_0%_60%)]"><span>dense titles</span><span className="text-[hsl(48_10%_85%)]">{metrics.dense_title_count}</span></div>
                  <div className="flex justify-between text-[hsl(0_0%_60%)]"><span>saturated titles</span><span className="text-[hsl(48_10%_85%)]">{metrics.saturated_title_count}</span></div>
                  <div className="flex justify-between text-[hsl(0_0%_60%)]"><span>model</span><span className="text-[hsl(48_10%_85%)] text-right max-w-[12rem]">{metrics.model}</span></div>
                </div>
              ) : (
                <p className="text-sm text-[hsl(0_0%_60%)]">No metrics available.</p>
              )}
            </div>

            <div className={sectionCard}>
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-heading text-lg text-[hsl(48_10%_88%)] inline-flex items-center gap-2"><FileCode2 className="w-4 h-4 text-[hsl(43_90%_55%)]" /> 4) JSON Inspector</h2>
                <button
                  onClick={() => setShowJson((prev) => !prev)}
                  className="text-xs px-3 py-1.5 rounded-md border border-[hsl(0_0%_25%)] text-[hsl(0_0%_70%)] hover:border-[hsl(43_90%_50%/0.5)]"
                >
                  {showJson ? "Hide JSON" : "Show JSON"}
                </button>
              </div>
              <div className="mb-3 flex gap-2">
                <button
                  onClick={() => setJsonView("request")}
                  className={`text-xs px-3 py-1.5 rounded-md border ${jsonView === "request" ? "border-[hsl(43_90%_50%/0.5)] text-[hsl(43_90%_55%)]" : "border-[hsl(0_0%_25%)] text-[hsl(0_0%_65%)]"}`}
                >
                  Request JSON
                </button>
                <button
                  onClick={() => setJsonView("response")}
                  className={`text-xs px-3 py-1.5 rounded-md border ${jsonView === "response" ? "border-[hsl(43_90%_50%/0.5)] text-[hsl(43_90%_55%)]" : "border-[hsl(0_0%_25%)] text-[hsl(0_0%_65%)]"}`}
                >
                  Response JSON
                </button>
                <button
                  onClick={() => {
                    if (!currentJson) return;
                    void navigator.clipboard.writeText(JSON.stringify(currentJson, null, 2));
                  }}
                  className="text-xs px-3 py-1.5 rounded-md border border-[hsl(0_0%_25%)] text-[hsl(0_0%_65%)] hover:border-[hsl(43_90%_50%/0.5)] inline-flex items-center gap-1"
                >
                  <Copy className="w-3.5 h-3.5" /> Copy
                </button>
              </div>
              {showJson ? (
                <pre className="text-xs text-[hsl(0_0%_72%)] overflow-auto max-h-80 bg-[hsl(0_0%_9%)] p-3 rounded-lg border border-[hsl(0_0%_20%)]">
                  {currentJson ? JSON.stringify(currentJson, null, 2) : "// No response available yet. Run verification."}
                </pre>
              ) : (
                <p className="text-sm text-[hsl(0_0%_60%)]">JSON panel hidden.</p>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
