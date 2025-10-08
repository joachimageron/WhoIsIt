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
      displayName: 'Alice Wonder',
      passwordHash: hashedPassword,
      avatarUrl: 'https://i.pravatar.cc/150?img=1',
      isGuest: false,
      locale: 'en',
    },
    {
      email: 'bob@example.com',
      username: 'bob',
      displayName: 'Bob Builder',
      passwordHash: hashedPassword,
      avatarUrl: 'https://i.pravatar.cc/150?img=2',
      isGuest: false,
      locale: 'en',
    },
    {
      email: 'charlie@example.com',
      username: 'charlie',
      displayName: 'Charlie Brown',
      passwordHash: hashedPassword,
      avatarUrl: 'https://i.pravatar.cc/150?img=3',
      isGuest: false,
      locale: 'en',
    },
    {
      displayName: 'Guest Player 1',
      isGuest: true,
    },
    {
      displayName: 'Guest Player 2',
      isGuest: true,
    },
  ];

  for (const userData of users) {
    const user = userRepository.create(userData);
    await userRepository.save(user);
  }

  console.log(`Seeded ${users.length} test users`);
}
