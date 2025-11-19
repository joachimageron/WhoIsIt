import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddGuessCountToGamePlayer1762628000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'game_players',
      new TableColumn({
        name: 'guess_count',
        type: 'int',
        default: 0,
        isNullable: false,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('game_players', 'guess_count');
  }
}
