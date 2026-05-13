import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { UsersModule } from './modules/users/users.module';
import { ProductsModule } from './modules/products/products.module';
import { OrdersModule } from './modules/orders/orders.module';
import { AuthModule } from './modules/auth/auth.module';
import { ClientsModule } from './modules/clients/clients.module';
import { InventoryModule } from './modules/inventory/inventory.module';

@Module({
  imports: [
    UsersModule,
    ProductsModule,
    OrdersModule,
    AuthModule,
    ClientsModule,
    InventoryModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
