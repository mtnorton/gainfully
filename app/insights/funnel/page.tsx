'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import AppHeader from '@/components/AppHeader';
import type { OutcomeType } from '@/lib/outcomes';

const ResponsiveSankey = dynamic(
  () => import('@nivo/sankey').then((m) => m.ResponsiveSankey),
  { ssr: false },
);

// ── Stage definitions ─────────────────────────────────────────────────────────

const POSITIVE_STAGES: OutcomeType[] = [
  'right_to_represent',
  'interview',
  'technical_screening',
  'technical_interview',
  'second_interview',
  'reference_check',
  'offer',
  'accepted_offer',
];

const NEGATIVE_STAGES: OutcomeType[] = ['rejection', 'ghosted', 'position_closed'];

const NODE_LABEL: Record<string, string> = {
  applied:              'Applied',
  right_to_represent:   'Submitted',
  interview:            'Interview',
  technical_screening: 'Tech Screen',
  technical_interview: 'Tech Interview',
  second_interview:    '2nd Interview',
  reference_check:     'Ref Check',
  offer:               'Offer',
  accepted_offer:      'Accepted',
  awaiting:            'Awaiting',
  rejection:           'Rejected',
  ghosted:             'Ghosted',
  position_closed:     'Closed',
};

const NODE_COLOR: Record<string, string> = {
  applied:             '#7C5CFC',
  right_to_represent:  '#2563EB',
  interview:           '#16A34A',
  technical_screening: '#0D9488',
  technical_interview: '#0891B2',
  second_interview:    '#2563EB',
  reference_check:     '#7C3AED',
  offer:               '#D97706',
  accepted_offer:      '#B45309',
  awaiting:            '#E8DDD3',
  rejection:           '#A99C8D',
  ghosted:             '#C4B5A5',
  position_closed:     '#D4C5B5',
};

// ── Sankey data builder ───────────────────────────────────────────────────────

interface SankeyNode { id: string }
interface SankeyLink { source: string; target: string; value: number }
interface SankeyData { nodes: SankeyNode[]; links: SankeyLink[] }

function buildSankeyData(
  appIds: string[],
  outcomesByApp: Map<string, OutcomeType[]>,
): SankeyData {
  const linkCounts = new Map<string, number>();
  const usedNodes = new Set<string>();

  const addLink = (from: string, to: string) => {
    const key = `${from}||${to}`;
    linkCounts.set(key, (linkCounts.get(key) ?? 0) + 1);
    usedNodes.add(from);
    usedNodes.add(to);
  };

  for (const appId of appIds) {
    const types = new Set(outcomesByApp.get(appId) ?? []);
    const positiveReached = POSITIVE_STAGES.filter((s) => types.has(s));
    const negativeReached = NEGATIVE_STAGES.find((n) => types.has(n));

    if (positiveReached.length === 0) {
      if (negativeReached) addLink('applied', negativeReached);
      else addLink('applied', 'awaiting');
    } else {
      addLink('applied', positiveReached[0]);
      for (let i = 1; i < positiveReached.length; i++) {
        addLink(positiveReached[i - 1], positiveReached[i]);
      }
      if (negativeReached && positiveReached[positiveReached.length - 1] !== 'accepted_offer') {
        addLink(positiveReached[positiveReached.length - 1], negativeReached);
      }
    }
  }

  const stageOrder = ['applied', ...POSITIVE_STAGES, 'awaiting', ...NEGATIVE_STAGES];
  const nodes: SankeyNode[] = stageOrder
    .filter((id) => usedNodes.has(id))
    .map((id) => ({ id }));

  const links: SankeyLink[] = [...linkCounts.entries()].map(([key, value]) => {
    const [source, target] = key.split('||');
    return { source, target, value };
  });

  return { nodes, links };
}

// ── Download helper ───────────────────────────────────────────────────────────

