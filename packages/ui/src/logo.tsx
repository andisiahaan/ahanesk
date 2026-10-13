
interface LogoProps {
  /** URL of the web app root — logo.png is always at {webUrl}/logo.png */
  webUrl?: string;
  /** Width in px */
  width?: number;
  /** Height in px */
  height?: number;
  /** Alt text */
  alt?: string;
  className?: string;
}

/**
 * Brand logo component — always serves from web root /logo.png.
 * SSOT: logo lives only in apps/web/public/logo.png
 * Both web and admin consume the same asset via absolute URL.
 */
export function Logo({
  webUrl,
  width = 140,
  height = 36,
  alt = 'Logo',
  className = '',
}: LogoProps) {
  const baseUrl = webUrl || process.env.NEXT_PUBLIC_WEB_URL || '';
  const src = baseUrl
    ? `${baseUrl.replace(/\/$/, '')}/logo.png`
    : '/logo.png';

  return (
    <img
      src={src}
      alt={alt}
      style={{ height, width: 'auto', maxWidth: width || '100%' }}
      className={`object-contain ${className}`.trim()}
    />
  );
}
