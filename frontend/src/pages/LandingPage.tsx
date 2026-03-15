import LandingNavbar from '../components/landing/LandingNavbar';
import HeroSection from '../components/landing/HeroSection';
import HowItWorks from '../components/landing/HowItWorks';
import FeaturesGrid from '../components/landing/FeaturesGrid';
import PillarsSection from '../components/landing/PillarsSection';
import StatsSection from '../components/landing/StatsSection';
import FinalCTA from '../components/landing/FinalCTA';
import LandingFooter from '../components/landing/LandingFooter';

export default function LandingPage() {
  return (
    <>
      <LandingNavbar />
      <HeroSection />
      <HowItWorks />
      <FeaturesGrid />
      <PillarsSection />
      <StatsSection />
      <FinalCTA />
      <LandingFooter />
    </>
  );
}
