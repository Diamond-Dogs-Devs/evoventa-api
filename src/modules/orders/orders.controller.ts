import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';

import { OrdersService } from './orders.service';

import { PaginationDto, GetUser, CurrentUser, AuthGuard } from '../../common';
import { CreateOrderDto, OrderPaginationDto, StatusDto, TypeDto } from './dto';

@Controller('orders')
@UseGuards(AuthGuard)
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  createOrder(
    @Body() createOrderDto: CreateOrderDto,
    @GetUser() user: CurrentUser,
  ) {
    return this.ordersService.create(createOrderDto, user.id);
  }

  @Get()
  findAll(
    @Query()
    orderPaginationDto: OrderPaginationDto,
  ) {
    return this.ordersService.findAll(orderPaginationDto);
  }

  @Get('id/:id')
  findOne(@Param('id') id: string) {
    return this.ordersService.findOne(id);
  }

  @Get('status/:status')
  findAllByStatus(
    @Param() statusDto: StatusDto,
    @Query() paginationDto: PaginationDto,
  ) {
    return this.ordersService.findAll({
      ...paginationDto,
      status: statusDto.status,
    });
  }

  @Get('type/:type')
  findAllByType(
    @Param() typeDto: TypeDto,
    @Query() paginationDto: PaginationDto,
  ) {
    return this.ordersService.findAll({
      ...paginationDto,
      type: typeDto.type,
    });
  }

  @Patch('status/:id')
  changeStatus(@Param('id') id: string, @Body() statusDto: StatusDto) {
    return this.ordersService.changeOrderStatus({
      id,
      status: statusDto.status,
    });
  }

  @Patch('type/:id')
  changeOrderType(@Param('id') id: string, @Body() typeDto: TypeDto) {
    return this.ordersService.changeOrderType({
      id,
      type: typeDto.type,
    });
  }

  @Delete(':id')
  deleteOrder(@Param('id') id: string, @Body('isAdmin') isAdmin: boolean) {
    return this.ordersService.deleteOrder(id, isAdmin);
  }
}
