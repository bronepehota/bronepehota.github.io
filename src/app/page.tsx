import HeroSection from '@/components/landing/HeroSection';
import FactionsSection from '@/components/landing/FactionsSection';
import Footer from '@/components/landing/Footer';
import PWAInstallHint from '@/components/landing/PWAInstallHint';
import JsonLd from '@/components/JsonLd';
import { webApplicationJsonLd, organizationJsonLd } from '@/lib/seo';

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col bg-military-dark text-military-sand">
      <JsonLd data={[webApplicationJsonLd(), organizationJsonLd()]} />
      {/* First screen - Hero + Footer */}
      <div className="flex flex-col relative" style={{ height: '100dvh' }}>
        <HeroSection className="flex-1" />
        <Footer />
      </div>

      {/* Витрина фракций — единственный блок ниже первого экрана */}
      <FactionsSection />

      <PWAInstallHint />
    </main>
  );
}
