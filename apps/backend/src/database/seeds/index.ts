import { DataSource } from 'typeorm';
import { seedUsers } from './user.seed';
import { seedCharacterSets } from './character-set.seed';

export async function runSeeds(dataSource: DataSource): Promise<void> {
  console.log('Starting database seeding...');

  try {
    await seedUsers(dataSource);
    await seedCharacterSets(dataSource);

    console.log('Database seeding completed successfully!');
  } catch (error) {
    console.error('Error during database seeding:', error);
    throw error;
  }
}
