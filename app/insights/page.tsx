import AppHeader from '@/components/AppHeader';

export default function InsightsPage() {
  return (
    <div className="min-h-screen bg-[#FFF6EC]">
      <AppHeader />
      <main className="max-w-2xl mx-auto px-4 py-12 flex flex-col items-center justify-center text-center">
        <div className="text-6xl mb-5">📊</div>
        <h1 className="font-fredoka font-bold text-[26px] text-[#2C2724] mb-2">Insights</h1>
        <p className="text-[#97887A] text-[15px] max-w-xs leading-relaxed">
          Keep logging activities and results — insights into your search patterns will appear here.
        </p>
      </main>
    </div>
  );
}
