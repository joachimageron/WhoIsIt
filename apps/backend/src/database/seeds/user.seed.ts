import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../entities/user.entity';

export async function seedUsers(dataSource: DataSource): Promise<void> {
  const userRepository = dataSource.getRepository(User);

  // Check if users already exist
  const existingCount = await userRepository.count();
  if (existingCount > 0) {
    console.log('Users already exist, skipping seed');
    return;
  }

  const hashedPassword = await bcrypt.hash('password123', 10);

  const users = [
    {
      email: 'alice@example.com',
      username: 'alice',
      passwordHash: hashedPassword,
      avatarUrl: '/avatar/avatar_0.jpg',
      isGuest: false,
      locale: 'en',
    },
    {
      email: 'bob@example.com',
      username: 'bob',
      passwordHash: hashedPassword,
      avatarUrl: '/avatar/avatar_1.jpg',
      isGuest: false,
      locale: 'en',
    },
    {
      email: 'charlie@example.com',
      username: 'charlie',
      passwordHash: hashedPassword,
      avatarUrl: '/avatar/avatar_2.jpg',
      isGuest: false,
      locale: 'en',
    },
    {
      username: 'guest1',
      isGuest: true,
    },
    {
      username: 'guest2',
      isGuest: true,
    },
  ];

  for (const userData of users) {
    const user = userRepository.create(userData);
    await userRepository.save(user);
  }

  console.log(`Seeded ${users.length} test users`);
}
