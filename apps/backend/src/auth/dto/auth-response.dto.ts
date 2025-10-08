export class AuthResponseDto {
  accessToken!: string;
  user!: {
    id: string;
    email: string | null;
    username: string | null;
    displayName: string;
    avatarUrl: string | null;
  };
}
