import {
  BadRequestException,
  Inject,
  Injectable,
} from '@nestjs/common';
import { USER_REPOSITORY } from '../../../domain/repositories/user.repository.interface.js';
import type { IUserRepository } from '../../../domain/repositories/user.repository.interface.js';
import { ZAKAT_REPOSITORY } from '../../../domain/repositories/zakat.repository.interface.js';
import type { IZakatRepository } from '../../../domain/repositories/zakat.repository.interface.js';
import { requirePermission } from '../_helpers/admin-authorization.helper.js';
import { PermissionCode } from '../../../domain/enums/permission-code.enum.js';
import {
  calculateHanafiBusinessZakat,
  ZakatValidationError,
} from '../../../domain/zakat/hanafi-business-zakat.calculator.js';
import { resolveZakatPeriod } from '../../../domain/zakat/resolve-zakat-period.js';
import { ZakatPeriodType } from '../../../domain/enums/zakat-period-type.enum.js';
import {
  CalculateHanafiZakatDto,
  HanafiZakatCalculateResponseDto,
} from '../../dtos/zakat/zakat.dto.js';

@Injectable()
export class CalculateHanafiZakatUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly users: IUserRepository,
    @Inject(ZAKAT_REPOSITORY) private readonly zakat: IZakatRepository,
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

    let calc;
    try {
      calc = calculateHanafiBusinessZakat({
        cashOnHandMmk: body.cashOnHandMmk ?? 0,
        bankBalanceMmk: body.bankBalanceMmk ?? 0,
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

    const now = new Date();
    const year = now.getUTCFullYear();
    const month = now.getUTCMonth() + 1;
    const window = resolveZakatPeriod({
      periodType: ZakatPeriodType.MONTH,
      year,
      month,
    });
    const overlapping = await this.zakat.listPaymentsOverlapping(
      window.periodStart,
      window.periodEnd,
    );

    return HanafiZakatCalculateResponseDto.fromCalc(calc, {
      excludedPhysicalAssetsMmk: snapshot.excludedPhysicalAssetsMmk,
      supplierPayablesMmk: snapshot.supplierPayablesMmk,
      otherPayablesMmk,
      warnings: snapshot.warnings,
      overlappingPayments: overlapping,
    });
  }
}
