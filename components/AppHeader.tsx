import Link from 'next/link';

type ActivePage = 'dashboard' | 'pipeline' | 'badges';

interface AppHeaderProps {
  level: number;
  totalXP: number;
  badgeCount: number;
  activePage: ActivePage;
}

export default function AppHeader({ level, totalXP, badgeCount, activePage }: AppHeaderProps) {
  const navItems: { id: ActivePage; label: string; href: string }[] = [
    { id: 'dashboard', label: 'Dashboard', href: '/' },
    { id: 'pipeline', label: 'Pipeline', href: '/pipeline' },
    { id: 'badges', label: badgeCount > 0 ? `Badges · ${badgeCount}` : 'Badges', href: '/badges' },
  ];

  return (
    <header className="sticky top-0 z-30 bg-slate-950/80 backdrop-blur-md border-b border-slate-800/60">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-2xl">💼</span>
            <span className="text-xl font-bold text-slate-100 tracking-tight">Gainfully</span>
          </div>
          <nav className="flex gap-0.5">
            {navItems.map((item) =>
              activePage === item.id ? (
                <span key={item.id} className="text-sm px-3 py-1.5 rounded-lg bg-slate-800 text-slate-100 font-medium">
                  {item.label}
                </span>
              ) : (
                <Link key={item.id} href={item.href} className="text-sm px-3 py-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors">
                  {item.label}
                </Link>
              )
            )}
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 bg-violet-600/20 border border-violet-500/30 rounded-full px-3 py-1">
            <span className="text-violet-300 font-semibold text-sm">Lvl {level}</span>
          </div>
          <span className="text-yellow-400 font-bold text-sm">{totalXP.toLocaleString()} XP</span>
        </div>
      </div>
    </header>
  );
}
