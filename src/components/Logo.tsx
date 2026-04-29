interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function Logo({ size = 'md', className = '' }: LogoProps) {
  const heights = {
    sm: 32,
    md: 40,
    lg: 64, // Slightly larger for lg login view
  };
  const h = heights[size];

  return (
    <img
      src="/logotipo.png"
      alt="Logotipo"
      className={`object-contain ${className}`}
      style={{ height: h, width: 'auto' }}
    />
  );
}
