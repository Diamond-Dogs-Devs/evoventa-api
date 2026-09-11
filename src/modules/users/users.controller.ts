import {
  Controller,
  Get,
  Body,
  Param,
  Query,
  Patch,
  Delete,
  UseGuards,
} from '@nestjs/common';

import { UsersService } from './users.service';

import { AuthGuard, PaginationDto } from '../../common';

import { UpdateUserDto } from './dto';

import { Role } from '@prisma/client';

import { RolesGuard, Roles } from '../../common';

@Controller('users')
@UseGuards(AuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('email/:email')
  findByEmail(@Param('email') email: string) {
    return this.usersService.findByEmail(email);
  }

  @Get()
  findAll(@Query() paginationDto: PaginationDto) {
    return this.usersService.findAll(paginationDto);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(id, updateUserDto);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }
}
