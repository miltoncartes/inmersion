import logoMdi from "../assets/logo-mdi.jpg";

export function Logo({ size = 44, className = "" }: { size?: number; className?: string }) {
  return (
    <img
      src={logoMdi}
      alt="MDIBUCEO"
      width={size}
      height={size}
      className={`rounded-2xl object-cover ring-1 ring-white/10 ${className}`}
      style={{ width: size, height: size }}
    />
  );
}
