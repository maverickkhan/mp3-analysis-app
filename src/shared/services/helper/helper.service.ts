import { Injectable } from '@nestjs/common';
import {
  bitRates,
  layers,
  sampleRates,
  samples,
  versions,
} from 'src/common/constants';

@Injectable()
export class HelperService {
  constructor() {}

  skipId3(buffer: Buffer): number {
    let id3v2Flags: number;
    let z0: number,
      z1: number,
      z2: number,
      z3: number,
      tagSize: number,
      footerSize: number;

    if (buffer[0] === 0x49 && buffer[1] === 0x44 && buffer[2] === 0x33) {
      // 'ID3'
      id3v2Flags = buffer[5];
      footerSize = id3v2Flags & 0x10 ? 10 : 0;

      z0 = buffer[6];
      z1 = buffer[7];
      z2 = buffer[8];
      z3 = buffer[9];

      if (
        (z0 & 0x80) === 0 &&
        (z1 & 0x80) === 0 &&
        (z2 & 0x80) === 0 &&
        (z3 & 0x80) === 0
      ) {
        tagSize =
          (z0 & 0x7f) * 2097152 +
          (z1 & 0x7f) * 16384 +
          (z2 & 0x7f) * 128 +
          (z3 & 0x7f);
        return 10 + tagSize + footerSize;
      }
    }

    return 0;
  }

  frameSize(samples, layer, bitRate, sampleRate, paddingBit): number {
    if (layer === 1) {
      return ((samples * bitRate * 125) / sampleRate + paddingBit * 4) | 0;
    } else {
      return ((samples * bitRate * 125) / sampleRate + paddingBit) | 0;
    }
  }

  parseFrameHeader(header): Record<string, any> {
    const b1 = header[1];
    const b2 = header[2];

    const versionBits = (b1 & 0x18) >> 3;
    const version = versions[versionBits];
    const simpleVersion = version === '2.5' ? 2 : version;

    const layerBits = (b1 & 0x06) >> 1;
    const layer = layers[layerBits];

    const bitRateKey = 'V' + simpleVersion + 'L' + layer;
    const bitRateIndex = (b2 & 0xf0) >> 4;
    const bitRate = bitRates[bitRateKey][bitRateIndex] || 0;

    const sampleRateIdx = (b2 & 0x0c) >> 2;
    const sampleRate = sampleRates[version][sampleRateIdx] || 0;

    const sample = samples[simpleVersion][layer];

    const paddingBit = (b2 & 0x02) >> 1;

    return {
      bitRate: bitRate,
      sampleRate: sampleRate,
      frameSize: this.frameSize(sample, layer, bitRate, sampleRate, paddingBit),
      samples: sample,
    };
  }

  round(duration: number): number {
    return Math.round(duration * 1000) / 1000; // round to nearest ms
  }

  estimateDuration(bitRate: number, offset: number, fileSize: number): number {
    const kbps = (bitRate * 1000) / 8;
    const dataSize = fileSize - offset;

    return this.round(dataSize / kbps);
  }
}
