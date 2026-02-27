import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import WhatVeriLexDoes from "@/components/WhatVeriLexDoes";
import SystemMetricsSection from "@/components/SystemMetricsSection";
import ArchitectureSection from "@/components/ArchitectureSection";
import FooterSection from "@/components/FooterSection";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <HeroSection />
      <WhatVeriLexDoes />
      <SystemMetricsSection />
      <ArchitectureSection />
      <FooterSection />
    </div>
  );
};

export default Index;
