import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { USER_REPOSITORY } from '../../../domain/repositories/user.repository.interface.js';
import type { IUserRepository } from '../../../domain/repositories/user.repository.interface.js';
import { CASH_LEDGER_REPOSITORY } from '../../../domain/repositories/cash-ledger.repository.interface.js';
import type { ICashLedgerRepository } from '../../../domain/repositories/cash-ledger.repository.interface.js';
import { requirePermission } from '../_helpers/admin-authorization.helper.js';
import { PermissionCode } from '../../../domain/enums/permission-code.enum.js';
import { CashFlowView } from '../../../domain/enums/cash-flow-view.enum.js';
import { CashLedgerSource } from '../../../domain/enums/cash-ledger-source.enum.js';
import {
  CashLedgerBalancesQueryDto,
  CashLedgerBalancesResponseDto,
  CashLedgerEntryResponseDto,
  CreateCashLedgerEntryDto,
  ListCashLedgerQueryDto,
} from '../../dtos/cash-ledger/cash-ledger.dto.js';

function parseDateOnly(value: string): Date {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(value.trim());
  if (!m) throw new BadRequestException(`Invalid date: ${value}`);
  return new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])));
}

@Injectable()
export class CreateCashLedgerEntryUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly users: IUserRepository,
    @Inject(CASH_LEDGER_REPOSITORY)
    private readonly ledger: ICashLedgerRepository,
  ) {}

  async execute(
    actorId: string,
    body: CreateCashLedgerEntryDto,
  ): Promise<CashLedgerEntryResponseDto> {
    await requirePermission(this.users, actorId, PermissionCode.MANAGE_BD);
    const entry = await this.ledger.create({
      companyId: body.companyId ?? null,
      entryDate: parseDateOnly(body.entryDate),
      direction: body.direction,
      account: body.account,
      category: body.category,
      source: CashLedgerSource.MANUAL,
      amountMmk: body.amountMmk,
      notes: body.notes ?? null,
      createdByUserId: actorId,
    });
    return CashLedgerEntryResponseDto.fromEntity(entry);
  }
}

@Injectable()
export class ListCashLedgerEntriesUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly users: IUserRepository,
    @Inject(CASH_LEDGER_REPOSITORY)
    private readonly ledger: ICashLedgerRepository,
  ) {}

  async execute(
    actorId: string,
    query: ListCashLedgerQueryDto,
  ): Promise<CashLedgerEntryResponseDto[]> {
    await requirePermission(this.users, actorId, PermissionCode.MANAGE_BD);
    const rows = await this.ledger.list({
      view: query.view ?? CashFlowView.TOTAL,
      date: query.date ? parseDateOnly(query.date) : undefined,
      from: query.from ? parseDateOnly(query.from) : undefined,
      to: query.to ? parseDateOnly(query.to) : undefined,
      account: query.account,
      direction: query.direction,
      category: query.category,
    });
    return rows.map((r) => CashLedgerEntryResponseDto.fromEntity(r));
  }
}

@Injectable()
export class GetCashLedgerBalancesUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly users: IUserRepository,
    @Inject(CASH_LEDGER_REPOSITORY)
    private readonly ledger: ICashLedgerRepository,
  ) {}

  async execute(
    actorId: string,
    query: CashLedgerBalancesQueryDto,
  ): Promise<CashLedgerBalancesResponseDto> {
    await requirePermission(this.users, actorId, PermissionCode.MANAGE_BD);
    const balances = await this.ledger.getBalances(
      query.asOf ? parseDateOnly(query.asOf) : undefined,
      query.view ?? CashFlowView.TOTAL,
    );
    return CashLedgerBalancesResponseDto.fromBalances(balances);
  }
}

@Injectable()
export class DeleteCashLedgerEntryUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly users: IUserRepository,
    @Inject(CASH_LEDGER_REPOSITORY)
    private readonly ledger: ICashLedgerRepository,
  ) {}

  async execute(
    actorId: string,
    id: string,
  ): Promise<CashLedgerEntryResponseDto> {
    await requirePermission(this.users, actorId, PermissionCode.MANAGE_BD);
    const deleted = await this.ledger.softDelete(id);
    if (!deleted) {
      throw new NotFoundException(`Cash ledger entry ${id} not found`);
    }
    return CashLedgerEntryResponseDto.fromEntity(deleted);
  }
}
