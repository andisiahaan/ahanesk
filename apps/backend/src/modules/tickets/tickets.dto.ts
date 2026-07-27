import { z } from 'zod';

export const CreateTicketSchema = z.object({
  subject:     z.string().min(3).max(255),
  description: z.string().min(10),
  category:    z.string().max(100).optional().nullable(),
  priority:    z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
});

export const UpdateTicketAdminSchema = z.object({
  status:      z.enum(['OPEN', 'IN_PROGRESS', 'ON_HOLD', 'RESOLVED', 'CLOSED']).optional(),
  priority:    z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  assigned_to: z.string().uuid().optional().nullable(),
  category:    z.string().max(100).optional().nullable(),
});

export const CreateReplySchema = z.object({
  message: z.string().min(1),
});

export const ListTicketsQuerySchema = z.object({
  page:     z.coerce.number().int().min(1).default(1),
  limit:    z.coerce.number().int().min(1).max(50).default(20),
  status:   z.enum(['OPEN', 'IN_PROGRESS', 'ON_HOLD', 'RESOLVED', 'CLOSED']).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  category: z.string().optional(),
  search:   z.string().optional(),
});

import { createZodDto } from '../../common/utils/zod.dto';

export class CreateTicketDto extends createZodDto(CreateTicketSchema) {}
export class UpdateTicketAdminDto extends createZodDto(UpdateTicketAdminSchema) {}
export class CreateReplyDto extends createZodDto(CreateReplySchema) {}
export class ListTicketsQueryDto extends createZodDto(ListTicketsQuerySchema) {}
