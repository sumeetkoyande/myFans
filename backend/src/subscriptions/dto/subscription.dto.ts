import { IsNotEmpty, IsNumber, IsPositive } from 'class-validator';

export class SubscribeDto {
  @IsNumber()
  @IsNotEmpty()
  @IsPositive()
  creatorId: number;
}

export class CreatePaymentDto {
  @IsNumber()
  @IsNotEmpty()
  @IsPositive()
  creatorId: number;

  @IsNumber()
  @IsNotEmpty()
  @IsPositive()
  amount: number;
}
