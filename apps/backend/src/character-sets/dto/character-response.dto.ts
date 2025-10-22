export class TraitValueResponseDto {
  id!: string;
  traitId!: string;
  traitName!: string;
  traitSlug!: string;
  valueText!: string;
}

export class CharacterResponseDto {
  id!: string;
  name!: string;
  slug!: string;
  imageUrl?: string | null;
  summary?: string | null;
  metadata!: Record<string, unknown>;
  isActive!: boolean;
  traits?: TraitValueResponseDto[];
}
