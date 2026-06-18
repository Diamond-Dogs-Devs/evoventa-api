import { Module } from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { InventoryController } from './inventory.controller';
import { ProductsModule } from '../products/products.module';
import { AuthModule } from '../auth/auth.module';
import { CacheModule } from '../cache/cache.module';

@Module({
  imports: [AuthModule, ProductsModule, CacheModule],
  controllers: [InventoryController],
  providers: [InventoryService],
})
export class InventoryModule {}
