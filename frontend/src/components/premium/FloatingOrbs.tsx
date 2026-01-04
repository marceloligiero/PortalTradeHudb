import { motion } from 'framer-motion';

interface OrbConfig {
  color: string;
  size: string;
  position: string;
  animation: {
    x: number[];
    y: number[];
  };
  duration: number;
}

interface FloatingOrbsProps {
  variant?: 'default' | 'subtle' | 'vibrant';
  className?: string;
}

const orbConfigs: Record<string, OrbConfig[]> = {
  default: [
    {
      color: 'bg-red-600/20',
      size: 'w-96 h-96',
      position: '-top-48 -right-48',
      animation: { x: [0, 30, 0], y: [0, -20, 0] },
      duration: 8
    },
    {
      color: 'bg-blue-600/15',
      size: 'w-72 h-72',
      position: '-bottom-36 -left-36',
      animation: { x: [0, -25, 0], y: [0, 25, 0] },
      duration: 10
    },
    {
      color: 'bg-purple-600/10',
      size: 'w-64 h-64',
      position: 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2',
      animation: { x: [0, 20, -20, 0], y: [0, -15, 15, 0] },
      duration: 12
    }
  ],
  subtle: [
    {
      color: 'bg-red-600/10',
      size: 'w-64 h-64',
      position: '-top-32 -right-32',
      animation: { x: [0, 20, 0], y: [0, -15, 0] },
      duration: 10
    },
    {
      color: 'bg-blue-600/10',
      size: 'w-48 h-48',
      position: '-bottom-24 -left-24',
      animation: { x: [0, -15, 0], y: [0, 15, 0] },
      duration: 12
    }
  ],
  vibrant: [
    {
      color: 'bg-red-500/30',
      size: 'w-96 h-96',
      position: '-top-48 -right-48',
      animation: { x: [0, 50, 0], y: [0, -30, 0] },
      duration: 6
    },
    {
      color: 'bg-blue-500/25',
      size: 'w-80 h-80',
      position: '-bottom-40 -left-40',
      animation: { x: [0, -40, 0], y: [0, 35, 0] },
      duration: 8
    },
    {
      color: 'bg-purple-500/20',
      size: 'w-72 h-72',
      position: 'top-1/3 right-1/4',
      animation: { x: [0, 30, -30, 0], y: [0, -25, 25, 0] },
      duration: 10
    },
    {
      color: 'bg-orange-500/15',
      size: 'w-56 h-56',
      position: 'bottom-1/4 left-1/3',
      animation: { x: [0, -20, 20, 0], y: [0, 20, -20, 0] },
      duration: 14
    }
  ]
};

export default function FloatingOrbs({ variant = 'default', className = '' }: FloatingOrbsProps) {
  const orbs = orbConfigs[variant];

  return (
    <div className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}>
      {orbs.map((orb, index) => (
        <motion.div
          key={index}
          animate={orb.animation}
          transition={{
            duration: orb.duration,
            repeat: Infinity,
            ease: 'easeInOut'
          }}
          className={`absolute ${orb.size} ${orb.color} ${orb.position} rounded-full blur-3xl`}
        />
      ))}
    </div>
  );
}
