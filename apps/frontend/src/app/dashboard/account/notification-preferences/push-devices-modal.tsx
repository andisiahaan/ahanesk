'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Smartphone, Trash2, Wifi, X, Plus } from 'lucide-react';
import api from '@/lib/api';
import { toast } from '@/components/ui/toast';
import { getPushSubscription, registerServiceWorker } from '@/lib/push';
import { cn } from '@/lib/cn';

interface PushSubscription {
  id: string;
  endpoint: string;
  user_agent: string | null;
  created_at: string;
}

async function fetchSubscriptions(): Promise<PushSubscription[]> {
  const res = await api.get<{ data: PushSubscription[] }>('/notifications/push/subscriptions');
  return res.data.data;
}

function parseDeviceName(userAgent: string | null): string {
  if (!userAgent) return 'Unknown device';
  if (/iPhone/.test(userAgent)) return 'iPhone';
  if (/iPad/.test(userAgent)) return 'iPad';
  if (/Android/.test(userAgent)) return 'Android device';
  if (/Windows/.test(userAgent)) return 'Windows PC';
  if (/Macintosh/.test(userAgent)) return 'Mac';
  if (/Linux/.test(userAgent)) return 'Linux device';
  return 'Browser';
}

function parseBrowserName(userAgent: string | null): string {
  if (!userAgent) return '';
  if (/Edg\//.test(userAgent)) return 'Edge';
  if (/Chrome\//.test(userAgent)) return 'Chrome';
  if (/Firefox\//.test(userAgent)) return 'Firefox';
  if (/Safari\//.test(userAgent)) return 'Safari';
  return 'Browser';
}

interface Props {
  onClose: () => void;
  pushEnabled: boolean;
}

export function PushDevicesModal({ onClose, pushEnabled }: Props) {
  const qc = useQueryClient();
  const [currentEndpoint, setCurrentEndpoint] = useState<string | null>(null);
  const [isSubscribing, setIsSubscribing] = useState(false);

  const { data: subscriptions = [], isLoading } = useQuery({
    queryKey: ['push-subscriptions'],
    queryFn: fetchSubscriptions,
  });

  useEffect(() => {
    registerServiceWorker().then(async (reg) => {
      if (!reg) return;
      const sub = await reg.pushManager.getSubscription();
      if (sub) setCurrentEndpoint(sub.endpoint);
    });
  }, []);

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/notifications/push/subscriptions/${id}`),
    onSuccess: async (_, id) => {
      // If deleted subscription is current device, unregister SW subscription too
      const deleted = subscriptions.find((s) => s.id === id);
      if (deleted?.endpoint === currentEndpoint) {
        const reg = await registerServiceWorker();
        const sub = await reg?.pushManager.getSubscription();
        await sub?.unsubscribe();
        setCurrentEndpoint(null);
      }
      await qc.invalidateQueries({ queryKey: ['push-subscriptions'] });
      toast.success('Device removed.');
    },
    onError: () => toast.error('Failed to remove device.'),
  });

  const handleActivateThisDevice = async () => {
    setIsSubscribing(true);
    try {
      if (!('Notification' in window)) {
        toast.error('Your browser does not support push notifications.');
        return;
      }
      let permission = Notification.permission;
      if (permission === 'default') permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        toast.error('Notifications blocked. Please allow in browser settings.');
        return;
      }
      const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!vapidKey) { toast.error('VAPID key not configured.'); return; }
      const sub = await getPushSubscription(vapidKey);
      if (!sub) { toast.error('Could not subscribe. Try again.'); return; }
      const subJson = sub.toJSON();
      await api.post('/notifications/push/subscribe', {
        endpoint: subJson.endpoint,
        p256dh: subJson.keys?.p256dh,
        auth: subJson.keys?.auth,
        userAgent: navigator.userAgent,
      });
      setCurrentEndpoint(subJson.endpoint ?? null);
      await qc.invalidateQueries({ queryKey: ['push-subscriptions'] });
      toast.success('This device is now subscribed!');
    } catch {
      toast.error('Failed to subscribe. Try again.');
    } finally {
      setIsSubscribing(false);
    }
  };

  const isCurrentDevice = (sub: PushSubscription) => sub.endpoint === currentEndpoint;
  const currentDeviceSubscribed = subscriptions.some(isCurrentDevice);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md bg-card border border-border rounded-2xl shadow-2xl flex flex-col max-h-[80vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <Wifi className="w-4 h-4 text-primary" />
            <h2 className="font-semibold text-foreground text-sm">Browser Push Devices</h2>
          </div>
          <button
            onClick={onClose}
            className="size-7 flex items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Activate this device banner */}
        {!currentDeviceSubscribed && pushEnabled && (
          <div className="mx-4 mt-4 p-3.5 rounded-xl border border-primary/30 bg-primary/5 flex items-center justify-between gap-3 flex-shrink-0">
            <div>
              <p className="text-sm font-medium text-foreground">Activate on this device</p>
              <p className="text-xs text-muted-foreground mt-0.5">This browser is not yet receiving push notifications.</p>
            </div>
            <button
              onClick={handleActivateThisDevice}
              disabled={isSubscribing}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors flex-shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              {isSubscribing ? 'Activating…' : 'Activate'}
            </button>
          </div>
        )}

        {/* Subscriptions list */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {isLoading ? (
            <div className="space-y-2">
              {[...Array<undefined>(3)].map((_, i) => (
                <div key={i} className="h-16 rounded-xl bg-muted animate-pulse" />
              ))}
            </div>
          ) : subscriptions.length === 0 ? (
            <div className="py-10 text-center">
              <Smartphone className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No devices subscribed yet.</p>
            </div>
          ) : (
            subscriptions.map((sub) => {
              const isCurrent = isCurrentDevice(sub);
              const deviceName = parseDeviceName(sub.user_agent);
              const browserName = parseBrowserName(sub.user_agent);
              const addedDate = new Date(sub.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
              return (
                <div
                  key={sub.id}
                  className={cn(
                    'flex items-center justify-between p-3.5 rounded-xl border',
                    isCurrent ? 'border-primary/40 bg-primary/5' : 'border-border bg-background'
                  )}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={cn('size-8 rounded-lg flex items-center justify-center flex-shrink-0', isCurrent ? 'bg-primary/15' : 'bg-muted')}>
                      <Smartphone className={cn('w-4 h-4', isCurrent ? 'text-primary' : 'text-muted-foreground')} />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="text-sm font-medium text-foreground truncate">{deviceName} · {browserName}</p>
                        {isCurrent && (
                          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-primary/15 text-primary flex-shrink-0">
                            This device
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">Added {addedDate}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => deleteMutation.mutate(sub.id)}
                    disabled={deleteMutation.isPending}
                    className="size-7 flex items-center justify-center rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors flex-shrink-0 ml-2"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
