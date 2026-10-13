'use client';
import { useState, useEffect } from 'react';
import { User, Camera } from 'lucide-react';
import api from '@/lib/api';
import { useAuthStore } from '@/stores/auth.store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/components/ui/toast';

interface UserProfile { name: string; email: string; phone?: string | null; avatar?: string | null; }

async function fetchProfile(): Promise<UserProfile> {
  const res = await api.get<{ data: UserProfile }>('/users/me');
  return res.data.data;
}

export default function ProfileSettingsPage() {
  const fetchMe   = useAuthStore((s) => s.fetchMe);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [name, setName]       = useState('');
  const [phone, setPhone]     = useState('');
  const [loading, setLoading] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  useEffect(() => {
    fetchProfile().then((p) => {
      setProfile(p);
      setName(p.name);
      setPhone(p.phone ?? '');
    }).catch(() => toast.error('Failed to load profile.'));
  }, []);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('name', name);
      if (phone) fd.append('phone', phone);
      if (avatarFile) fd.append('avatar', avatarFile);
      await api.patch('/users/me', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success('Profile updated successfully.');
      await fetchMe();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg ?? 'Failed to update profile.');
    } finally { setLoading(false); }
  };

  const avatarSrc = avatarPreview ?? profile?.avatar ?? null;
  const initials  = (profile?.name ?? 'U').split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);

  return (
    <div className="max-w-2xl space-y-6 mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <User className="size-6" /> Profile
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Update your display name, phone, and avatar.</p>
      </div>

      <section className="rounded-2xl border border-border bg-card p-6 space-y-6">
        {/* Avatar */}
        <div className="flex items-center gap-5">
          <div className="relative">
            <div className="size-20 rounded-2xl bg-primary/10 flex items-center justify-center overflow-hidden border border-border">
              {avatarSrc
                ? <img src={avatarSrc} alt="Avatar" className="size-20 object-cover" />
                : <span className="text-2xl font-bold text-primary">{initials}</span>}
            </div>
            <label htmlFor="avatar-upload"
              className="absolute -bottom-1 -right-1 size-7 bg-card border border-border rounded-full flex items-center justify-center cursor-pointer hover:bg-muted transition-colors shadow-sm">
              <Camera className="size-3.5 text-muted-foreground" />
            </label>
            <input id="avatar-upload" type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">{profile?.name ?? '—'}</p>
            <p className="text-xs text-muted-foreground">{profile?.email ?? '—'}</p>
            <p className="text-xs text-muted-foreground mt-1">To change your email, go to <strong>Security</strong>.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="profile-name">Full Name</Label>
            <Input id="profile-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" required />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="profile-email">Email Address</Label>
            <Input id="profile-email" value={profile?.email ?? ''} disabled className="opacity-60" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="profile-phone">Phone Number <span className="text-muted-foreground">(optional)</span></Label>
            <Input id="profile-phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+1 234 567 890" />
          </div>
          <Button type="submit" loading={loading}>Save Changes</Button>
        </form>
      </section>
    </div>
  );
}
