export class TokenResponseDto {
    accessToken: string;
    expiresIn: number; // seconds until expiry
}

export class UserResponseDto {
    id: string;
    tenantId: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
    roles: string[];
}

export class LoginResponseDto {
    user: UserResponseDto;
    accessToken: string;
    expiresIn: number;
}
