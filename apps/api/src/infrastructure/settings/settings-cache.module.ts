import { Global, Module } from '@nestjs/common';
import { SettingsCache } from './settings-cache.service';

@Global()
@Module({
  providers: [SettingsCache],
  exports: [SettingsCache],
})
export class SettingsCacheModule {}
