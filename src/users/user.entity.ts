import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";
import * as bcrypt from 'bcrypt';


@Entity()
export class User {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    username: string;

    @Column()
    password: string;

    @Column({nullable: true})
    avatar!: string;

    async valodatePassword(password: string): Promise<boolean> {
        return bcrypt.compare(password, this.password);
    }
}