import { z } from 'zod';

export const CreatePatSchema = z.object({
  name:       z.string().min(1).max(100),
  expires_at: z.coerce.date().optional().nullable(),
});

import { createZodDto } from '../../common/utils/zod.dto';

export class CreatePatDto extends createZodDto(CreatePatSchema) {}
