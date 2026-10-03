'use client';
import React, { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { allCheckIns } from '@/lib/data/checkIns';
import { listExperiments, listAttempts } from '@/lib/data/experiments';
import { listInsights } from '@/lib/data/insightsRepo';
import { buildMap, MapModel } from '@/lib/map/model';
import ResponseMap from '@/components/map/ResponseMap';
import { Spinner } from '@/components/ui/Spinner';
import Link from 'next/link';

export default function MapPage() {
  const { user } = useAuth();
  const [model, setModel] = useState<MapModel | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const [checkIns, experiments, insights] = await Promise.all([
          allCheckIns(user.uid),
          listExperiments(user.uid),
          listInsights(user.uid),
        ]);

        const attempts = [];
        for (const ex of experiments) {
          const atts = await listAttempts(user.uid, ex.id);
          attempts.push(...atts);
        }

        const mapModel = buildMap({
          checkIns,
          experiments,
          attempts,
          insights,
        });

        setModel(mapModel);
      } catch (e) {
        console.error('Error loading map model:', e);
      } finally {
        setLoading(false);
      }
    })();
  }, [user]);

  if (loading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center gap-3">
        <Spinner size="md" />
        <p className="text-xs text-ink-mute">Generating your Personal Response Map...</p>
      </div>
    );
  }

  if (!model || model.records.length === 0) {
    return (
      <div className="max-w-xl mx-auto space-y-4 text-center py-16">
        <div className="text-5xl mb-2">🗺️</div>
        <h1 className="font-display text-3xl text-ink">Personal Response Map</h1>
        <p className="text-sm text-ink-soft leading-relaxed">
          Your Response Map creates interactive visual linkages between your triggers, emotional states, chosen coping strategies, and reported outcomes.
        </p>
        <div className="pt-4">
          <Link
            href="/app/check-in"
            className="inline-flex items-center justify-center font-medium transition rounded-xl text-sm px-6 py-3 bg-coral text-white hover:bg-coral-deep shadow-soft"
          >
            Record your first check-in to seed the map
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl sm:text-4xl text-ink">
          Personal Response Map
        </h1>
        <p className="text-ink-soft text-sm mt-1 max-w-2xl leading-relaxed">
          Explore genuine connections formed across your check-ins and experiments. Notice clusters of situations, feelings, strategies, and outcomes.
        </p>
      </div>

      <ResponseMap
        model={model}
        recordsById={(id: string) => {
          const ci = model.records.find((r) => r.id === id);
          if (ci) {
            return (
              <div key={ci.id} className="text-xs p-3 bg-paper-soft rounded-xl border border-line">
                <div className="flex justify-between items-baseline mb-1">
                  <span className="font-semibold text-teal-deep">Check-in</span>
                  <span className="text-ink-mute">{new Date(ci.createdAt).toLocaleDateString()}</span>
                </div>
                <div>
                  <span className="text-coral-deep">{ci.situation}</span> →{' '}
                  <span className="text-amber-600">{ci.mood}</span>
                  {ci.strategiesUsed?.length ? ` → ${ci.strategiesUsed.join(', ')}` : ''} →{' '}
                  <span className="text-sage font-medium">{ci.outcome}</span>
                </div>
                {ci.thought && <div className="mt-1 text-ink-mute italic">"{ci.thought}"</div>}
              </div>
            );
          }
          const ex = model.experiments.find((e) => e.id === id);
          if (ex) {
            return (
              <div key={ex.id} className="text-xs p-3 bg-paper-soft rounded-xl border border-line">
                <span className="font-semibold text-teal-deep">Experiment:</span> {ex.question} ({ex.strategy})
              </div>
            );
          }
          return null;
        }}
      />
    </div>
  );
}
