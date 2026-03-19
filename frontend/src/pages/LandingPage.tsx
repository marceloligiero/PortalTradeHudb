import LandingNavbar       from '../components/landing/LandingNavbar';
import HeroSection         from '../components/landing/HeroSection';
import ProblemSection      from '../components/landing/ProblemSection';
import SolutionTabs        from '../components/landing/SolutionTabs';
import HowItWorks          from '../components/landing/HowItWorks';
import MetricsSection      from '../components/landing/MetricsSection';
import FinalCTA            from '../components/landing/FinalCTA';
import LandingFooter       from '../components/landing/LandingFooter';
import ScrollProgress      from '../components/landing/ScrollProgress';
import ScrollFlowLine      from '../components/landing/ScrollFlowLine';
import SectionTransition   from '../components/landing/SectionTransition';

export default function LandingPage() {
  return (
    <div className="relative">
      <LandingNavbar />
      <ScrollProgress />
      <ScrollFlowLine />
      <HeroSection />
      {/* Pulled up into hero bottom gradient — visible on load to entice scrolling */}
      <div className="-mt-20">
        <SectionTransition textKey="bridgeProblem" align="left" eager />
      </div>
      <ProblemSection />
      {/* Line: S-curve right→left | text: RIGHT */}
      <SectionTransition textKey="bridgeSolution" align="right" />
      <SolutionTabs />
      {/* Line: S-curve left→right | text: LEFT */}
      <SectionTransition textKey="bridgeHow" align="left" />
      <HowItWorks />
      {/* Line: S-curve right→left | text: RIGHT */}
      <SectionTransition textKey="bridgeMetrics" align="right" />
      <MetricsSection />
      <FinalCTA />
      <LandingFooter />
    </div>
  );
}
