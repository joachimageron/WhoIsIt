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
    { name: 'Alex', slug: 'alex', imageUrl: '/character/character_0.jpg' },
    {
      name: 'Charlie',
      slug: 'charlie',
      imageUrl: '/character/character_1.jpg',
    },
    {
      name: 'Morgan',
      slug: 'morgan',
      imageUrl: '/character/character_2.jpg',
    },
    { name: 'Sacha', slug: 'sacha', imageUrl: '/character/character_3.jpg' },
    {
      name: 'Dominique',
      slug: 'dominique',
      imageUrl: '/character/character_4.jpg',
    },
    { name: 'Lou', slug: 'lou', imageUrl: '/character/character_5.jpg' },
    {
      name: 'Camille',
      slug: 'camille',
      imageUrl: '/character/character_6.jpg',
    },
    { name: 'Maxime', slug: 'maxime', imageUrl: '/character/character_7.jpg' },
    { name: 'Andréa', slug: 'andrea', imageUrl: '/character/character_8.jpg' },
    {
      name: 'Stéphane',
      slug: 'stephane',
      imageUrl: '/character/character_9.jpg',
    },
    { name: 'Claude', slug: 'claude', imageUrl: '/character/character_10.jpg' },
    { name: 'Leslie', slug: 'leslie', imageUrl: '/character/character_11.jpg' },
    {
      name: 'Eden',
      slug: 'eden',
      imageUrl: '/character/character_12.jpg',
    },
    { name: 'Jade', slug: 'jade', imageUrl: '/character/character_13.jpg' },
    { name: 'Noa', slug: 'noa', imageUrl: '/character/character_14.jpg' },
    { name: 'Sam', slug: 'sam', imageUrl: '/character/character_15.jpg' },
    { name: 'Robin', slug: 'robin', imageUrl: '/character/character_16.jpg' },
    { name: 'Yann', slug: 'yann', imageUrl: '/character/character_17.jpg' },
    { name: 'Ariel', slug: 'ariel', imageUrl: '/character/character_18.jpg' },
    { name: 'Kim', slug: 'kim', imageUrl: '/character/character_19.jpg' },
    {
      name: 'Mika',
      slug: 'mika',
      imageUrl: '/character/character_20.jpg',
    },
    { name: 'Riley', slug: 'riley', imageUrl: '/character/character_21.jpg' },
    { name: 'Elliot', slug: 'elliot', imageUrl: '/character/character_22.jpg' },
    { name: 'Alix', slug: 'alix', imageUrl: '/character/character_23.jpg' },
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
