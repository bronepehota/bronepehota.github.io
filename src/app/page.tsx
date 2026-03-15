import HeroSection from '@/components/landing/HeroSection';
import LoreSection from '@/components/landing/LoreSection';
import FactionsSection from '@/components/landing/FactionsSection';
import FinalCTA from '@/components/landing/FinalCTA';
import Footer from '@/components/landing/Footer';

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col bg-military-dark text-military-sand">
      {/* First screen - Hero + Footer visible above the fold */}
      <div className="flex flex-col relative" style={{ height: '94dvh' }}>
        <HeroSection className="flex-1" />
        <Footer />

        {/* Shadow gradient at bottom to create depth hint */}
        <div className="absolute bottom-0 left-0 right-0 h-6 bg-gradient-to-t from-military-dark via-military-dark/50 to-transparent pointer-events-none" />
      </div>

      {/* Rest of the content below - partially visible to hint at scroll */}
      <LoreSection />
      <FactionsSection />
      <FinalCTA />
    </main>
  );
}
