import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { User } from './user.entity';
import { Repository } from 'typeorm';
import * as AWS from 'aws-sdk';


@Injectable()
export class UsersService {
    constructor(
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
    ) { }
    AWS_S3_BUCKET = process.env.AWS_BUCKET_NAME;
    s3 = new AWS.S3({
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    });

    async create(user: Partial<User>): Promise<User> {
        const newuser = this.userRepository.create(user);

        const salt = await bcrypt.genSalt();
        const hashedPassword = await bcrypt.hash(newuser.password, salt);

        newuser.password = hashedPassword;

        return this.userRepository.save(newuser);
    }

    async findOne(username: string): Promise<User> {
        return this.userRepository.findOne({ where: { username } });
    }

    async uploadFile(file: Express.Multer.File, username: string) {
        const user = await this.findOne(username);
        if (!user) {
            throw new NotFoundException('User not found');
        }

        const { originalname } = file;

        const fileStorageInDB = await this.s3_upload(
            file.buffer,
            this.AWS_S3_BUCKET,
            originalname,
            file.mimetype,
        );
        
        this.userRepository.update(user.id, {
            avatar: fileStorageInDB.Location
        })


        return fileStorageInDB.Location
    }

    async s3_upload(file: Buffer, bucket: string, name: string, mimetype: string) {

        const params = {
            Bucket: bucket,
            Key: String(name),
            Body: file,
            ACL: 'public-read',
            ContentType: mimetype,
            ContentDisposition: 'inline',
            CreateBucketConfiguration: {
                LocationConstraint: 'ap-southeast-1',
            },
        };

        try {
            let s3Response = await this.s3.upload(params).promise();
            return s3Response;
        } catch (e) {
            console.log(e);
        }
    }
}
