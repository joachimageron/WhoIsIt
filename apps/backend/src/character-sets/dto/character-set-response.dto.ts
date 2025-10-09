export class CharacterSetResponseDto {
  id!: string;
  name!: string;
  slug!: string;
  description?: string | null;
  visibility!: string;
  isDefault!: boolean;
  metadata!: Record<string, unknown>;
  characterCount?: number;
}
