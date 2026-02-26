interface GridBackgroundProps {
  color?: string;
  opacity?: number;
  size?: number;
  className?: string;
}

export const GridBackground = ({ 
  color = '220, 38, 38', // RGB for red-600
  opacity = 0.3,
  size = 40,
  className = ''
}: GridBackgroundProps) => {
  return (
    <div 
      className={`absolute inset-0 pointer-events-none ${className}`}
      style={{
        opacity: opacity / 3,
        backgroundImage: `linear-gradient(rgba(${color}, ${opacity}) 1px, transparent 1px),
                         linear-gradient(90deg, rgba(${color}, ${opacity}) 1px, transparent 1px)`,
        backgroundSize: `${size}px ${size}px`
      }}
    />
  );
};

export default GridBackground;
