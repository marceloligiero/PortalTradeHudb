import LandingNavbar    from '../components/landing/LandingNavbar';
import HeroSection      from '../components/landing/HeroSection';
import SocialProofBar   from '../components/landing/SocialProofBar';
import ProblemSection   from '../components/landing/ProblemSection';
import SolutionTabs     from '../components/landing/SolutionTabs';
import HowItWorks       from '../components/landing/HowItWorks';
import MetricsSection   from '../components/landing/MetricsSection';
import FinalCTA         from '../components/landing/FinalCTA';
import LandingFooter    from '../components/landing/LandingFooter';

export default function LandingPage() {
  return (
    <>
      <LandingNavbar />
      <HeroSection />
      <SocialProofBar />
      <ProblemSection />
      <SolutionTabs />
      <HowItWorks />
      <MetricsSection />
      <FinalCTA />
      <LandingFooter />
    </>
  );
}
