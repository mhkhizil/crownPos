import { describe, expect, it } from '@jest/globals';
import {
  PurchaseOrderEntity,
  PurchaseOrderLineEntity,
} from '../../domain/entities/purchase-order.entity.js';
import { PurchaseStatus } from '../../domain/enums/purchase-status.enum.js';

function po(paid: number, total = 1000): PurchaseOrderEntity {
  return new PurchaseOrderEntity(
    'po-1',
    'f1',
    's1',
    'PO-1',
    new Date(),
    PurchaseStatus.RECEIVED,
    total,
    paid,
    null,
    [
      new PurchaseOrderLineEntity('l1', 'po-1', 'r1', 'u1', 1, 1, total, total),
    ],
    new Date(),
    new Date(),
    null,
  );
}

describe('PurchaseOrderEntity payment status', () => {
  it('UNPAID / PARTIALLY_PAID / PAID', () => {
    expect(po(0).paymentStatus()).toBe('UNPAID');
    expect(po(0).balanceDueMmk()).toBe(1000);
    expect(po(400).paymentStatus()).toBe('PARTIALLY_PAID');
    expect(po(400).balanceDueMmk()).toBe(600);
    expect(po(1000).paymentStatus()).toBe('PAID');
    expect(po(1000).balanceDueMmk()).toBe(0);
  });
});
