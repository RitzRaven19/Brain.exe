import { Link } from "react-router-dom";

const FooterSection = () => {
  return (
    <>
      {/* CTA Banner before footer */}
      <section className="relative py-28" style={{ background: "hsl(0 0% 9%)" }}>
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: "radial-gradient(ellipse at 50% 50%, hsl(43 90% 50% / 0.07) 0%, transparent 65%)",
          }}
        />

        <div className="container mx-auto px-6 text-center relative z-10">
          <p className="text-xs font-body font-medium tracking-[0.25em] uppercase text-[hsl(43_90%_50%)] mb-4">
            Ready to Verify?
          </p>
          <h2 className="text-2xl md:text-4xl font-heading font-semibold text-[hsl(48_10%_85%)] max-w-3xl mx-auto leading-snug mb-8">
            VeriLex enables regulatory-grade title uniqueness enforcement at national scale.
          </h2>
          <Link
            to="/dashboard"
            className="btn-mustard inline-flex items-center gap-2 px-8 py-4 text-base font-body font-semibold"
            style={{ borderRadius: "0.875rem" }}
          >
            Run a Verification →
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ background: "hsl(0 0% 6%)", borderTop: "1px solid hsl(0 0% 18%)" }}>
        <div className="container mx-auto px-6 py-14">
          <div className="flex flex-col items-center gap-8">
            {/* Brand */}
            <div className="font-heading text-3xl font-bold tracking-tight">
              <span className="text-gradient-mustard">Veri</span>
              <span className="text-[hsl(48_10%_88%)]">Lex</span>
            </div>

            <p className="text-sm font-body text-[hsl(0_0%_45%)]">
              Verification + Lexical Intelligence
            </p>

            {/* Navigation links */}
            <div className="flex gap-8">
              <Link
                to="/dashboard"
                className="text-sm font-body text-[hsl(43_90%_50%)] hover:text-[hsl(45_95%_65%)] transition-colors duration-200"
              >
                Run a Verification
              </Link>
              <button
                onClick={() => document.querySelector("#metrics")?.scrollIntoView({ behavior: "smooth" })}
                className="text-sm font-body text-[hsl(43_90%_50%)] hover:text-[hsl(45_95%_65%)] transition-colors duration-200"
              >
                View System Metrics
              </button>
            </div>

            {/* Divider */}
            <div
              className="w-full max-w-xs h-px"
              style={{ background: "hsl(0 0% 20%)" }}
            />

            {/* Secondary links */}
            <div className="flex gap-8">
              {["Docs", "API", "Compliance Notes"].map((link) => (
                <span
                  key={link}
                  className="text-xs font-body text-[hsl(0_0%_40%)] hover:text-[hsl(0_0%_65%)] cursor-pointer transition-colors duration-200"
                >
                  {link}
                </span>
              ))}
            </div>

            {/* Copyright */}
            <p className="text-xs font-body text-[hsl(0_0%_30%)]">
              © 2024 VeriLex · Regulatory AI Decision Support
            </p>
          </div>
        </div>
      </footer>
    </>
  );
};

export default FooterSection;
