import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { CustomerReceiveMode } from '../../../domain/enums/customer-receive-mode.enum.js';
import { DeliveryChannel } from '../../../domain/enums/delivery-channel.enum.js';
import { OrderSource } from '../../../domain/enums/order-source.enum.js';

export class SalesOrderLineDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  productSkuId!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  unitId!: string;

  @ApiProperty()
  @IsNumber()
  @Min(0.0001)
  quantity!: number;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  unitPriceMmk!: number;
}

export class CreateSalesOrderDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  customerId!: string;

  @ApiProperty({ example: '2026-07-19' })
  @IsDateString()
  orderDate!: string;

  @ApiProperty({ enum: OrderSource })
  @IsEnum(OrderSource)
  orderSource!: OrderSource;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  takenByUserId?: string;

  @ApiProperty({ enum: DeliveryChannel })
  @IsEnum(DeliveryChannel)
  deliveryChannel!: DeliveryChannel;

  @ApiPropertyOptional({ enum: CustomerReceiveMode })
  @IsOptional()
  @IsEnum(CustomerReceiveMode)
  customerReceiveMode?: CustomerReceiveMode;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({ type: [SalesOrderLineDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => SalesOrderLineDto)
  lines!: SalesOrderLineDto[];
}