async function downloadAsPng(container: HTMLDivElement, totalApps: number, activityName: string) {
  const svgEl = container.querySelector('svg');
  if (!svgEl) return;

  const { width, height } = svgEl.getBoundingClientRect();
  const scale = 2;
  const topPad = 56;
  const botPad = 36;

  const canvas = document.createElement('canvas');
  canvas.width = width * scale;
  canvas.height = (height + topPad + botPad) * scale;

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  ctx.fillStyle = '#FFF6EC';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = '#2C2724';
  ctx.font = `bold ${17 * scale}px Fredoka, sans-serif`;
  ctx.fillText('Application Funnel', 20 * scale, 26 * scale);
  ctx.fillStyle = '#97887A';
  ctx.font = `${12 * scale}px Fredoka, sans-serif`;
  ctx.fillText(`${activityName} · ${totalApps} logged`, 20 * scale, 44 * scale);

  const cloned = svgEl.cloneNode(true) as SVGSVGElement;
  cloned.setAttribute('width', String(width));
  cloned.setAttribute('height', String(height));
  const svgStr = new XMLSerializer().serializeToString(cloned);
  const blob = new Blob([svgStr], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);

  await new Promise<void>((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      ctx.drawImage(img, 0, topPad * scale, width * scale, height * scale);
      URL.revokeObjectURL(url);
      resolve();
    };
    img.onerror = reject;
    img.src = url;
  });

  const stripY = (height + topPad) * scale;
  ctx.fillStyle = '#F1E2CF';
  ctx.fillRect(0, stripY, canvas.width, botPad * scale);

  const logoImg = new Image();
  logoImg.src = '/mvuu.png';
  await new Promise<void>((resolve) => {
    logoImg.onload = () => {
      const logoH = 18 * scale;
      const logoW = logoH * (logoImg.naturalWidth / logoImg.naturalHeight);
      ctx.drawImage(logoImg, 12 * scale, stripY + 9 * scale, logoW, logoH);
      resolve();
    };
    logoImg.onerror = () => {
      ctx.fillStyle = '#7C5CFC';
      ctx.font = `bold ${13 * scale}px Fredoka, sans-serif`;
      ctx.fillText('mvuu', 16 * scale, stripY + 22 * scale);
      resolve();
    };
  });

  ctx.fillStyle = '#97887A';
  ctx.font = `${11 * scale}px sans-serif`;
  ctx.fillText('mvuu.co — job search, gamified', canvas.width - 220 * scale, stripY + 22 * scale);

  const a = document.createElement('a');
  a.download = 'application-funnel.png';
  a.href = canvas.toDataURL('image/png');
  a.click();
}

// ── Page ──────────────────────────────────────────────────────────────────────

function trackEvent(name: string, params?: Record<string, string | number>) {
  const w = window as Window & { gtag?: (...args: unknown[]) => void };
  w.gtag?.('event', name, params);
}

