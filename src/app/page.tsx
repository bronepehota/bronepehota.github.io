import HeroSection from '@/components/landing/HeroSection';
import LoreSection from '@/components/landing/LoreSection';
import FactionsSection from '@/components/landing/FactionsSection';
import FinalCTA from '@/components/landing/FinalCTA';
import Footer from '@/components/landing/Footer';

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col bg-military-dark text-military-sand">
      <HeroSection />
      <LoreSection />
      <FactionsSection />
      <FinalCTA />
      <Footer />
    </main>
  );
}
