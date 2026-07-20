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
import { OutboundStatus } from '../../../domain/enums/outbound-status.enum.js';

export class OutboundLineDto {
  @ApiProperty() @IsString() @IsNotEmpty() productSkuId!: string;
  @ApiProperty() @IsString() @IsNotEmpty() unitId!: string;
  @ApiProperty() @IsNumber() @Min(0.0001) quantity!: number;
}

export class CreateOutboundDto {
  @ApiProperty() @IsString() @IsNotEmpty() factoryId!: string;
  @ApiProperty() @IsString() @IsNotEmpty() salesOrderId!: string;
  @ApiProperty({ example: '2026-07-19' }) @IsDateString() scheduledDate!: string;
  @ApiProperty({ enum: DeliveryChannel }) @IsEnum(DeliveryChannel)
  deliveryChannel!: DeliveryChannel;
  @ApiPropertyOptional() @IsOptional() @IsString() driverUserId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() vehicleAssetId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() yangonGateId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() destinationGateId?: string;
  @ApiPropertyOptional({ enum: CustomerReceiveMode })
  @IsOptional()
  @IsEnum(CustomerReceiveMode)
  customerReceiveMode?: CustomerReceiveMode;
  @ApiProperty({ type: [OutboundLineDto] })
  @IsArray() @ArrayMinSize(1) @ValidateNested({ each: true }) @Type(() => OutboundLineDto)
  lines!: OutboundLineDto[];
}

export class TransitionOutboundStatusDto {
  @ApiProperty({ enum: OutboundStatus }) @IsEnum(OutboundStatus) toStatus!: OutboundStatus;
  @ApiPropertyOptional() @IsOptional() @IsString() notes?: string;
}
