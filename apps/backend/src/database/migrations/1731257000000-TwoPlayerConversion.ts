import { MigrationInterface, QueryRunner } from 'typeorm';

export class TwoPlayerConversion1731257000000 implements MigrationInterface {
  name = 'TwoPlayerConversion1731257000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Step 1: Remove 'spectator' from game_player_role enum
    // First, update any existing spectator roles to player
    await queryRunner.query(
      `UPDATE game_players SET role = 'player' WHERE role = 'spectator'`,
    );

    // Drop the old enum and create a new one without spectator
    await queryRunner.query(
      `ALTER TABLE game_players ALTER COLUMN role TYPE text`,
    );
    await queryRunner.query(`DROP TYPE "public"."game_player_role"`);
    await queryRunner.query(
      `CREATE TYPE "public"."game_player_role" AS ENUM('host', 'player')`,
    );
    await queryRunner.query(
      `ALTER TABLE game_players ALTER COLUMN role TYPE "public"."game_player_role" USING role::"public"."game_player_role"`,
    );

    // Step 2: Set default values for nullable target_player_id columns before making them NOT NULL
    // For questions: set target_player_id to the other player in the game
    await queryRunner.query(`
      UPDATE questions q
      SET target_player_id = (
        SELECT gp.id
        FROM game_players gp
        INNER JOIN rounds r ON r.game_id = gp.game_id
        WHERE r.id = q.round_id
          AND gp.id != q.asked_by_player_id
          AND gp.left_at IS NULL
        LIMIT 1
      )
      WHERE target_player_id IS NULL
    `);

    // For guesses: set target_player_id to the other player in the game
    await queryRunner.query(`
      UPDATE guesses g
      SET target_player_id = (
        SELECT gp.id
        FROM game_players gp
        INNER JOIN rounds r ON r.game_id = gp.game_id
        WHERE r.id = g.round_id
          AND gp.id != g.guessed_by_player_id
          AND gp.left_at IS NULL
        LIMIT 1
      )
      WHERE target_player_id IS NULL
    `);

    // Step 3: Make target_player_id columns NOT NULL
    await queryRunner.query(
      `ALTER TABLE questions ALTER COLUMN target_player_id SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE guesses ALTER COLUMN target_player_id SET NOT NULL`,
    );

    // Step 4: Drop maxPlayers column from games table
    await queryRunner.query(`ALTER TABLE games DROP COLUMN "maxPlayers"`);

    // Step 5: Drop seatOrder column from game_players table
    await queryRunner.query(`ALTER TABLE game_players DROP COLUMN "seatOrder"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Step 1: Add back seatOrder column
    await queryRunner.query(
      `ALTER TABLE game_players ADD COLUMN "seatOrder" integer`,
    );

    // Step 2: Add back maxPlayers column
    await queryRunner.query(
      `ALTER TABLE games ADD COLUMN "maxPlayers" integer`,
    );

    // Step 3: Make target_player_id columns nullable again
    await queryRunner.query(
      `ALTER TABLE guesses ALTER COLUMN target_player_id DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE questions ALTER COLUMN target_player_id DROP NOT NULL`,
    );

    // Step 4: Restore spectator role to enum
    await queryRunner.query(
      `ALTER TABLE game_players ALTER COLUMN role TYPE text`,
    );
    await queryRunner.query(`DROP TYPE "public"."game_player_role"`);
    await queryRunner.query(
      `CREATE TYPE "public"."game_player_role" AS ENUM('host', 'player', 'spectator')`,
    );
    await queryRunner.query(
      `ALTER TABLE game_players ALTER COLUMN role TYPE "public"."game_player_role" USING role::"public"."game_player_role"`,
    );
  }
}
