import { createZodDto } from '../../common/utils/zod.dto';
import { CreatePageSchema, UpdatePageSchema } from '@ahanesk/shared';

export class CreatePageDto extends createZodDto(CreatePageSchema) {}
export class UpdatePageDto extends createZodDto(UpdatePageSchema) {}
