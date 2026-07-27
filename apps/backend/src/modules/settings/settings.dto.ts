import { createZodDto } from '../../common/utils/zod.dto';
import { UpdateSettingSchema } from '@ahansk/shared';

export class UpdateSettingDto extends createZodDto(UpdateSettingSchema) {}
