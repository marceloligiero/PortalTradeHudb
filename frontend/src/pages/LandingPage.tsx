import LandingNavbar from '../components/landing/LandingNavbar';
import HeroSection from '../components/landing/HeroSection';
import SocialProofBar from '../components/landing/SocialProofBar';
import PillarsSection from '../components/landing/PillarsSection';
import FeaturesGrid from '../components/landing/FeaturesGrid';
import StatsSection from '../components/landing/StatsSection';
import HowItWorks from '../components/landing/HowItWorks';
import QuoteSection from '../components/landing/QuoteSection';
import TechStack from '../components/landing/TechStack';
import FinalCTA from '../components/landing/FinalCTA';
import LandingFooter from '../components/landing/LandingFooter';

export default function LandingPage() {
  return (
    <>
      <LandingNavbar />
      <HeroSection />
      <SocialProofBar />
      <PillarsSection />
      <FeaturesGrid />
      <StatsSection />
      <HowItWorks />
      <QuoteSection />
      <TechStack />
      <FinalCTA />
      <LandingFooter />
    </>
  );
}
