import { Injectable } from '@nestjs/common';
import { HelperService } from './shared/services/helper/helper.service';

@Injectable()
export class AppService {
  constructor(private readonly helper: HelperService) {}

  getHello(): string {
    return 'Hello World!';
  }

  async calculateDuration(fileBuffer: Buffer, cbrEstimate?: boolean) {
    try {
      let duration = 0;
      let offset = 0;
      let info;
      let totalFrames = 0;
      const buffer = Buffer.alloc(100);
      const bytesRead = fileBuffer.copy(buffer, 0, 0, 100);

      if (bytesRead < 100) {
        return 0;
      }

      offset = this.helper.skipId3(buffer);

      while (offset < fileBuffer.length) {
        const bytesRead = fileBuffer.copy(buffer, 0, offset, offset + 10);

        if (bytesRead < 10) {
          return this.helper.round(duration);
        }

        if (buffer[0] === 0xff && (buffer[1] & 0xe0) === 0xe0) {
          info = this.helper.parseFrameHeader(buffer);
          if (info.frameSize && info.samples) {
            totalFrames += 1;
            offset += info.frameSize;
            duration += info.samples / info.sampleRate;
          } else {
            offset++;
          }
        } else {
          offset++;
        }

        if (cbrEstimate && info) {
          return this.helper.round(
            this.helper.estimateDuration(
              info.bitRate,
              offset,
              fileBuffer.length,
            ),
          );
        }
      }

      return { duration: this.helper.round(duration), totalFrames };
    } catch (error) {
      // Handle errors here
      console.error(error);
      return 0; // Or return a default value in case of an error
    }
  }
}
