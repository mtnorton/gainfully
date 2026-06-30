export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-[#FFF6EC]">
      <div className="max-w-2xl mx-auto px-6 py-12">
        <a
          href="/"
          className="inline-block mb-8 text-sm font-fredoka font-semibold text-[#7C5CFC] hover:opacity-80 transition-opacity"
        >
          ← Back to MVUU
        </a>

        <h1 className="font-fredoka font-bold text-[32px] text-[#2C2724] mb-2">Privacy Policy</h1>
        <p className="text-[13px] text-[#97887A] mb-10">Last updated: June 29, 2026</p>

        <div className="space-y-8 text-[#2C2724]">
          <section>
            <h2 className="font-fredoka font-bold text-[18px] mb-2">What we collect</h2>
            <p className="text-[14px] leading-relaxed text-[#4a3f37]">
              When you sign in with Google, we receive your name, email address, and profile picture.
              We also store the job search activity you log in the app — tasks, outcomes, badges, and
              progress. Nothing is collected passively; we only store what you explicitly enter.
            </p>
          </section>

          <section>
            <h2 className="font-fredoka font-bold text-[18px] mb-2">How we use it</h2>
            <ul className="text-[14px] leading-relaxed text-[#4a3f37] space-y-1.5 list-disc list-inside">
              <li>To save and sync your job search progress across devices</li>
              <li>To send you job search reminder emails — only if you opt in</li>
              <li>To send you occasional hippo jokes — only if you opt in, and only if they are funny enough</li>
            </ul>
            <p className="text-[14px] leading-relaxed text-[#4a3f37] mt-3">
              We do not sell your data. We do not share it with third parties except as strictly
              necessary to run the service (we use Supabase for our database and Vercel for hosting).
            </p>
          </section>

          <section>
            <h2 className="font-fredoka font-bold text-[18px] mb-2">Email communications</h2>
            <p className="text-[14px] leading-relaxed text-[#4a3f37]">
              We only send marketing or optional emails if you explicitly opt in during sign-up.
              You can update your preferences at any time by contacting us. Transactional emails
              (e.g., account-related notices) may be sent regardless of marketing preferences.
            </p>
          </section>

          <section>
            <h2 className="font-fredoka font-bold text-[18px] mb-2">Data retention & deletion</h2>
            <p className="text-[14px] leading-relaxed text-[#4a3f37]">
              Your data is retained as long as your account is active. To delete your account and
              all associated data, email us at{' '}
              <a href="mailto:mvuuapp@gmail.com" className="text-[#7C5CFC] underline">
                mvuuapp@gmail.com
              </a>{' '}
              and we will remove everything within 30 days.
            </p>
          </section>

          <section>
            <h2 className="font-fredoka font-bold text-[18px] mb-2">Cookies & local storage</h2>
            <p className="text-[14px] leading-relaxed text-[#4a3f37]">
              We use cookies only to maintain your login session (via Supabase Auth). We also use
              your browser&apos;s local storage to remember small bits of app state like your daily
              game pick. No tracking or advertising cookies are used.
            </p>
          </section>

          <section>
            <h2 className="font-fredoka font-bold text-[18px] mb-2">Contact</h2>
            <p className="text-[14px] leading-relaxed text-[#4a3f37]">
              Questions? Bugs? Hippo puns?{' '}
              <a href="mailto:mvuuapp@gmail.com" className="text-[#7C5CFC] underline">
                mvuuapp@gmail.com
              </a>
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
