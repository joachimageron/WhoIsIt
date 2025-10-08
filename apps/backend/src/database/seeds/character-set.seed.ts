import { DataSource } from 'typeorm';
import {
  CharacterSet,
  Character,
  Trait,
  TraitValue,
  CharacterTraitValue,
} from '../entities';
import { GameVisibility, TraitDataType } from '../enums';

export async function seedCharacterSets(dataSource: DataSource): Promise<void> {
  const characterSetRepository = dataSource.getRepository(CharacterSet);
  const characterRepository = dataSource.getRepository(Character);
  const traitRepository = dataSource.getRepository(Trait);
  const traitValueRepository = dataSource.getRepository(TraitValue);
  const characterTraitValueRepository =
    dataSource.getRepository(CharacterTraitValue);

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

  // Create traits
  const genderTrait = traitRepository.create({
    set: classicSet,
    name: 'Gender',
    slug: 'gender',
    dataType: TraitDataType.ENUM,
  });
  await traitRepository.save(genderTrait);

  const hairColorTrait = traitRepository.create({
    set: classicSet,
    name: 'Hair Color',
    slug: 'hair-color',
    dataType: TraitDataType.ENUM,
  });
  await traitRepository.save(hairColorTrait);

  const hasGlassesTrait = traitRepository.create({
    set: classicSet,
    name: 'Wears Glasses',
    slug: 'has-glasses',
    dataType: TraitDataType.BOOLEAN,
  });
  await traitRepository.save(hasGlassesTrait);

  const hasHatTrait = traitRepository.create({
    set: classicSet,
    name: 'Wears Hat',
    slug: 'has-hat',
    dataType: TraitDataType.BOOLEAN,
  });
  await traitRepository.save(hasHatTrait);

  // Create trait values for gender
  const maleValue = traitValueRepository.create({
    trait: genderTrait,
    valueText: 'Male',
    sortOrder: 0,
  });
  await traitValueRepository.save(maleValue);

  const femaleValue = traitValueRepository.create({
    trait: genderTrait,
    valueText: 'Female',
    sortOrder: 1,
  });
  await traitValueRepository.save(femaleValue);

  // Create trait values for hair color
  const brownHair = traitValueRepository.create({
    trait: hairColorTrait,
    valueText: 'Brown',
    sortOrder: 0,
  });
  await traitValueRepository.save(brownHair);

  const blondHair = traitValueRepository.create({
    trait: hairColorTrait,
    valueText: 'Blond',
    sortOrder: 1,
  });
  await traitValueRepository.save(blondHair);

  const blackHair = traitValueRepository.create({
    trait: hairColorTrait,
    valueText: 'Black',
    sortOrder: 2,
  });
  await traitValueRepository.save(blackHair);

  const redHair = traitValueRepository.create({
    trait: hairColorTrait,
    valueText: 'Red',
    sortOrder: 3,
  });
  await traitValueRepository.save(redHair);

  const whiteHair = traitValueRepository.create({
    trait: hairColorTrait,
    valueText: 'White',
    sortOrder: 4,
  });
  await traitValueRepository.save(whiteHair);

  // Create trait values for boolean traits (yes/no)
  const yesGlasses = traitValueRepository.create({
    trait: hasGlassesTrait,
    valueText: 'Yes',
    sortOrder: 0,
  });
  await traitValueRepository.save(yesGlasses);

  const noGlasses = traitValueRepository.create({
    trait: hasGlassesTrait,
    valueText: 'No',
    sortOrder: 1,
  });
  await traitValueRepository.save(noGlasses);

  const yesHat = traitValueRepository.create({
    trait: hasHatTrait,
    valueText: 'Yes',
    sortOrder: 0,
  });
  await traitValueRepository.save(yesHat);

  const noHat = traitValueRepository.create({
    trait: hasHatTrait,
    valueText: 'No',
    sortOrder: 1,
  });
  await traitValueRepository.save(noHat);

  // Create characters
  const charactersData = [
    {
      name: 'Alice',
      slug: 'alice',
      traits: {
        gender: femaleValue,
        hairColor: blondHair,
        glasses: noGlasses,
        hat: noHat,
      },
    },
    {
      name: 'Bob',
      slug: 'bob',
      traits: {
        gender: maleValue,
        hairColor: brownHair,
        glasses: yesGlasses,
        hat: noHat,
      },
    },
    {
      name: 'Charlie',
      slug: 'charlie',
      traits: {
        gender: maleValue,
        hairColor: blackHair,
        glasses: noGlasses,
        hat: yesHat,
      },
    },
    {
      name: 'Diana',
      slug: 'diana',
      traits: {
        gender: femaleValue,
        hairColor: redHair,
        glasses: yesGlasses,
        hat: noHat,
      },
    },
    {
      name: 'Edward',
      slug: 'edward',
      traits: {
        gender: maleValue,
        hairColor: whiteHair,
        glasses: yesGlasses,
        hat: yesHat,
      },
    },
    {
      name: 'Fiona',
      slug: 'fiona',
      traits: {
        gender: femaleValue,
        hairColor: brownHair,
        glasses: noGlasses,
        hat: yesHat,
      },
    },
    {
      name: 'George',
      slug: 'george',
      traits: {
        gender: maleValue,
        hairColor: blondHair,
        glasses: noGlasses,
        hat: noHat,
      },
    },
    {
      name: 'Hannah',
      slug: 'hannah',
      traits: {
        gender: femaleValue,
        hairColor: blackHair,
        glasses: yesGlasses,
        hat: yesHat,
      },
    },
  ];

  for (const charData of charactersData) {
    const character = characterRepository.create({
      set: classicSet,
      name: charData.name,
      slug: charData.slug,
      imageUrl: null,
      summary: `${charData.name} is a character in the classic set`,
      isActive: true,
      metadata: {},
    });
    await characterRepository.save(character);

    // Link traits to character
    for (const traitValue of Object.values(charData.traits)) {
      const link = characterTraitValueRepository.create({
        character: character,
        traitValue: traitValue,
      });
      await characterTraitValueRepository.save(link);
    }
  }

  console.log(
    `Seeded character set "${classicSet.name}" with ${charactersData.length} characters`,
  );

  // Create "Fantasy Heroes" character set
  const fantasySet = characterSetRepository.create({
    name: 'Fantasy Heroes',
    slug: 'fantasy-heroes',
    description: 'A fantasy-themed set with warriors, mages, and rogues',
    visibility: GameVisibility.PUBLIC,
    isDefault: false,
    metadata: { theme: 'fantasy' },
  });
  await characterSetRepository.save(fantasySet);

  // Create traits for fantasy set
  const classTrait = traitRepository.create({
    set: fantasySet,
    name: 'Class',
    slug: 'class',
    dataType: TraitDataType.ENUM,
  });
  await traitRepository.save(classTrait);

  const weaponTrait = traitRepository.create({
    set: fantasySet,
    name: 'Weapon',
    slug: 'weapon',
    dataType: TraitDataType.ENUM,
  });
  await traitRepository.save(weaponTrait);

  // Create trait values for class
  const warriorClass = traitValueRepository.create({
    trait: classTrait,
    valueText: 'Warrior',
    sortOrder: 0,
  });
  await traitValueRepository.save(warriorClass);

  const mageClass = traitValueRepository.create({
    trait: classTrait,
    valueText: 'Mage',
    sortOrder: 1,
  });
  await traitValueRepository.save(mageClass);

  const rogueClass = traitValueRepository.create({
    trait: classTrait,
    valueText: 'Rogue',
    sortOrder: 2,
  });
  await traitValueRepository.save(rogueClass);

  // Create trait values for weapon
  const swordWeapon = traitValueRepository.create({
    trait: weaponTrait,
    valueText: 'Sword',
    sortOrder: 0,
  });
  await traitValueRepository.save(swordWeapon);

  const staffWeapon = traitValueRepository.create({
    trait: weaponTrait,
    valueText: 'Staff',
    sortOrder: 1,
  });
  await traitValueRepository.save(staffWeapon);

  const daggerWeapon = traitValueRepository.create({
    trait: weaponTrait,
    valueText: 'Dagger',
    sortOrder: 2,
  });
  await traitValueRepository.save(daggerWeapon);

  const bowWeapon = traitValueRepository.create({
    trait: weaponTrait,
    valueText: 'Bow',
    sortOrder: 3,
  });
  await traitValueRepository.save(bowWeapon);

  // Create fantasy characters
  const fantasyCharactersData = [
    {
      name: 'Aragorn',
      slug: 'aragorn',
      traits: { class: warriorClass, weapon: swordWeapon },
    },
    {
      name: 'Gandalf',
      slug: 'gandalf',
      traits: { class: mageClass, weapon: staffWeapon },
    },
    {
      name: 'Legolas',
      slug: 'legolas',
      traits: { class: rogueClass, weapon: bowWeapon },
    },
    {
      name: 'Frodo',
      slug: 'frodo',
      traits: { class: rogueClass, weapon: daggerWeapon },
    },
    {
      name: 'Boromir',
      slug: 'boromir',
      traits: { class: warriorClass, weapon: swordWeapon },
    },
  ];

  for (const charData of fantasyCharactersData) {
    const character = characterRepository.create({
      set: fantasySet,
      name: charData.name,
      slug: charData.slug,
      imageUrl: null,
      summary: `${charData.name} is a hero in the fantasy set`,
      isActive: true,
      metadata: {},
    });
    await characterRepository.save(character);

    // Link traits to character
    for (const traitValue of Object.values(charData.traits)) {
      const link = characterTraitValueRepository.create({
        character: character,
        traitValue: traitValue,
      });
      await characterTraitValueRepository.save(link);
    }
  }

  console.log(
    `Seeded character set "${fantasySet.name}" with ${fantasyCharactersData.length} characters`,
  );
}
