import { MigrationInterface, QueryRunner } from 'typeorm';

export class RemoveMaxPlayersColumn1762774236145
  implements MigrationInterface
{
  name = 'RemoveMaxPlayersColumn1762774236145';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "games" DROP COLUMN "maxPlayers"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "games" ADD "maxPlayers" integer`,
    );
  }
}
