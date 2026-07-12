'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';

function HomeIcon({ active }: { active: boolean }) {
  const c = active ? '#FF6B4A' : '#A99C8D';
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path d="M3 10.5L12 3l9 7.5V20a1 1 0 01-1 1H5a1 1 0 01-1-1v-9.5z" stroke={c} strokeWidth="2" strokeLinejoin="round" />
      <path d="M9 21v-7h6v7" stroke={c} strokeWidth="2" strokeLinejoin="round" />
    </svg>
  );
}

function TrackIcon({ active }: { active: boolean }) {
  const c = active ? '#FF6B4A' : '#A99C8D';
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <rect x="3" y="5" width="18" height="2.5" rx="1.25" fill={c} />
      <rect x="3" y="11" width="14" height="2.5" rx="1.25" fill={c} />
      <rect x="3" y="17" width="10" height="2.5" rx="1.25" fill={c} />
    </svg>
  );
}

function ProgressIcon({ active }: { active: boolean }) {
  const c = active ? '#FF6B4A' : '#A99C8D';
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <rect x="3" y="14" width="4" height="7" rx="1" fill={c} />
      <rect x="10" y="9" width="4" height="12" rx="1" fill={c} />
      <rect x="17" y="4" width="4" height="17" rx="1" fill={c} />
    </svg>
  );
}

function BadgesIcon({ active }: { active: boolean }) {
  const c = active ? '#FF6B4A' : '#A99C8D';
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="9" r="5" stroke={c} strokeWidth="2" />
      <path d="M7.5 14L6 21l6-3 6 3-1.5-7" stroke={c} strokeWidth="2" strokeLinejoin="round" />
    </svg>
  );
}

function MoreIcon({ active }: { active: boolean }) {
  const c = active ? '#FF6B4A' : '#A99C8D';
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <circle cx="5" cy="12" r="2" fill={c} />
      <circle cx="12" cy="12" r="2" fill={c} />
      <circle cx="19" cy="12" r="2" fill={c} />
    </svg>
  );
}

const PRIMARY_NAV = [
  { label: 'Home',     href: '/',         Icon: HomeIcon },
  { label: 'Track',    href: '/pipeline', Icon: TrackIcon },
  { label: 'Progress', href: '/progress', Icon: ProgressIcon },
  { label: 'Badges',   href: '/badges',   Icon: BadgesIcon },
];

const MORE_ITEMS = [
  { label: 'Games',     href: '/games',     available: true },
  { label: 'Insights',  href: '/insights',  available: true },
  { label: 'Resources', href: '/resources', available: true },
];

export default function BottomNav() {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href);

  const moreIsActive = MORE_ITEMS.some((item) => item.available && isActive(item.href));

  useEffect(() => {
    if (!moreOpen) return;
    function onPointerDown(e: MouseEvent) {
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) {
        setMoreOpen(false);
      }
    }
    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, [moreOpen]);

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-30 bg-white"
      style={{ borderTop: '2px solid #F1E2CF', paddingBottom: 'max(8px, env(safe-area-inset-bottom))' }}
    >
      <div className="max-w-2xl mx-auto flex items-stretch">
        {PRIMARY_NAV.map(({ label, href, Icon }) => {
          const active = isActive(href);
          return (
            <Link
              key={href}
              href={href}
              className="flex-1 flex flex-col items-center justify-center pt-2 pb-1 gap-0.5"
            >
              <Icon active={active} />
              <span className="text-[10px] font-bold" style={{ color: active ? '#FF6B4A' : '#A99C8D' }}>
                {label}
              </span>
            </Link>
          );
        })}

        {/* More */}
        <div ref={moreRef} className="flex-1 relative">
          <button
            onClick={() => setMoreOpen((v) => !v)}
            className="w-full flex flex-col items-center justify-center pt-2 pb-1 gap-0.5"
          >
            <MoreIcon active={moreIsActive || moreOpen} />
            <span className="text-[10px] font-bold" style={{ color: moreIsActive || moreOpen ? '#FF6B4A' : '#A99C8D' }}>
              More
            </span>
          </button>

          {moreOpen && (
            <div
              className="absolute bottom-full right-0 mb-2 w-44 bg-white rounded-[16px] shadow-xl overflow-hidden"
              style={{ border: '2px solid #F1E2CF' }}
            >
              {MORE_ITEMS.map(({ label, href, available }) =>
                available ? (
                  <Link
                    key={label}
                    href={href}
                    onClick={() => setMoreOpen(false)}
                    className="flex items-center justify-between px-4 py-3 hover:bg-[#FBF3E8] transition-colors"
                  >
                    <span className="text-sm font-fredoka font-semibold text-[#2C2724]">{label}</span>
                  </Link>
                ) : (
                  <div key={label} className="flex items-center justify-between px-4 py-3">
                    <span className="text-sm font-fredoka font-semibold text-[#C4B5A5]">{label}</span>
                    <span
                      className="text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-md"
                      style={{ background: '#F2E8DB', color: '#B8A99A' }}
                    >
                      Soon
                    </span>
                  </div>
                )
              )}
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
