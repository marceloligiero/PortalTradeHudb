import LandingNavbar from '../components/landing/LandingNavbar';
import HeroSection from '../components/landing/HeroSection';
import SocialProofBar from '../components/landing/SocialProofBar';
import HowItWorks from '../components/landing/HowItWorks';
import FeaturesGrid from '../components/landing/FeaturesGrid';
import StatsSection from '../components/landing/StatsSection';
import PillarsSection from '../components/landing/PillarsSection';
import TechStack from '../components/landing/TechStack';
import QuoteSection from '../components/landing/QuoteSection';
import FinalCTA from '../components/landing/FinalCTA';
import LandingFooter from '../components/landing/LandingFooter';

export default function LandingPage() {
  return (
    <>
      <LandingNavbar />
      <HeroSection />
      <SocialProofBar />
      <HowItWorks />
      <FeaturesGrid />
      <StatsSection />
      <PillarsSection />
      <TechStack />
      <QuoteSection />
      <FinalCTA />
      <LandingFooter />
    </>
  );
}