export default function FunnelPage() {
  const [applications, setApplications] = useState<Array<{ id: string }>>([]);
  const [outcomesByApp, setOutcomesByApp] = useState<Map<string, OutcomeType[]>>(new Map());
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [sharing, setSharing] = useState(false);
  const chartRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { setLoading(false); return; }
      const userId = session.user.id;

      const [appsResult, outcomesResult] = await Promise.all([
        supabase.from('applications').select('id').eq('user_id', userId),
        supabase.from('outcomes').select('application_id, type').eq('user_id', userId).eq('archived', false),
      ]);

      const appList = (appsResult.data ?? []) as Array<{ id: string }>;
      setApplications(appList);

      if (appList.length === 0) { setLoading(false); return; }

      const appIdSet = new Set(appList.map((a) => a.id));
      const map = new Map<string, OutcomeType[]>();

      const allOutcomes = (outcomesResult.data ?? []) as Array<{ application_id: string | null; type: string }>;
      for (const o of allOutcomes) {
        if (o.application_id && appIdSet.has(o.application_id)) {
          if (!map.has(o.application_id)) map.set(o.application_id, []);
          map.get(o.application_id)!.push(o.type as OutcomeType);
        }
      }

      setOutcomesByApp(map);
      setLoading(false);
    }
    load();
  }, []);

  const applicationIds = useMemo(() => applications.map((a) => a.id), [applications]);

  const sankeyData = useMemo(
    () => applicationIds.length > 0 ? buildSankeyData(applicationIds, outcomesByApp) : null,
    [applicationIds, outcomesByApp],
  );

  async function handleDownload() {
    if (!chartRef.current) return;
    setDownloading(true);
    trackEvent('funnel_downloaded', { applications: applicationIds.length });
    try {
      await downloadAsPng(chartRef.current, applicationIds.length, 'All Applications');
    } finally {
      setDownloading(false);
    }
  }

  async function handleShare() {
    if (!chartRef.current) return;
    setSharing(true);
    trackEvent('funnel_shared_bluesky', { applications: applicationIds.length });
    try {
      await downloadAsPng(chartRef.current, applicationIds.length, 'All Applications');
      const text = encodeURIComponent(
        `My job application funnel — ${applicationIds.length} application${applicationIds.length !== 1 ? 's' : ''} tracked 🌊\n\nmvuu.co`
      );
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      if (isMobile) {
        window.location.href = `bluesky://intent/compose?text=${text}`;
        setTimeout(() => { window.location.href = `https://bsky.app/intent/compose?text=${text}`; }, 2000);
      } else {
        window.open(`https://bsky.app/intent/compose?text=${text}`, '_blank', 'noopener,noreferrer');
      }
    } finally {
      setSharing(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#FFF6EC]">
      <AppHeader />
      <main className="max-w-2xl mx-auto px-4 py-6">
        <div className="mb-6">
          <Link href="/insights" className="text-[#97887A] hover:text-[#2C2724] transition-colors text-sm">
            ← Insights
          </Link>
        </div>

        <div className="flex items-start justify-between mb-5">
          <div>
            <h1 className="font-fredoka font-bold text-[22px] text-[#2C2724] mb-1">Application Funnel</h1>
            <p className="text-[#97887A] text-[13px]">
              {applicationIds.length} application{applicationIds.length !== 1 ? 's' : ''} tracked
            </p>
          </div>
          {sankeyData && (
            <div className="flex items-center gap-2 mt-1">
              <button
                onClick={handleDownload}
                disabled={downloading || sharing}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[12px] font-fredoka font-semibold text-[#97887A] hover:text-[#2C2724] transition-colors disabled:opacity-50"
                style={{ border: '1.5px solid #EFE0CC' }}
              >
                {downloading ? 'Saving…' : (
                  <>
                    <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                      <path d="M6.5 1v7M3.5 5.5l3 3 3-3M1.5 10h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    Save PNG
                  </>
                )}
              </button>
              <button
                onClick={handleShare}
                disabled={downloading || sharing}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[12px] font-fredoka font-semibold text-[#97887A] hover:text-[#0085FF] transition-colors disabled:opacity-50"
                style={{ border: '1.5px solid #EFE0CC' }}
              >
                {sharing ? 'Saving…' : (
                  <>
                    <svg width="13" height="13" viewBox="0 0 600 530" fill="currentColor">
                      <path d="M135.72 44.03C202.216 93.951 273.74 195.464 300 249.466c26.262-53.994 97.785-155.515 164.28-205.437C512.68 8.763 590-9.193 590 80.921c0 17.536-10.057 147.344-15.951 168.48-20.503 73.29-95.38 91.993-161.855 80.664 116.153 19.778 145.68 85.307 81.855 150.836-121.239 124.395-174.34-31.229-187.346-71.12-2.042-5.994-3.009-8.803-3.028-6.42-.019-2.383-.986.426-3.028 6.42-13.006 39.891-66.107 195.515-187.346 71.12-63.825-65.529-34.298-131.058 81.855-150.836-66.475 11.329-141.352-7.374-161.855-80.664C25.957 228.265 15.9 98.457 15.9 80.921c0-90.114 77.32-72.158 119.82-36.891z"/>
                    </svg>
                    Bluesky
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        <div
          className="rounded-[18px] bg-white p-4"
          style={{ border: '2px solid #F1E2CF' }}
        >
          {loading && (
            <div className="h-[380px] flex items-center justify-center text-[#97887A] text-sm">
              Loading…
            </div>
          )}

          {!loading && applicationIds.length === 0 && (
            <div className="h-[380px] flex flex-col items-center justify-center text-center gap-3">
              <div className="text-4xl">🌊</div>
              <p className="font-fredoka font-semibold text-[16px] text-[#2C2724]">Nothing logged yet</p>
              <p className="text-[#97887A] text-[13px] max-w-xs leading-relaxed">
                Log some activities and results to see your funnel here.
              </p>
            </div>
          )}

          {!loading && sankeyData && (
            <div ref={chartRef} style={{ height: 380 }}>
              <ResponsiveSankey
                data={sankeyData}
                margin={{ top: 16, right: 112, bottom: 16, left: 112 }}
                align="justify"
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                colors={(node: any) => NODE_COLOR[node.id] ?? '#97887A'}
                nodeOpacity={1}
                nodeThickness={20}
                nodeSpacing={28}
                nodeBorderWidth={0}
                nodeBorderRadius={4}
                linkOpacity={0.25}
                linkHoverOpacity={0.5}
                linkContract={2}
                enableLinkGradient
                labelPosition="outside"
                labelOrientation="horizontal"
                labelPadding={14}
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                label={(node: any) => `${NODE_LABEL[node.id] ?? node.id} · ${node.value}`}
                theme={{
                  text: {
                    fontFamily: 'Fredoka, sans-serif',
                    fontSize: 12,
                    fill: '#2C2724',
                  },
                  tooltip: {
                    container: {
                      fontFamily: 'Fredoka, sans-serif',
                      fontSize: 12,
                      background: '#fff',
                      border: '1.5px solid #F1E2CF',
                      borderRadius: 10,
                      boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                      color: '#2C2724',
                    },
                  },
                }}
              />
            </div>
          )}
        </div>

        {!loading && sankeyData && (
          <div className="mt-4 flex flex-wrap gap-2">
            {sankeyData.nodes.map((n) => (
              <span
                key={n.id}
                className="flex items-center gap-1.5 text-[11px] text-[#97887A] font-fredoka"
              >
                <span
                  className="w-2.5 h-2.5 rounded-sm inline-block flex-shrink-0"
                  style={{ background: NODE_COLOR[n.id] ?? '#97887A' }}
                />
                {NODE_LABEL[n.id] ?? n.id}
              </span>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
