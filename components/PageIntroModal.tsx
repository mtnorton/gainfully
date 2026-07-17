'use client';

import { useEffect, useState } from 'react';

interface PageIntroModalProps {
  storageKey: string;
  image: string;
  imageAlt: string;
  text: React.ReactNode;
  bubbleStyle?: React.CSSProperties;
  bubbleArrowStyle?: React.CSSProperties;
}

export default function PageIntroModal({
  storageKey,
  image,
  imageAlt,
  text,
  bubbleStyle,
  bubbleArrowStyle,
}: PageIntroModalProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem(storageKey)) setVisible(true);
  }, [storageKey]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') dismiss(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  });

  function dismiss() {
    localStorage.setItem(storageKey, '1');
    setVisible(false);
  }

  if (!visible) return null;

  const defaultBubble: React.CSSProperties = { background: '#F5F0FF', border: '2px solid #EDE0FF' };
  const defaultArrow: React.CSSProperties = { background: '#F5F0FF', border: '2px solid #EDE0FF' };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={dismiss} />
      <div
        className="relative z-10 w-full max-w-sm bg-white rounded-3xl shadow-2xl overflow-hidden"
        style={{ border: '2px solid #F1E2CF' }}
      >
        <button
          onClick={dismiss}
          className="absolute top-4 right-4 text-[#97887A] hover:text-[#2C2724] text-xl leading-none transition-colors z-10"
          aria-label="Dismiss"
        >
          ×
        </button>

        <div className="flex flex-col items-center px-8 pt-8 pb-6 text-center">
          <img
            src={image}
            alt={imageAlt}
            className="w-28 h-28 rounded-full object-cover mb-5"
            style={{ border: '3px solid #EDE0FF', background: '#F5F0FF' }}
          />
          <div
            className="relative rounded-2xl px-5 py-4 text-sm leading-relaxed text-[#2C2724]"
            style={bubbleStyle ?? defaultBubble}
          >
            <div
              className="absolute -top-2.5 left-1/2 -translate-x-1/2 w-4 h-4 rotate-45"
              style={{ ...(bubbleArrowStyle ?? defaultArrow), borderBottom: 'none', borderRight: 'none' }}
            />
            <p>{text}</p>
          </div>
        </div>

        <div className="flex justify-end px-8 pb-7">
          <button
            onClick={dismiss}
            className="px-5 py-2 rounded-xl text-white text-sm font-fredoka font-semibold transition-colors"
            style={{ background: '#7C5CFC', boxShadow: '0 3px 0 #5B3FD6' }}
          >
            Got it →
          </button>
        </div>
      </div>
    </div>
  );
}
