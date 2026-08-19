export function Logo({ size = 44, className = "" }: { size?: number; className?: string }) {
  return (
    <div
      className={`flex items-center justify-center rounded-2xl bg-gradient-to-br from-sky-600 to-navy-700 ring-1 ring-white/10 ${className}`}
      style={{ width: size, height: size }}
    >
      <svg
        width={size * 0.62}
        height={size * 0.62}
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M9 13c0-4.4 3.1-8 7-8s7 3.6 7 8v3c0 1.1-.9 2-2 2h-1.2c-.7 0-1.3.5-1.5 1.1L17.5 22c-.2.6-.8 1-1.5 1s-1.3-.4-1.5-1l-.8-2.9c-.2-.6-.8-1.1-1.5-1.1H11c-1.1 0-2-.9-2-2v-3Z"
          stroke="white"
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
        <circle cx="13" cy="14" r="1.3" fill="white" />
        <circle cx="19" cy="14" r="1.3" fill="white" />
        <path d="M15 9.5h2" stroke="white" strokeWidth="1.4" strokeLinecap="round" />
      </svg>
    </div>
  );
}
