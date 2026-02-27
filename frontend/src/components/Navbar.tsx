import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

const navItems = [
  { label: "Features", href: "#dashboard" },
  { label: "System Metrics", href: "#metrics" },
  { label: "Architecture", href: "#architecture" },
  { label: "Docs", href: "#docs" },
];

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const isHome = location.pathname === "/";

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleNavClick = (href: string) => {
    if (!isHome) {
      navigate("/");
      setTimeout(() => {
        document.querySelector(href)?.scrollIntoView({ behavior: "smooth" });
      }, 300);
      return;
    }
    document.querySelector(href)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled
        ? "bg-[hsl(0_0%_9%/0.95)] backdrop-blur-xl border-b border-[hsl(0_0%_22%/0.7)] py-3"
        : "py-5"
        }`}
    >
      <div className="container mx-auto flex items-center justify-between px-6">
        {/* Logo */}
        <div className="relative">
          <Link
            to="/"
            className="font-heading text-2xl font-bold tracking-tight"
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
          >
            <span className="text-gradient-mustard">Veri</span>
            <span className="text-[hsl(48_10%_88%)]">Lex</span>
          </Link>

          {showTooltip && (
            <div className="absolute top-full left-0 mt-2 px-3 py-1.5 glass-card text-xs text-[hsl(0_0%_55%)] whitespace-nowrap animate-fade-in-up">
              Verification + Lexical Intelligence
            </div>
          )}
        </div>

        {/* Nav links */}
        <div className="hidden md:flex items-center gap-8">
          {navItems.map((item) => (
            <button
              key={item.label}
              onClick={() => handleNavClick(item.href)}
              className="nav-underline text-sm font-body text-[hsl(0_0%_55%)] hover:text-[hsl(48_10%_88%)] transition-colors duration-200"
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* CTA */}

      </div>
    </nav>
  );
};

export default Navbar;
