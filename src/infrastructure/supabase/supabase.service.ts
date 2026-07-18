import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient } from '@supabase/supabase-js';

type SupabaseInstance = ReturnType<typeof createClient>;

@Injectable()
export class SupabaseService {
  private readonly logger = new Logger(SupabaseService.name);
  private readonly client: SupabaseInstance | null;

  constructor(private readonly configService: ConfigService) {
    const url = this.configService.get<string>('SUPABASE_URL')?.trim();
    const key = this.configService.get<string>('SUPABASE_SERVICE_KEY')?.trim();

    if (!url || !key) {
      this.client = null;
      this.logger.warn(
        'Supabase disabled: set SUPABASE_URL and SUPABASE_SERVICE_KEY to enable file storage',
      );
      return;
    }

    this.client = createClient(url, key);
  }

  isEnabled(): boolean {
    return this.client !== null;
  }

  getClient(): SupabaseInstance {
    if (!this.client) {
      throw new Error(
        'Supabase is not configured. Set SUPABASE_URL and SUPABASE_SERVICE_KEY.',
      );
    }
    return this.client;
  }

  get storage() {
    return this.getClient().storage;
  }
}
