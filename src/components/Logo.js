export default function Logo({ className = '', size = 'default' }) {
  const sizes = {
    small: { wrapper: 'h-8', text: 'text-lg', tagline: 'text-[6px]' },
    default: { wrapper: 'h-10', text: 'text-xl', tagline: 'text-[7px]' },
    large: { wrapper: 'h-12', text: 'text-2xl', tagline: 'text-[8px]' },
  };

  const s = sizes[size] || sizes.default;

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      {/* OB Bridge Mark — matching the real OjaBridge logo with dual bridges and OB monogram */}
      <div className={`${s.wrapper} aspect-square flex items-center justify-center relative`}
        aria-hidden="true"
      >
        <svg viewBox="0 0 48 48" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Left bridge (purple) with supplier icon */}
          <path d="M2 32 C2 22, 14 16, 14 16" stroke="#5B21B6" strokeWidth="2" strokeLinecap="round" fill="none" />
          <path d="M14 16 C14 16, 10 22, 10 28" stroke="#5B21B6" strokeWidth="1.5" strokeLinecap="round" fill="none" opacity="0.6" />
          <line x1="2" y1="32" x2="14" y2="32" stroke="#5B21B6" strokeWidth="2" strokeLinecap="round" />
          {/* Left person + package icon */}
          <circle cx="5" cy="28" r="1.5" fill="#5B21B6" opacity="0.8" />
          <rect x="3" y="30" width="4" height="3" rx="0.5" fill="#5B21B6" opacity="0.6" />
          
          {/* Right bridge (lime) with customer icon */}
          <path d="M34 16 C34 16, 46 22, 46 32" stroke="#7ED321" strokeWidth="2" strokeLinecap="round" fill="none" />
          <path d="M34 16 C34 16, 38 22, 38 28" stroke="#7ED321" strokeWidth="1.5" strokeLinecap="round" fill="none" opacity="0.6" />
          <line x1="34" y1="32" x2="46" y2="32" stroke="#7ED321" strokeWidth="2" strokeLinecap="round" />
          {/* Right person + cart icon */}
          <circle cx="43" cy="28" r="1.5" fill="#7ED321" opacity="0.8" />
          <path d="M42 30 L44 30 L45 33 L41 33 Z" fill="none" stroke="#7ED321" strokeWidth="1" opacity="0.6" />
          
          {/* Central O letter (purple, bold) */}
          <circle cx="18" cy="20" r="9" stroke="#5B21B6" strokeWidth="4" fill="none" />
          {/* B letter overlapping (lime, bold) — designed as the B in the monogram */}
          <path d="M22 11 L22 29" stroke="#7ED321" strokeWidth="4" strokeLinecap="round" />
          <path d="M22 11 C22 11, 30 11, 30 16 C30 20, 22 20, 22 20" stroke="#7ED321" strokeWidth="3.5" strokeLinecap="round" fill="none" />
          <path d="M22 20 C22 20, 31 20, 31 24.5 C31 29, 22 29, 22 29" stroke="#7ED321" strokeWidth="3.5" strokeLinecap="round" fill="none" />
          
          {/* Bridge cables from center to sides */}
          <line x1="14" y1="18" x2="20" y2="14" stroke="#5B21B6" strokeWidth="0.8" opacity="0.3" />
          <line x1="34" y1="18" x2="28" y2="14" stroke="#7ED321" strokeWidth="0.8" opacity="0.3" />
        </svg>
      </div>
      {/* Wordmark */}
      <div className="flex flex-col">
        <span className={`${s.text} font-extrabold tracking-tight leading-none`}>
          <span className="text-ob-navy">Oja</span><span className="text-ob-purple">B</span><span className="text-ob-navy">ridge</span>
        </span>
        <span className={`${s.tagline} text-gray-400 font-medium tracking-[0.2em] uppercase leading-none mt-0.5`}>
          Shop • Connect • Grow
        </span>
      </div>
    </div>
  );
}
