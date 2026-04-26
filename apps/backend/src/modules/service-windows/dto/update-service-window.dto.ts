import { PartialType } from '@nestjs/swagger';
import { CreateServiceWindowDto } from './create-service-window.dto';
export class UpdateServiceWindowDto extends PartialType(CreateServiceWindowDto) {}
