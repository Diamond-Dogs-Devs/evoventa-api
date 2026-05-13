import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';

import { InventoryService } from './inventory.service';

import { PaginationDto } from '../../common';
import { CreateInventoryDto, UpdateInventoryDto } from './dto';

@Controller('inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Post()
  createInventory(@Body() createInventoryDto: CreateInventoryDto) {
    return this.inventoryService.createInventory(createInventoryDto);
  }

  @Get()
  findAllInventories(@Query() paginationDto: PaginationDto) {
    return this.inventoryService.findAllInventories(paginationDto);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.inventoryService.findOne(id);
  }

  @Patch(':id')
  updateInventory(
    @Param('id') id: string,
    @Body() updateInventoryDto: UpdateInventoryDto,
  ) {
    return this.inventoryService.updateInventory(id, updateInventoryDto);
  }

  @Delete(':id')
  deleteInventory(@Param('id') id: string) {
    return this.inventoryService.deleteInventory(id);
  }
}
