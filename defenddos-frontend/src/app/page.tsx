import HeroSection from '@/components/landing/HeroSection';
import StatsCounter from '@/components/landing/StatsCounter';
import FeaturesGrid from '@/components/landing/FeaturesGrid';
import TechStack from '@/components/landing/TechStack';

export default function HomePage() {
  return (
    <main>
      <HeroSection />
      <StatsCounter />
      <FeaturesGrid />
      <TechStack />
    </main>
  );
}
