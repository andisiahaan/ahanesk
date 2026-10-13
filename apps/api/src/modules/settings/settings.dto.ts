import { createZodDto } from '../../common/utils/zod.dto';
import { UpdateSettingSchema } from '@ahanesk/shared';

export class UpdateSettingDto extends createZodDto(UpdateSettingSchema) {}
