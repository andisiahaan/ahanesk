'use client';
import { useEffect, useState, useCallback } from 'react';
import api from '@/lib/api';
import { SETTING_KEYS } from '@ahanesk/shared';
import type { AuthSettings, AppGeneralSettings } from '@ahanesk/shared';
import { toast } from '@/components/ui/toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/cn';

type AnySettings = AuthSettings | AppGeneralSettings | Record<string, unknown>;

const TABS = [
  { key: SETTING_KEYS.APP, label: 'General' },
  { key: SETTING_KEYS.AUTH, label: 'Auth' },
];

export default function SettingsPage() {
  const [tab, setTab] = useState<string>(SETTING_KEYS.APP);
  const [values, setValues] = useState<AnySettings>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async (key: string) => {
    setLoading(true);
    try {
      const { data } = await api.get(`/settings/${key}`);
      setValues((data.data?.settings as AnySettings) ?? {});
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(tab); }, [tab, load]);

  const save = async () => {
    setSaving(true);
    try {
      await api.patch(`/settings/${tab}`, { settings: values });
      toast.success('Settings saved.');
    } catch { toast.error('Failed to save settings.'); }
    finally { setSaving(false); }
  };

  const renderField = (k: string, v: unknown) => {
    if (typeof v === 'boolean') return (
      <label key={k} className="flex items-center gap-3 cursor-pointer">
        <input type="checkbox" checked={v} className="w-4 h-4 accent-primary"
          onChange={(e) => setValues((p) => ({ ...p, [k]: e.target.checked }))} />
        <span className="text-sm font-medium text-foreground">{k.replace(/_/g, ' ')}</span>
      </label>
    );
    return (
      <div key={k} className="flex flex-col gap-1.5">
        <Label>{k.replace(/_/g, ' ')}</Label>
        <Input type={typeof v === 'number' ? 'number' : 'text'} value={v as string | number}
          onChange={(e) => setValues((p) => ({ ...p, [k]: typeof v === 'number' ? Number(e.target.value) : e.target.value }))} />
      </div>
    );
  };

  return (
    <div className="max-w-5xl mx-auto w-full">
      <h1 className="text-2xl font-bold text-foreground mb-6">Settings</h1>

      <div className="flex gap-1 mb-6 border-b border-border pb-3">
        {TABS.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={cn(
              'px-4 py-1.5 rounded-lg text-sm font-semibold transition-colors',
              tab === t.key
                ? 'bg-primary/10 text-primary'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted',
            )}>
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground animate-pulse">Loading…</p>
      ) : (
        <div className="flex flex-col gap-4 mb-6">
          {Object.entries(values).map(([k, v]) => renderField(k, v))}
        </div>
      )}

      <Button onClick={save} loading={saving} disabled={loading}>Save Changes</Button>
    </div>
  );
}
