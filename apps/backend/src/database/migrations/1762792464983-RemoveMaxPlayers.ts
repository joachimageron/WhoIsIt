import { MigrationInterface, QueryRunner } from 'typeorm';

export class RemoveMaxPlayers1762792464983 implements MigrationInterface {
  name = 'RemoveMaxPlayers1762792464983';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "games" DROP COLUMN "maxPlayers"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "games" ADD "maxPlayers" integer`);
  }
}
