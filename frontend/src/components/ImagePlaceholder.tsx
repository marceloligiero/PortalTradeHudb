interface Props {
  alt: string;
  className?: string;
  aspectRatio?: string;
}

export default function ImagePlaceholder({ alt, className = '', aspectRatio = '16/9' }: Props) {
  return (
    <div
      className={`bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center text-gray-400 text-sm rounded-xl ${className}`}
      style={{ aspectRatio }}
      role="img"
      aria-label={alt}
    >
      <span className="text-center px-4 font-body text-xs text-gray-400">{alt}</span>
    </div>
  );
}
