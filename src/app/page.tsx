import HeroSection from '@/components/landing/HeroSection';
import LoreSection from '@/components/landing/LoreSection';
import FactionsSection from '@/components/landing/FactionsSection';
import FinalCTA from '@/components/landing/FinalCTA';
import Footer from '@/components/landing/Footer';
import PWAInstallHint from '@/components/landing/PWAInstallHint';

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col bg-military-dark text-military-sand">
      {/* First screen - Hero + Footer */}
      <div className="flex flex-col relative" style={{ height: '100dvh' }}>
        <HeroSection className="flex-1" />
        <Footer />
      </div>

      {/* Rest of the content below - partially visible to hint at scroll */}
      <LoreSection />
      <FactionsSection />
      <FinalCTA />
      <PWAInstallHint />
    </main>
  );
}
