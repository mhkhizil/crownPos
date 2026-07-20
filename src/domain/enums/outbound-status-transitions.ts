import { DeliveryChannel } from './delivery-channel.enum.js';
import { OutboundStatus } from './outbound-status.enum.js';

/** Allowed next statuses for DIRECT_TO_SHOP (nearby drop). */
const DIRECT_TRANSITIONS: Readonly<
  Record<OutboundStatus, readonly OutboundStatus[]>
> = {
  [OutboundStatus.READY_AT_FACTORY]: [
    OutboundStatus.RECEIVED_BY_CUSTOMER,
    OutboundStatus.CANCELLED,
  ],
  [OutboundStatus.SENT_TO_YANGON_GATE]: [],
  [OutboundStatus.IN_TRANSIT]: [],
  [OutboundStatus.AT_DESTINATION_GATE]: [],
  [OutboundStatus.RECEIVED_BY_CUSTOMER]: [],
  [OutboundStatus.CANCELLED]: [],
  [OutboundStatus.RETURNED]: [],
};

/** Allowed next statuses for VIA_GATE (factory → Yangon → dest → customer). */
const VIA_GATE_TRANSITIONS: Readonly<
  Record<OutboundStatus, readonly OutboundStatus[]>
> = {
  [OutboundStatus.READY_AT_FACTORY]: [
    OutboundStatus.SENT_TO_YANGON_GATE,
    OutboundStatus.CANCELLED,
  ],
  [OutboundStatus.SENT_TO_YANGON_GATE]: [
    OutboundStatus.IN_TRANSIT,
    OutboundStatus.CANCELLED,
  ],
  [OutboundStatus.IN_TRANSIT]: [
    OutboundStatus.AT_DESTINATION_GATE,
    OutboundStatus.RETURNED,
    OutboundStatus.CANCELLED,
  ],
  [OutboundStatus.AT_DESTINATION_GATE]: [
    OutboundStatus.RECEIVED_BY_CUSTOMER,
    OutboundStatus.RETURNED,
  ],
  [OutboundStatus.RECEIVED_BY_CUSTOMER]: [],
  [OutboundStatus.CANCELLED]: [],
  [OutboundStatus.RETURNED]: [],
};

export function allowedOutboundTransitions(
  channel: DeliveryChannel,
  fromStatus: OutboundStatus,
): readonly OutboundStatus[] {
  const map =
    channel === DeliveryChannel.DIRECT_TO_SHOP
      ? DIRECT_TRANSITIONS
      : VIA_GATE_TRANSITIONS;
  return map[fromStatus] ?? [];
}

export function isOutboundTransitionAllowed(
  channel: DeliveryChannel,
  fromStatus: OutboundStatus,
  toStatus: OutboundStatus,
): boolean {
  return allowedOutboundTransitions(channel, fromStatus).includes(toStatus);
}
