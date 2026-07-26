import { notFound } from 'next/navigation';
import { cookies } from 'next/headers';
import { apiFetch } from '@/lib/api';
import { TicketThread } from './ticket-thread';

interface PageProps { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params;
  return { title: `Ticket #${id.slice(0, 8).toUpperCase()}` };
}

async function getTicket(id: string) {
  const cookieStore = await cookies();
  const cookieString = cookieStore.getAll().map((c) => `${c.name}=${c.value}`).join('; ');
  const url = `${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:10311'}/tickets/${id}`;
  const res = await fetch(url, { headers: { cookie: cookieString }, cache: 'no-store' });
  if (!res.ok) return null;
  const data = await res.json();
  return data.data ?? null;
}

export default async function TicketDetailPage({ params }: PageProps) {
  const { id } = await params;
  const ticket = await getTicket(id);
  if (!ticket) notFound();
  return <TicketThread ticket={ticket} />;
}
