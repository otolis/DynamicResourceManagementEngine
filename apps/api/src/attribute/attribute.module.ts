import { Module } from '@nestjs/common';
import { AttributeService } from './attribute.service';
import { AttributeController } from './attribute.controller';
import { AttributeRepository } from './attribute.repository';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
    imports: [PrismaModule],
    controllers: [AttributeController],
    providers: [AttributeService, AttributeRepository],
    exports: [AttributeService, AttributeRepository],
})
export class AttributeModule {}
