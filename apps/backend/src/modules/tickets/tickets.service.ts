import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { randomBytes } from 'crypto';
import { TicketsRepository } from './tickets.repository';
import { StorageService } from '../../infrastructure/storage/storage.service';
import { NotificationService } from '../notifications/notification.service';
import type { CreateTicketDto, UpdateTicketAdminDto, CreateReplyDto, ListTicketsQueryDto } from './tickets.dto';
import type { UploadedFile } from '../../infrastructure/storage/storage.service';

@Injectable()
export class TicketsService {
  constructor(
    private readonly repo:          TicketsRepository,
    private readonly storage:       StorageService,
    private readonly notifications: NotificationService,
  ) {}

  private generateNumber(): string {
    return `TKT-${randomBytes(4).toString('hex').toUpperCase()}`;
  }

  listAll(q: ListTicketsQueryDto)          { return this.repo.listAll(q); }
  listForUser(userId: number | bigint, page: number, limit: number) { return this.repo.listForUser(userId, page, limit); }

  async getById(id: number | bigint, userId?: number | bigint, isAdmin = false) {
    const ticket = await this.repo.findById(id);
    if (!ticket) throw new NotFoundException('Ticket not found');
    if (!isAdmin && userId !== undefined && Number(ticket.user_id) !== Number(userId)) throw new ForbiddenException();
    return ticket;
  }

  async create(dto: CreateTicketDto, userId: number | bigint) {
    const ticket = await this.repo.create({ ...dto, user_id: BigInt(userId), ticket_number: this.generateNumber() });
    void this.notifications.sendToAdmins(
      'admin.ticket_created',
      'New Support Ticket',
      `${ticket.ticket_number}: ${dto.subject}`,
      { ticket_id: Number(ticket.id), ticket_number: ticket.ticket_number, url: `/tickets/${ticket.id}` },
    );
    return ticket;
  }

  async adminUpdate(id: number | bigint, dto: UpdateTicketAdminDto) {
    const data: Record<string, unknown> = { ...dto };
    if (dto.assigned_to !== undefined) {
      data['assigned_to'] = dto.assigned_to ? BigInt(dto.assigned_to) : null;
    }
    if (dto.status === 'CLOSED' || dto.status === 'RESOLVED') data['closed_at'] = new Date();
    const ticket = await this.repo.update(id, data);
    if (dto.status) {
      const type = dto.status === 'CLOSED' ? 'ticket.closed' : 'ticket.status_changed';
      void this.notifications.send({
        type, userId: Number(ticket.user_id),
        title: dto.status === 'CLOSED' ? 'Ticket Closed' : 'Ticket Status Updated',
        message: `Your ticket ${ticket.ticket_number} status changed to ${dto.status}.`,
        data: { ticket_id: Number(ticket.id), url: `/tickets/${ticket.id}` },
      });
    }
    return ticket;
  }

  async close(id: number | bigint, userId: number | bigint) {
    const ticket = await this.getById(id, userId);
    if (ticket.status === 'CLOSED') return ticket;
    const updated = await this.repo.update(id, { status: 'CLOSED', closed_at: new Date() });
    void this.notifications.send({
      type: 'ticket.closed', userId: Number(userId),
      title: 'Ticket Closed',
      message: `Your ticket ${ticket.ticket_number} has been closed.`,
      data: { ticket_id: Number(ticket.id), url: `/tickets/${ticket.id}` },
    });
    return updated;
  }

  async addReply(ticketId: number | bigint, dto: CreateReplyDto, userId: number | bigint, isStaff: boolean, files?: UploadedFile[]) {
    const ticket = await this.getById(ticketId, userId, isStaff);
    const attachments: string[] = [];
    if (files?.length) {
      for (const file of files) {
        const path = await this.storage.upload(file, 'ticket_attachment');
        attachments.push(path);
      }
    }
    const reply = await this.repo.createReply({
      ticket_id: BigInt(ticketId),
      user_id: BigInt(userId),
      message: dto.message,
      is_staff_reply: isStaff,
      attachments,
    });
    // Notify ticket owner if staff replied; notify admins if user replied
    if (isStaff) {
      void this.notifications.send({
        type: 'ticket.replied', userId: Number(ticket.user_id),
        title: 'New Reply on Your Ticket',
        message: `Staff replied to your ticket ${ticket.ticket_number}.`,
        data: { ticket_id: Number(ticket.id), url: `/tickets/${ticket.id}` },
      });
    } else {
      void this.notifications.sendToAdmins(
        'admin.ticket_created', 'Ticket User Reply',
        `User replied on ticket ${ticket.ticket_number}.`,
        { ticket_id: Number(ticket.id), url: `/tickets/${ticket.id}` },
      );
    }
    return reply;
  }

  async delete(id: number | bigint) { return this.repo.delete(id); }
}
