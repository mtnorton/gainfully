import AppHeader from '@/components/AppHeader';
import { RESOURCES, RESOURCE_CATEGORIES } from '@/lib/resources';

export default function ResourcesPage() {
  return (
    <div className="min-h-screen bg-[#FFF6EC]">
      <AppHeader />
      <main className="max-w-2xl mx-auto px-4 py-6 space-y-8">
        <div>
          <h1 className="font-fredoka font-bold text-[22px] text-[#2C2724]">Resources</h1>
          <p className="text-[#97887A] text-[13px] mt-0.5">Useful places to spend your time between applications.</p>
        </div>

        {RESOURCE_CATEGORIES.map((category) => {
          const items = RESOURCES.filter((r) => r.category === category);
          if (items.length === 0) return null;
          return (
            <section key={category}>
              <h2 className="font-fredoka font-bold text-[13px] text-[#97887A] uppercase tracking-widest mb-3">
                {category}
              </h2>
              <div className="space-y-2.5">
                {items.map((resource) => (
                  <a
                    key={resource.name}
                    href={resource.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block rounded-[18px] p-4 bg-white transition-colors hover:bg-[#FBF3E8] group"
                    style={{ border: '2px solid #F1E2CF', borderBottom: '4px solid #EFE0CC' }}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="font-fredoka font-bold text-[15px] text-[#2C2724] group-hover:text-[#7C5CFC] transition-colors">
                          {resource.name}
                        </p>
                        <p className="text-[#97887A] text-[13px] mt-1 leading-relaxed">
                          {resource.description}
                        </p>
                      </div>
                      <svg
                        className="flex-shrink-0 mt-0.5 text-[#C4B5A5] group-hover:text-[#7C5CFC] transition-colors"
                        width="16" height="16" viewBox="0 0 16 16" fill="none"
                      >
                        <path d="M6 3H3a1 1 0 00-1 1v9a1 1 0 001 1h9a1 1 0 001-1v-3M10 2h4m0 0v4m0-4L7 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                  </a>
                ))}
              </div>
            </section>
          );
        })}
      </main>
    </div>
  );
}
