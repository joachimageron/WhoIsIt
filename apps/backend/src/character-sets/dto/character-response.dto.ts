export class CharacterResponseDto {
  id!: string;
  name!: string;
  slug!: string;
  imageUrl?: string | null;
  summary?: string | null;
  metadata!: Record<string, unknown>;
  isActive!: boolean;
}
