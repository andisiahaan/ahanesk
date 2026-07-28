import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import type { ListTicketsQueryDto } from './tickets.dto';
import { buildPaginationMeta } from '@ahansk/shared';

const TICKET_INCLUDE = {
  user:     { select: { id: true, name: true, email: true } },
  assignee: { select: { id: true, name: true } },
  replies:  { include: { user: { select: { id: true, name: true, role: true } } }, orderBy: { created_at: 'asc' as const } },
};

@Injectable()
export class TicketsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async listAll(q: ListTicketsQueryDto) {
    const skip  = (q.page - 1) * q.limit;
    const where: Record<string, unknown> = {};
    if (q.status)   where['status']   = q.status;
    if (q.priority) where['priority'] = q.priority;
    if (q.category) where['category'] = q.category;
    if (q.search)   where['OR'] = [{ subject: { contains: q.search } }, { description: { contains: q.search } }];

    const [items, total] = await Promise.all([
      this.prisma.ticket.findMany({
        where, skip, take: q.limit, orderBy: { created_at: 'desc' },
        include: { user: { select: { id: true, name: true, email: true } }, assignee: { select: { id: true, name: true } }, _count: { select: { replies: true } } },
      }),
      this.prisma.ticket.count({ where }),
    ]);
    return { items, meta: buildPaginationMeta(total, q.page, q.limit) };
  }

  async listForUser(userId: string, page: number, limit: number) {
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      this.prisma.ticket.findMany({
        where: { user_id: userId },
        skip, take: limit,
        orderBy: { created_at: 'desc' },
        select: { id: true, ticket_number: true, subject: true, status: true, priority: true, created_at: true, _count: { select: { replies: true } } },
      }),
      this.prisma.ticket.count({ where: { user_id: userId } })
    ]);
    
    return { items, meta: buildPaginationMeta(total, page, limit) };
  }

  findById(id: string) {
    return this.prisma.ticket.findUnique({ where: { id }, include: TICKET_INCLUDE });
  }

  create(data: Record<string, unknown>) {
    return this.prisma.ticket.create({ data: data as never, include: TICKET_INCLUDE });
  }

  update(id: string, data: Record<string, unknown>) {
    return this.prisma.ticket.update({ where: { id }, data: data as never, include: TICKET_INCLUDE });
  }

  delete(id: string) { return this.prisma.ticket.delete({ where: { id } }); }

  createReply(data: Record<string, unknown>) {
    return this.prisma.ticketReply.create({ data: data as never, include: { user: { select: { id: true, name: true, role: true } } } });
  }
}
