import { DataSource } from 'typeorm';
import { CharacterSet, Character } from '../entities';
import { GameVisibility } from '../enums';

export async function seedCharacterSets(dataSource: DataSource): Promise<void> {
  const characterSetRepository = dataSource.getRepository(CharacterSet);
  const characterRepository = dataSource.getRepository(Character);

  // Check if character sets already exist
  const existingCount = await characterSetRepository.count();
  if (existingCount > 0) {
    console.log('Character sets already exist, skipping seed');
    return;
  }

  // Create "Classic Characters" character set
  const classicSet = characterSetRepository.create({
    name: 'Classic Characters',
    slug: 'classic-characters',
    description: 'A classic set of diverse characters for guessing games',
    visibility: GameVisibility.PUBLIC,
    isDefault: true,
    metadata: { theme: 'classic' },
  });
  await characterSetRepository.save(classicSet);

  // Create characters
  const charactersData = [
    { name: 'Alice', slug: 'alice', imageUrl: '/character/character_0.jpg' },
    { name: 'Bob', slug: 'bob', imageUrl: '/character/character_1.jpg' },
    { name: 'Charlie', slug: 'charlie', imageUrl: '/character/character_2.jpg' },
    { name: 'Diana', slug: 'diana', imageUrl: '/character/character_3.jpg' },
    { name: 'Edward', slug: 'edward', imageUrl: '/character/character_4.jpg' },
    { name: 'Fiona', slug: 'fiona', imageUrl: '/character/character_5.jpg' },
    { name: 'George', slug: 'george', imageUrl: '/character/character_6.jpg' },
    { name: 'Hannah', slug: 'hannah', imageUrl: '/character/character_7.jpg' },
    { name: 'Isaac', slug: 'isaac', imageUrl: '/character/character_8.jpg' },
    { name: 'Julia', slug: 'julia', imageUrl: '/character/character_9.jpg' },
    { name: 'Kevin', slug: 'kevin', imageUrl: '/character/character_10.jpg' },
    { name: 'Laura', slug: 'laura', imageUrl: '/character/character_11.jpg' },
    { name: 'Michael', slug: 'michael', imageUrl: '/character/character_12.jpg' },
    { name: 'Nina', slug: 'nina', imageUrl: '/character/character_13.jpg' },
    { name: 'Oscar', slug: 'oscar', imageUrl: '/character/character_14.jpg' },
    { name: 'Paula', slug: 'paula', imageUrl: '/character/character_15.jpg' },
    { name: 'Quinn', slug: 'quinn', imageUrl: '/character/character_16.jpg' },
    { name: 'Rachel', slug: 'rachel', imageUrl: '/character/character_17.jpg' },
    { name: 'Samuel', slug: 'samuel', imageUrl: '/character/character_18.jpg' },
    { name: 'Tina', slug: 'tina', imageUrl: '/character/character_19.jpg' },
    { name: 'Ulysses', slug: 'ulysses', imageUrl: '/character/character_20.jpg' },
    { name: 'Vera', slug: 'vera', imageUrl: '/character/character_21.jpg' },
    { name: 'Walter', slug: 'walter', imageUrl: '/character/character_22.jpg' },
    { name: 'Xena', slug: 'xena', imageUrl: '/character/character_23.jpg' },
  ];

  for (const charData of charactersData) {
    const character = characterRepository.create({
      set: classicSet,
      name: charData.name,
      slug: charData.slug,
      imageUrl: charData.imageUrl,
      isActive: true,
    });
    await characterRepository.save(character);
  }

  console.log('Character sets seeded successfully');
}
