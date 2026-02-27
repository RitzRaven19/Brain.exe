import { Database, GitBranch, Cpu, Layers, Shield, Activity, Settings, Zap } from "lucide-react";

const metrics = [
  { icon: Database, label: "Total Titles in DB", value: "162,847" },
  { icon: GitBranch, label: "Brand Clusters Detected", value: "1,204" },
  { icon: Settings, label: "Brand Threshold", value: "0.85" },
  { icon: Zap, label: "Semantic Enabled", value: "Yes" },
  { icon: Cpu, label: "FAISS Index Size", value: "160K vectors" },
  { icon: Shield, label: "Rules Enabled", value: "12" },
  { icon: Layers, label: "Similarity Layers Active", value: "3" },
  { icon: Activity, label: "Model", value: "MiniLM-L12-v2" },
];

const recentApplications = [
  { id: "VLX-2024-0847", title: "MORNING EXPRESS", state: "MH", status: "REJECTED", severity: "SEVERE", probability: "4.2%", time: "2024-12-18 09:14" },
  { id: "VLX-2024-0846", title: "TODAY TIMES", state: "UP", status: "REVIEW", severity: "HIGH", probability: "7.53%", time: "2024-12-18 08:52" },
  { id: "VLX-2024-0845", title: "DELHI GUARDIAN", state: "DL", status: "APPROVED", severity: "LOW", probability: "82.4%", time: "2024-12-18 08:31" },
  { id: "VLX-2024-0844", title: "BHARAT SAMACHAR", state: "RJ", status: "REVIEW", severity: "MODERATE", probability: "34.1%", time: "2024-12-18 07:45" },
  { id: "VLX-2024-0843", title: "NATIONAL HERALD WEEKLY", state: "UP", status: "REJECTED", severity: "SEVERE", probability: "2.1%", time: "2024-12-17 16:22" },
];

const statusColors: Record<string, string> = {
  REJECTED: "text-[hsl(0_72%_55%)]",
  REVIEW: "text-[hsl(43_90%_55%)]",
  APPROVED: "text-[hsl(120_50%_50%)]",
};

const statusDots: Record<string, string> = {
  REJECTED: "bg-[hsl(0_72%_55%)]",
  REVIEW: "bg-[hsl(43_90%_55%)]",
  APPROVED: "bg-[hsl(120_50%_50%)]",
};

const severityColors: Record<string, string> = {
  SEVERE: "text-[hsl(0_72%_55%)]",
  HIGH: "text-[hsl(43_90%_55%)]",
  MODERATE: "text-[hsl(0_0%_60%)]",
  LOW: "text-[hsl(120_50%_50%)]",
};

const SystemMetricsSection = () => {
  return (
    <section id="metrics" className="relative py-32 min-h-screen flex items-center">
      <div className="absolute inset-0 gradient-mustard-glow" style={{ opacity: 0.6 }} />

      <div className="container mx-auto px-6 relative z-10 w-full">
        <div className="text-center mb-16 space-y-4">
          <p className="text-xs font-body font-medium tracking-[0.25em] uppercase text-[hsl(43_90%_50%)]">
            Live System Status
          </p>
          <h2 className="text-3xl md:text-5xl font-heading font-bold text-[hsl(48_10%_88%)]">
            System Metrics &amp; <span className="text-gradient-mustard">Operations</span>
          </h2>
          <p className="text-sm font-body text-[hsl(0_0%_50%)] max-w-lg mx-auto">
            Live snapshot of system readiness, index scale, and rule activation.
          </p>
        </div>

        {/* Metric cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-5xl mx-auto mb-16">
          {metrics.map((m, i) => (
            <div
              key={m.label}
              className="metric-card space-y-3"
              style={{ animationDelay: `${i * 0.07}s` }}
            >
              <m.icon className="w-4 h-4 text-[hsl(43_90%_50%)]" />
              <p className="text-xs font-body text-[hsl(0_0%_50%)]">{m.label}</p>
              <p className="text-xl font-heading font-bold text-[hsl(48_10%_88%)]">{m.value}</p>
            </div>
          ))}
        </div>

        {/* Application tracking table */}
        <div className="max-w-5xl mx-auto">
          <h3 className="text-lg font-heading font-semibold mb-6 text-[hsl(48_10%_88%)]">
            Application Tracking
          </h3>
          <div className="charcoal-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm font-body">
                <thead>
                  <tr className="border-b border-[hsl(0_0%_22%)]">
                    {["Submission ID", "Title", "State", "Status", "Severity", "Probability", "Timestamp"].map((h) => (
                      <th key={h} className="text-left px-5 py-4 text-xs text-[hsl(0_0%_45%)] uppercase tracking-wider font-medium">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {recentApplications.map((app) => (
                    <tr
                      key={app.id}
                      className="border-b border-[hsl(0_0%_18%)] hover:bg-[hsl(43_90%_50%/0.03)] transition-colors duration-200"
                    >
                      <td className="px-5 py-4 text-[hsl(0_0%_45%)] font-mono text-xs">{app.id}</td>
                      <td className="px-5 py-4 text-[hsl(48_10%_88%)] font-medium">{app.title}</td>
                      <td className="px-5 py-4 text-[hsl(0_0%_55%)]">{app.state}</td>
                      <td className={`px-5 py-4 font-semibold ${statusColors[app.status] || ""}`}>
                        <span className="flex items-center gap-2">
                          <span className={`w-1.5 h-1.5 rounded-full ${statusDots[app.status] || ""}`} />
                          {app.status}
                        </span>
                      </td>
                      <td className={`px-5 py-4 ${severityColors[app.severity] || ""}`}>{app.severity}</td>
                      <td className="px-5 py-4 text-[hsl(48_10%_88%)] font-heading font-semibold">{app.probability}</td>
                      <td className="px-5 py-4 text-[hsl(0_0%_45%)] text-xs">{app.time}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default SystemMetricsSection;
