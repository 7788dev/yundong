import {
  IsIn,
  IsOptional,
  IsString,
  Length,
  Matches,
  Max,
  Min,
} from 'class-validator';

export class RegisterDto {
  @IsString()
  @Length(3, 32)
  username!: string;

  @IsString()
  @Length(8, 64)
  @Matches(/^(?=.*[A-Za-z])(?=.*\d).+$/, {
    message: 'password must contain letters and numbers',
  })
  password!: string;

  @IsOptional()
  @IsIn(['user', 'admin'])
  role?: 'user' | 'admin';

  @IsOptional()
  @IsString()
  gender?: string;

  @IsOptional()
  @Min(1)
  @Max(120)
  age?: number;
}
