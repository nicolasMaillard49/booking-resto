import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';

// NOTE: stub for M1.4 — will be reimplemented in M6.1
@ApiTags('public')
@Public()
@Controller('public')
export class PublicController {
  @Get('ping')
  ping() {
    return { ok: true, message: 'Public endpoints to be wired in M6' };
  }
}
