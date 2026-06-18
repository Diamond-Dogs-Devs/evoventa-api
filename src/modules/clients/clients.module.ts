import { Module } from '@nestjs/common';
import { ClientsService } from './clients.service';
import { ClientsController } from './clients.controller';
import { AuthModule } from '../auth/auth.module';
import { CacheModule } from '../cache/cache.module';

@Module({
  imports: [AuthModule, CacheModule],
  controllers: [ClientsController],
  providers: [ClientsService],
})
export class ClientsModule {}
