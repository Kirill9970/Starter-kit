import {
  ApiExtraModels,
  ApiProperty,
  ApiResponseOptions,
} from '@nestjs/swagger';
import { IUser } from '@crypton-nestjs-kit/common';
import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Length,
  Matches,
  registerDecorator,
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import validator from 'validator';

import { TwoFaCodesDto } from '../../../dto/base.dto';
import { ErrorResponseDto } from '../../../dto/error-response-dto';
import { BaseDto } from '../../../dto/response.dto';
import { UserDto } from '../../user/dto/user.dto';

@ValidatorConstraint({ name: 'isPhoneOrEmail', async: false })
export class IsPhoneOrEmailConstraint implements ValidatorConstraintInterface {
  validate(login: any, args: ValidationArguments) {
    if (login === undefined) {
      return false;
    }

    return (
      validator.isEmail(login) ||
      validator.isMobilePhone(login, 'any', { strictMode: false })
    );
  }

  defaultMessage(args: ValidationArguments) {
    if (!!!args.value) {
      return 'The field is required';
    } else {
      return 'Login must be a phone number or email';
    }
  }
}

export function IsPhoneOrEmail(validationOptions?: any) {
  return function (object: any, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsPhoneOrEmailConstraint,
    });
  };
}

export class RegisterDtoRequest {
  @ApiProperty({
    description:
      'User login. Should be a string containing alphanumeric characters and underscores, between 4 and 20 characters.',
    example: '88005553535',
  })
  @IsNotEmpty({ message: 'Login cannot be empty' })
  @IsString({ message: 'Login must be a string' })
  @Length(4, 50, { message: 'Login must be between 4 and 50 characters long' })
  @IsPhoneOrEmail({ message: 'Phone number or email incorrect' })
  readonly login!: string;

  @ApiProperty({
    description:
      'User password. Should be a strong password with a mix of uppercase, lowercase, numbers, and special characters.',
    example: 'StrongP@ssw0rd!',
  })
  @IsNotEmpty({ message: 'Password cannot be empty' })
  @IsString({ message: 'Password must be a string' })
  @Length(8, 32, {
    message: 'Password must be between 8 and 32 characters long',
  })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).+$/, {
    message:
      'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
  })
  readonly password!: string;
}

export class CaptchaDto {
  @ApiProperty({
    description: 'Captcha token from reCAPTCHA',
    example: '03AFcWeA5...',
  })
  @IsNotEmpty({ message: 'Captcha token cannot be empty' })
  @IsString({ message: 'Captcha token must be a string' })
  readonly token!: string;
}

export class AuthDtoRequest extends RegisterDtoRequest {
  @ApiProperty({
    description: '2FA codes object. Is it setting up.',
    example: {
      emailCode: 0o00000,
      phoneCode: 0o00000,
      googleCode: 0o00000,
    },
  })
  @IsOptional()
  readonly twoFaCodes!: TwoFaCodesDto;

  @ApiProperty({
    description: 'reCAPTCHA verification token',
    type: CaptchaDto,
  })
  @IsNotEmpty({ message: 'Captcha verification is required' })
  readonly captcha!: CaptchaDto;
}

export class RefreshTokenDtoRequest {
  @ApiProperty({
    description: 'Refresh token data',
    example: 'token',
  })
  @IsString()
  readonly refreshToken!: string;
}

export class ConfirmationCodesRequest {
  @ApiProperty({
    description: 'User login',
    example: '88005553535',
  })
  @IsString()
  readonly login!: string;

  @ApiProperty({
    description: 'Id of permission',
    example: '4405130b-1120-402d-a6a9-cd6333520e58',
  })
  @IsString()
  readonly permissionId!: string;
}

export class SigninSolanaDtoRequest {
  @ApiProperty({
    description:
      'User login. Should be a string containing alphanumeric characters and underscores, between 4 and 20 characters.',
    example: '88005553535',
  })
  @IsNotEmpty({ message: 'Password cannot be empty' })
  readonly originalMessage!: string;

  @ApiProperty({
    description:
      'User password. Should be a strong password with a mix of uppercase, lowercase, numbers, and special characters.',
    example: 'StrongP@ssw0rd!',
  })
  @IsNotEmpty({ message: 'Password cannot be empty' })
  readonly publicKey!: string;

  @ApiProperty({
    description:
      'User password. Should be a strong password with a mix of uppercase, lowercase, numbers, and special characters.',
    example: 'StrongP@ssw0rd!',
  })
  @IsNotEmpty({ message: 'Password cannot be empty' })
  readonly signature!: string;
}

export class RegisterConfirmRequestDTO {
  @ApiProperty({
    description:
      'User login. Should be a string containing alphanumeric characters and underscores, between 4 and 20 characters.',
    example: 'user_name123',
  })
  @IsNotEmpty({ message: 'Login cannot be empty' })
  @IsString({ message: 'Login must be a string' })
  @Length(4, 50, { message: 'Login must be between 4 and 50 characters long' })
  @IsPhoneOrEmail({ message: 'Phone number or email incorrect' })
  readonly login!: string;

  @ApiProperty({
    description: 'Confirmation 2fa code',
    example: 0o00000,
  })
  @IsNotEmpty({ message: 'Code cannot be empty' })
  @IsNumber()
  readonly code!: number;
}

@ApiExtraModels(UserDto)
export class RegisterResponseDto extends BaseDto<{
  message: string;
  user: UserDto;
}> {
  @ApiProperty({
    type: () => UserDto,
  })
  readonly data: UserDto;

  constructor(message: string, user: IUser) {
    super({
      success: true,
      message,
      data: user,
    });
  }
}

export const ApiResponses = {
  created: {
    description: 'The user has been successfully registered.',
    type: RegisterResponseDto,
  } as ApiResponseOptions,
  badRequest: {
    status: 400,
    description: 'Invalid request parameters.',
    type: ErrorResponseDto,
    examples: {
      default: {
        value: {
          statusCode: 400,
          message: 'Validation failed: login must not be empty',
          error: 'Bad Request',
        },
      },
    },
  } as ApiResponseOptions,
  notFound: {
    status: 404,
    description: 'The user creation failed.',
    type: ErrorResponseDto,
    examples: {
      default: {
        value: {
          statusCode: 404,
          message: 'User already exists',
          error: 'Not Found',
        },
      },
    },
  } as ApiResponseOptions,
  internalServerError: {
    status: 500,
    description: 'Internal server error.',
    type: ErrorResponseDto,
    examples: {
      default: {
        value: {
          statusCode: 500,
          message: 'Unexpected error occurred',
          error: 'Internal Server Error',
        },
      },
    },
  } as ApiResponseOptions,
};
