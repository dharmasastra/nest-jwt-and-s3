import { Body, Controller, FileTypeValidator, Get, MaxFileSizeValidator, NotFoundException, Param, ParseFilePipe, Post, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { UsersService } from './users.service';
import { User } from './user.entity';
import { AuthGuard } from '@nestjs/passport/dist/auth.guard';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('users')
export class UsersController {
    constructor(private readonly userService: UsersService) { }

    @Post('register')
    async create(@Body() user: User): Promise<User> {
        return this.userService.create(user);
    }

    @Get(':username')
    async findOne(@Body() username: string): Promise<User> {
        const user = await this.userService.findOne(username);
        if (!user) {
            throw new NotFoundException('User not found');
        } else {
            return user;
        }
    }

    @Post(':username/upload')
    @UseInterceptors(FileInterceptor('file'))
    uploadFile(
      @UploadedFile(
        new ParseFilePipe({
          validators: [
            new FileTypeValidator({
              fileType: '.(png|jpeg|jpg)',
            }),
            new MaxFileSizeValidator({
              maxSize: 4 * 1024 * 1024,
            })
          ],
        }),
      ) file: Express.Multer.File,
      @Param() param,
      ) {
      return this.userService.uploadFile(file, param.username);
    }

}
