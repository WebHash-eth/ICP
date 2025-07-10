import { Controller, Get, Param } from '@nestjs/common';
import { IcService } from './ic.service';

@Controller('ic')
export class IcController {
  constructor(private readonly icService: IcService) {}

  @Get('canister/:id/status')
  async getCanisterStatus(@Param('id') id: string) {
    return this.icService.getRawCanisterStatus(id);
  }
}
