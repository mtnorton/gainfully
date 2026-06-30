'use client';

import { useEffect, useState } from 'react';
import { saveConsent } from '@/lib/supabase/storage';

interface ConsentModalProps {
  onDone: () => void;
}

export default function ConsentModal({ onDone }: ConsentModalProps) {
  const [emailReminders,  setEmailReminders]  = useState(true);
  const [emailHippoJokes, setEmailHippoJokes] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') handleDismiss(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleDismiss() {
    await saveConsent(false, false);
    onDone();
  }

  async function handleSubmit() {
    setSaving(true);
    await saveConsent(emailReminders, emailHippoJokes);
    onDone();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={handleDismiss} />
      <div
        className="relative z-10 w-full max-w-sm bg-white rounded-3xl shadow-2xl overflow-hidden"
        style={{ border: '2px solid #F1E2CF' }}
      >
        <button
          onClick={handleDismiss}
          className="absolute top-4 right-4 text-[#97887A] hover:text-[#2C2724] text-xl leading-none transition-colors z-10"
          aria-label="Dismiss"
        >
          ×
        </button>

        {/* Header */}
        <div className="flex flex-col items-center px-8 pt-8 pb-5 text-center">
          <img
            src="/mvuu.png"
            alt="Mvuu"
            className="w-20 h-20 rounded-full object-cover mb-4"
            style={{ border: '3px solid #EDE0FF', background: '#F5F0FF' }}
          />
          <h2 className="font-fredoka font-bold text-[20px] text-[#2C2724] mb-2">
            One quick thing
          </h2>
          <p className="text-[13px] text-[#6f6155] leading-relaxed">
            We store your name, email, and job search progress to power your account.
            We don&apos;t sell your data.{' '}
            <a
              href="/privacy"
              target="_blank"
              rel="noopener noreferrer"
              className="underline text-[#7C5CFC] hover:opacity-80 transition-opacity"
            >
              Privacy Policy
            </a>
          </p>
        </div>

        {/* Divider */}
        <div className="mx-8" style={{ borderTop: '2px solid #F1E2CF' }} />

        {/* Email prefs */}
        <div className="px-8 py-5 space-y-3">
          <p className="font-fredoka font-semibold text-[13px] text-[#97887A] uppercase tracking-wide">
            Optional emails
          </p>

          <label className="flex items-start gap-3 cursor-pointer group">
            <div className="relative flex-shrink-0 mt-0.5">
              <input
                type="checkbox"
                checked={emailReminders}
                onChange={(e) => setEmailReminders(e.target.checked)}
                className="sr-only"
              />
              <div
                className="w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors"
                style={{
                  borderColor: emailReminders ? '#7C5CFC' : '#D4C7FF',
                  background: emailReminders ? '#7C5CFC' : 'white',
                }}
              >
                {emailReminders && (
                  <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                    <path d="M1 4l3 3 5-6" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </div>
            </div>
            <div>
              <div className="font-fredoka font-semibold text-[14px] text-[#2C2724]">Job search reminders</div>
              <div className="text-[11px] text-[#97887A]">Occasional nudges to keep the momentum going</div>
            </div>
          </label>

          <label className="flex items-start gap-3 cursor-pointer group">
            <div className="relative flex-shrink-0 mt-0.5">
              <input
                type="checkbox"
                checked={emailHippoJokes}
                onChange={(e) => setEmailHippoJokes(e.target.checked)}
                className="sr-only"
              />
              <div
                className="w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors"
                style={{
                  borderColor: emailHippoJokes ? '#7C5CFC' : '#D4C7FF',
                  background: emailHippoJokes ? '#7C5CFC' : 'white',
                }}
              >
                {emailHippoJokes && (
                  <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                    <path d="M1 4l3 3 5-6" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </div>
            </div>
            <div>
              <div className="font-fredoka font-semibold text-[14px] text-[#2C2724]">Hippo jokes 🦛</div>
              <div className="text-[11px] text-[#97887A]">Occasional hippo puns. No promises they&apos;re good.</div>
            </div>
          </label>
        </div>

        {/* Footer */}
        <div className="px-8 pb-7">
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="w-full py-2.5 rounded-xl text-white font-fredoka font-semibold text-[15px] transition-opacity disabled:opacity-60"
            style={{ background: '#7C5CFC', boxShadow: '0 3px 0 #5B3FD6' }}
          >
            {saving ? 'Saving…' : "Let's go →"}
          </button>
          <p className="text-[10px] text-[#B8A99A] text-center mt-2.5">
            By clicking Let&apos;s go, you acknowledge our{' '}
            <a href="/privacy" target="_blank" rel="noopener noreferrer" className="underline hover:text-[#7C5CFC] transition-colors">
              Privacy Policy
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
