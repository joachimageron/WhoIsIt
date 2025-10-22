export class AuthResponseDto {
  accessToken!: string;
  user!: {
    id: string;
    email: string | null;
    username: string;
    avatarUrl: string | null;
  };
}
