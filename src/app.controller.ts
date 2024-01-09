import {
  Body,
  Controller,
  Get,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { AppService } from './app.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { FileUpload } from './common/dtos/file-upload.dto';
import { ApiConsumes } from '@nestjs/swagger';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }
  

  @Post('/file-upload')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes("multipart/form-data")
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Body() FileUpload: FileUpload, //used for swagger 
    ) {
      const durations = await this.appService.calculateDuration(file.buffer);
      return durations;
  }
}
