import {
  BadRequestException,
  Inject,
  Injectable,
} from '@nestjs/common';
import { USER_REPOSITORY } from '../../../domain/repositories/user.repository.interface.js';
import type { IUserRepository } from '../../../domain/repositories/user.repository.interface.js';
import { ZAKAT_REPOSITORY } from '../../../domain/repositories/zakat.repository.interface.js';
import type { IZakatRepository } from '../../../domain/repositories/zakat.repository.interface.js';
import { CASH_LEDGER_REPOSITORY } from '../../../domain/repositories/cash-ledger.repository.interface.js';
import type { ICashLedgerRepository } from '../../../domain/repositories/cash-ledger.repository.interface.js';
import { requirePermission } from '../_helpers/admin-authorization.helper.js';
import { PermissionCode } from '../../../domain/enums/permission-code.enum.js';
import {
  calculateHanafiBusinessZakat,
  ZakatValidationError,
} from '../../../domain/zakat/hanafi-business-zakat.calculator.js';
import { resolveZakatPeriod } from '../../../domain/zakat/resolve-zakat-period.js';
import { ZakatPeriodType } from '../../../domain/enums/zakat-period-type.enum.js';
import { CashFlowView } from '../../../domain/enums/cash-flow-view.enum.js';
import {
  CalculateHanafiZakatDto,
  HanafiZakatCalculateResponseDto,
} from '../../dtos/zakat/zakat.dto.js';

@Injectable()
export class CalculateHanafiZakatUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly users: IUserRepository,
    @Inject(ZAKAT_REPOSITORY) private readonly zakat: IZakatRepository,
    @Inject(CASH_LEDGER_REPOSITORY)
    private readonly cashLedger: ICashLedgerRepository,
  ) {}

  async execute(
    actorId: string,
    body: CalculateHanafiZakatDto,
  ): Promise<HanafiZakatCalculateResponseDto> {
    await requirePermission(this.users, actorId, PermissionCode.MANAGE_BD);

    const snapshot = await this.zakat.getWealthSnapshot();
    const otherPayablesMmk = body.payablesMmk ?? 0;
    const payablesMmk =
      Math.round((snapshot.supplierPayablesMmk + otherPayablesMmk) * 100) /
      100;

    let cashOnHandMmk = body.cashOnHandMmk;
    let bankBalanceMmk = body.bankBalanceMmk;
    const warnings = [...snapshot.warnings];

    if (body.useCashLedgerBalances) {
      const asOf = body.asOfDate
        ? (() => {
            const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(body.asOfDate.trim());
            if (!m) return undefined;
            return new Date(
              Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])),
            );
          })()
        : undefined;
      const balances = await this.cashLedger.getBalances(
        asOf,
        CashFlowView.TOTAL,
      );
      if (cashOnHandMmk == null) cashOnHandMmk = balances.cashOnHandMmk;
      if (bankBalanceMmk == null) bankBalanceMmk = balances.bankBalanceMmk;
      warnings.push(
        'Cash/bank from custom cash ledger (invoice collections & PO payments not auto-included).',
      );
    }

    let calc;
    try {
      calc = calculateHanafiBusinessZakat({
        cashOnHandMmk: cashOnHandMmk ?? 0,
        bankBalanceMmk: bankBalanceMmk ?? 0,
        receivablesMmk: snapshot.receivablesMmk,
        finishedGoodsValueMmk: snapshot.finishedGoodsValueMmk,
        rawMaterialsValueMmk: snapshot.rawMaterialsValueMmk,
        payablesMmk,
        haulCompleted: body.haulCompleted,
        nisabStyle: body.nisabStyle,
        goldPricePerGramMmk: body.goldPricePerGramMmk,
        silverPricePerGramMmk: body.silverPricePerGramMmk,
      });
    } catch (err: unknown) {
      if (err instanceof ZakatValidationError) {
        throw new BadRequestException(err.message);
      }
      throw err;
    }

    const year = body.year ?? new Date().getUTCFullYear();
    const window = resolveZakatPeriod({
      periodType: ZakatPeriodType.YEAR,
      year,
    });
    const overlapping = await this.zakat.listPaymentsOverlapping(
      window.periodStart,
      window.periodEnd,
    );

    return HanafiZakatCalculateResponseDto.fromCalc(calc, {
      excludedPhysicalAssetsMmk: snapshot.excludedPhysicalAssetsMmk,
      excludedDoubtfulReceivablesMmk: snapshot.excludedDoubtfulReceivablesMmk,
      supplierPayablesMmk: snapshot.supplierPayablesMmk,
      otherPayablesMmk,
      warnings,
      overlappingPayments: overlapping,
    });
  }
}
