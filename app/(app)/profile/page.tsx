'use client';
import React, { useState } from 'react';
import { signOut, deleteUser } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useAuth } from '@/lib/auth';
import { updateProfile, setPrefs } from '@/lib/data/userRepo';
import { allCheckIns } from '@/lib/data/checkIns';
import { listJournal } from '@/lib/data/journal';
import { listExperiments } from '@/lib/data/experiments';
import { listAssessments } from '@/lib/data/assessments';
import { listInsights } from '@/lib/data/insightsRepo';
import { Card } from '@/components/ui/Card';

export default function ProfilePage() {
  const { user, profile, refreshProfile } = useAuth();

  const [name, setName] = useState(profile?.displayName ?? '');
  const [handle, setHandle] = useState(profile?.handle ?? '');
  const [ai, setAi] = useState(
    profile?.preferences.aiContextSharing ?? {
      enabled: false,
      includeCheckIns: false,
      includeJournal: false,
      includeExperiments: false,
      includeAssessments: false,
      includeInsights: false,
    }
  );
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);

  const saveIdentity = async () => {
    if (!user) return;
    setBusy(true);
    try {
      await updateProfile(user.uid, {
        displayName: name.trim(),
        handle: handle.trim().replace(/^@/, ''),
      });
      await refreshProfile();
      setMsg('Identity details updated successfully.');
      setTimeout(() => setMsg(''), 3000);
    } catch {
      setMsg('Failed to update identity.');
    } finally {
      setBusy(false);
    }
  };

  const saveAiPrivacy = async () => {
    if (!user || !profile) return;
    setBusy(true);
    try {
      await setPrefs(user.uid, {
        ...profile.preferences,
        aiContextSharing: ai,
      });
      await refreshProfile();
      setMsg('Privacy preferences updated.');
      setTimeout(() => setMsg(''), 3000);
    } catch {
      setMsg('Failed to update privacy preferences.');
    } finally {
      setBusy(false);
    }
  };

  const toggleAi = (k: keyof typeof ai) => {
    setAi((prev: typeof ai) => ({ ...prev, [k]: !prev[k] }));
  };

  const handleExportData = async () => {
    if (!user) return;
    try {
      const [checkIns, journal, experiments, assessments, insights] =
        await Promise.all([
          allCheckIns(user.uid),
          listJournal(user.uid),
          listExperiments(user.uid),
          listAssessments(user.uid),
          listInsights(user.uid),
        ]);

      const exportPayload = {
        exportedAt: new Date().toISOString(),
        profile,
        checkIns,
        journal,
        experiments,
        assessments,
        insights,
      };

      const blob = new Blob([JSON.stringify(exportPayload, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `mentra-plus-export-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      alert('Could not compile export data.');
    }
  };

  const handleDeleteAccount = async () => {
    if (!user) return;
    const confirmPrompt = confirm(
      'Are you sure you want to delete your account? All private records will no longer be accessible.'
    );
    if (!confirmPrompt) return;

    try {
      await deleteUser(user);
      window.location.href = '/';
    } catch (e: any) {
      alert(
        'For security, please log out and sign in again before deleting your account.'
      );
    }
  };

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div>
        <h1 className="font-display text-3xl sm:text-4xl text-ink">
          Profile & Privacy
        </h1>
        <p className="text-ink-soft text-sm mt-1">
          Manage your personal identity, data controls, and AI context permissions.
        </p>
      </div>

      {msg && (
        <div className="p-3 bg-teal/10 text-teal-deep rounded-xl text-xs font-semibold">
          {msg}
        </div>
      )}

      {/* Identity Card */}
      <Card title="Identity & Pseudonym">
        <div className="space-y-4">
          <div>
            <label className="text-xs uppercase tracking-wide font-medium text-ink-mute block mb-1">
              Display Name (Private to you)
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl border border-line bg-paper-soft p-3 text-sm text-ink focus:border-teal focus:outline-none"
            />
          </div>

          <div>
            <label className="text-xs uppercase tracking-wide font-medium text-ink-mute block mb-1">
              Community Handle (Pseudonym shown in Circles)
            </label>
            <div className="flex items-center">
              <span className="text-ink-mute px-3 py-3 border border-r-0 border-line bg-paper-deep rounded-l-xl text-sm font-semibold">
                @
              </span>
              <input
                value={handle}
                onChange={(e) => setHandle(e.target.value)}
                className="w-full rounded-r-xl border border-line bg-paper-soft p-3 text-sm text-ink focus:border-teal focus:outline-none"
              />
            </div>
          </div>

          <button
            onClick={saveIdentity}
            disabled={busy}
            className="bg-ink text-paper px-5 py-2.5 rounded-xl text-xs font-semibold hover:bg-ink-soft transition shadow-soft disabled:opacity-50"
          >
            Save Identity
          </button>
        </div>
      </Card>

      {/* AI Sharing Card */}
      <Card
        title="AI Context Sharing (Opt-in)"
        subtitle="Mentora only receives minimal context if enabled here. Leave disabled to reflect only on what you type."
      >
        <div className="space-y-3 pt-2">
          <Toggle
            label="Enable AI Context Sharing"
            on={ai.enabled}
            onClick={() => toggleAi('enabled')}
          />

          {ai.enabled && (
            <div className="pl-4 space-y-2 border-l-2 border-teal/30 mt-3 pt-2 animate-breathe-in">
              <Toggle
                label="Include Recent Check-ins"
                on={ai.includeCheckIns}
                onClick={() => toggleAi('includeCheckIns')}
              />
              <Toggle
                label="Include Journal Reflections"
                on={ai.includeJournal}
                onClick={() => toggleAi('includeJournal')}
              />
              <Toggle
                label="Include Personal Experiments"
                on={ai.includeExperiments}
                onClick={() => toggleAi('includeExperiments')}
              />
              <Toggle
                label="Include Self-Assessment Scores"
                on={ai.includeAssessments}
                onClick={() => toggleAi('includeAssessments')}
              />
              <Toggle
                label="Include Discovered Insights"
                on={ai.includeInsights}
                onClick={() => toggleAi('includeInsights')}
              />
            </div>
          )}

          <div className="pt-3">
            <button
              onClick={saveAiPrivacy}
              disabled={busy}
              className="bg-teal text-white px-5 py-2.5 rounded-xl text-xs font-semibold hover:bg-teal-deep transition shadow-soft disabled:opacity-50"
            >
              Save AI Settings
            </button>
          </div>
        </div>
      </Card>

      {/* Data Management Card */}
      <Card title="Data Sovereignty">
        <p className="text-xs text-ink-soft mb-4 leading-relaxed">
          You own your wellbeing data. Export a complete JSON archive of all your entries, or delete your account.
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleExportData}
            className="bg-paper-deep text-ink-soft hover:text-ink px-4 py-2.5 rounded-xl text-xs font-semibold transition border border-line"
          >
            Export All Data (JSON)
          </button>
          <button
            onClick={handleDeleteAccount}
            className="text-coral-deep hover:underline text-xs font-semibold px-2 py-2"
          >
            Delete Account
          </button>
        </div>
      </Card>

      <button
        onClick={() => signOut(auth).then(() => (window.location.href = '/'))}
        className="w-full border border-line rounded-xl py-3 text-sm text-ink-soft hover:bg-paper-deep transition font-medium"
      >
        Sign Out
      </button>
    </div>
  );
}

function Toggle({
  label,
  on,
  onClick,
}: {
  label: string;
  on: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center justify-between w-full py-1.5 text-xs text-ink-soft hover:text-ink text-left"
    >
      <span className="font-medium">{label}</span>
      <span
        className={`w-9 h-5 rounded-full p-0.5 transition-colors duration-200 ease-in-out ${
          on ? 'bg-teal' : 'bg-line'
        }`}
      >
        <span
          className={`block w-4 h-4 bg-white rounded-full transition-transform duration-200 ease-in-out shadow-sm ${
            on ? 'translate-x-4' : ''
          }`}
        />
      </span>
    </button>
  );
}
