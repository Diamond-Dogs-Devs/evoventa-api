import { Module } from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { InventoryController } from './inventory.controller';
import { ProductsModule } from '../products/products.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule, ProductsModule],
  controllers: [InventoryController],
  providers: [InventoryService],
})
export class InventoryModule {}
