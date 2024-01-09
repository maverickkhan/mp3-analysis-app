import { ApiProperty } from "@nestjs/swagger";

export class FileUpload {
    @ApiProperty({ type: "string", format: "binary", required: true })
    file: Express.Multer.File;
}