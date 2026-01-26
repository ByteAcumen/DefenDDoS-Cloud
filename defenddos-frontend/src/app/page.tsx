'use client';

import LandingNavbar from '@/components/landing/LandingNavbar';
import LandingFooter from '@/components/landing/LandingFooter';
import ScrollToTop from '@/components/landing/ScrollToTop';
import { SmoothScroll } from '@/components/SmoothScroll';
import HeroSection from '@/components/landing/HeroSection';
import StatsCounter from '@/components/landing/StatsCounter';
import FeaturesGrid from '@/components/landing/FeaturesGrid';
import TechStack from '@/components/landing/TechStack';

export default function HomePage() {
  return (
    <SmoothScroll>
      <main className="min-h-screen bg-[#0a0a1a]">
        <LandingNavbar />
        <HeroSection />
        <StatsCounter />
        <FeaturesGrid />
        <TechStack />
        <LandingFooter />
        <ScrollToTop />
      </main>
    </SmoothScroll>
  );
}
