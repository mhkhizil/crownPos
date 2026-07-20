import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Pusher from 'pusher';
import type {
  IRealtimeNotifier,
  RealtimeTriggerOptions,
} from '../../domain/services/realtime-notifier.interface.js';

@Injectable()
export class PusherRealtimeNotifier implements IRealtimeNotifier {
  private readonly logger = new Logger(PusherRealtimeNotifier.name);
  private readonly client: Pusher | null;

  constructor(config: ConfigService) {
    const appId = config.get<string>('PUSHER_APP_ID')?.trim();
    const key = config.get<string>('PUSHER_KEY')?.trim();
    const secret = config.get<string>('PUSHER_SECRET')?.trim();
    const cluster = config.get<string>('PUSHER_CLUSTER')?.trim();

    if (!appId || !key || !secret || !cluster) {
      this.client = null;
      this.logger.warn(
        'Pusher credentials missing (PUSHER_APP_ID/KEY/SECRET/CLUSTER). Collection reminder push alarms are disabled until configured.',
      );
      return;
    }

    this.client = new Pusher({
      appId,
      key,
      secret,
      cluster,
      useTLS: config.get<string>('PUSHER_USE_TLS', 'true') !== 'false',
    });
    this.logger.log(`Pusher realtime notifier ready (cluster=${cluster})`);
  }

  async trigger(options: RealtimeTriggerOptions): Promise<void> {
    if (!this.client) {
      this.logger.debug(
        `Skip Pusher trigger ${options.channel}/${options.event} (not configured)`,
      );
      return;
    }

    await this.client.trigger(options.channel, options.event, options.data);
    this.logger.log(
      `Pusher event ${options.event} on ${options.channel}`,
    );
  }
}
