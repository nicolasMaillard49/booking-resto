import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { ContactMessagesService } from './contact-messages.service';
import { CaptchaService } from './captcha.service';
import { CreateMessageDto } from './dto/create-message.dto';

@ApiTags('contact-messages')
@Controller()
export class ContactMessagesController {
  constructor(private svc: ContactMessagesService, private captcha: CaptchaService) {}

  @Public()
  @Get('contact-messages/captcha')
  issueCaptcha() { return this.captcha.issue(); }

  @Public()
  @Throttle({ default: { limit: 3, ttl: 60_000 } })
  @Post('contact-messages')
  create(@Body() dto: CreateMessageDto) { return this.svc.create(dto); }

  @ApiBearerAuth() @UseGuards(JwtAuthGuard)
  @Get('admin/contact-messages')
  findAll(@Query('page') page = '1', @Query('pageSize') pageSize = '20') {
    return this.svc.findAll(parseInt(page, 10), parseInt(pageSize, 10));
  }

  @ApiBearerAuth() @UseGuards(JwtAuthGuard)
  @Patch('admin/contact-messages/:id')
  setRead(@Param('id') id: string, @Body() body: { isRead: boolean }) {
    return this.svc.setRead(id, body.isRead);
  }

  @ApiBearerAuth() @UseGuards(JwtAuthGuard)
  @Delete('admin/contact-messages/:id')
  remove(@Param('id') id: string) { return this.svc.remove(id); }
}
