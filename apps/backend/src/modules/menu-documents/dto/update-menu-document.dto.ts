import { PartialType } from '@nestjs/swagger';
import { CreateMenuDocumentDto } from './create-menu-document.dto';
export class UpdateMenuDocumentDto extends PartialType(CreateMenuDocumentDto) {}
