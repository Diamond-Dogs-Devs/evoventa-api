import { Transform } from 'class-transformer';
import { IsOptional, IsPositive } from 'class-validator';

export class PaginationDto {
  @IsOptional()
  @Transform(({ value }) => Number(value ?? 1))
  @IsPositive()
  page: number = 1;

  @IsOptional()
  @Transform(({ value }) => Number(value ?? 10))
  @IsPositive()
  limit: number = 10;
}
