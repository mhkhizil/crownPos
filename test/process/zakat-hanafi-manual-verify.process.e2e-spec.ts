/**
 * Five system-vs-manual Hanafi zakat calculates (M1–M5).
 * Mutates inventory/AR — run `npm run db:seed` after this suite.
 */
import 'dotenv/config';
import type { Server } from 'http';
import {
  apiPost,
  createProcessApp,
  loginRootAdmin,
} from './process-http.js';
import {
  canConnectDatabase,
  createProcessPrisma,
  type ProcessPrisma,
} from './process-prisma.js';
import { arrangeZakatManualFixture } from './zakat-arrange.js';
import {
  handZakatDue,
  M_SCENARIOS,
  ZAKAT_MANUAL,
} from './zakat-manual-worksheet.js';

const BASE = '/api/v1/admin/dashboard/bd-analytics';

type CalcDto = {
  nisabMmk: number;
  netZakatableMmk: number;
  meetsNisab: boolean;
  zakatDueMmk: number;
  receivablesMmk: number;
  finishedGoodsValueMmk: number;
  rawMaterialsValueMmk: number;
  excludedPhysicalAssetsMmk: number;
};

describe('L3 process: zakat manual-vs-system M1–M5', () => {
  let prisma: ProcessPrisma;
  let server: Server;
  let close: () => Promise<void>;
  let token: string;
  let dbOk = false;

  beforeAll(async () => {
    prisma = createProcessPrisma();
    dbOk = await canConnectDatabase(prisma);
    if (!dbOk) {
      console.warn('[zakat manual] DATABASE_URL unreachable — skipping');
      return;
    }
    const boot = await createProcessApp();
    server = boot.server;
    close = boot.close;
    token = await loginRootAdmin(server);
    await arrangeZakatManualFixture(prisma);
  });

  afterAll(async () => {
    if (close) await close();
    if (prisma) await prisma.$disconnect();
  });

  function requireDb(): void {
    if (!dbOk) pending('Postgres unavailable');
  }

  for (const s of M_SCENARIOS) {
    it(`${s.id}: ${s.intent} — API matches hand formula`, async () => {
      requireDb();
      const hand = handZakatDue({
        cash: s.cashOnHandMmk,
        bank: s.bankBalanceMmk,
        payables: s.payablesMmk,
        haulCompleted: s.haulCompleted,
        style: s.nisabStyle,
      });

      const res = await apiPost<CalcDto>(
        server,
        token,
        `${BASE}/zakat/hanafi/calculate`,
        {
          nisabStyle: s.nisabStyle,
          goldPricePerGramMmk: ZAKAT_MANUAL.goldPricePerGramMmk,
          silverPricePerGramMmk: ZAKAT_MANUAL.silverPricePerGramMmk,
          cashOnHandMmk: s.cashOnHandMmk,
          bankBalanceMmk: s.bankBalanceMmk,
          payablesMmk: s.payablesMmk,
          haulCompleted: s.haulCompleted,
        },
      );

      expect(res.status).toBe(200);
      const d = res.body.data!;
      expect(d.finishedGoodsValueMmk).toBeCloseTo(
        ZAKAT_MANUAL.fgQty * ZAKAT_MANUAL.fgSellPriceMmk,
        1,
      );
      expect(d.rawMaterialsValueMmk).toBeCloseTo(
        ZAKAT_MANUAL.rawQty * ZAKAT_MANUAL.rawCostMmk,
        1,
      );
      expect(d.receivablesMmk).toBeCloseTo(ZAKAT_MANUAL.arMmk, 1);
      expect(d.nisabMmk).toBeCloseTo(hand.nisabMmk, 1);
      expect(d.netZakatableMmk).toBeCloseTo(hand.netZakatableMmk, 1);
      expect(d.meetsNisab).toBe(hand.meetsNisab);
      expect(d.zakatDueMmk).toBeCloseTo(hand.zakatDueMmk, 1);

      if (s.id === 'M3') {
        expect(d.excludedPhysicalAssetsMmk).toBeCloseTo(
          ZAKAT_MANUAL.excludedBookValueMmk,
          1,
        );
        expect(d.netZakatableMmk).toBeLessThan(d.excludedPhysicalAssetsMmk + d.netZakatableMmk);
      }
    });
  }
});
