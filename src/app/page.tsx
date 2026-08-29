import type { Metadata } from 'next';
import HeroSection from '@/components/landing/HeroSection';
import FactionsSection from '@/components/landing/FactionsSection';
import Footer from '@/components/landing/Footer';
import PWAInstallHint from '@/components/landing/PWAInstallHint';
import JsonLd from '@/components/JsonLd';
import { webApplicationJsonLd, organizationJsonLd } from '@/lib/seo';

// The landing is the only page canonical to '/' — declared here (not in the root
// layout) so subpages without their own alternates don't inherit the homepage
// canonical. Resolved against metadataBase at build time.
export const metadata: Metadata = {
  alternates: { canonical: '/' },
};

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
