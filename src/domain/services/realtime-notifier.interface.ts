export interface RealtimeTriggerOptions {
  channel: string;
  event: string;
  data: Record<string, unknown>;
}

export interface IRealtimeNotifier {
  /**
   * Publish a realtime event (e.g. Pusher). No-op implementations are allowed
   * when credentials are not configured.
   */
  trigger(options: RealtimeTriggerOptions): Promise<void>;
}

export const REALTIME_NOTIFIER = Symbol('REALTIME_NOTIFIER');
