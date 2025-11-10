import { MigrationInterface, QueryRunner } from 'typeorm';

export class TwoPlayerGameConversion1762781980808
  implements MigrationInterface
{
  name = 'TwoPlayerGameConversion1762781980808';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Step 1: Delete any games with more than 2 players (cleanup)
    await queryRunner.query(
      `DELETE FROM games WHERE id IN (
        SELECT g.id FROM games g
        LEFT JOIN game_players gp ON gp.game_id = g.id AND gp."leftAt" IS NULL
        GROUP BY g.id
        HAVING COUNT(gp.id) > 2
      )`,
    );

    // Step 2: For questions with null target_player_id, set it to the other player
    // This handles historical data before the NOT NULL constraint
    await queryRunner.query(
      `UPDATE questions q
       SET target_player_id = (
         SELECT gp.id 
         FROM game_players gp
         JOIN rounds r ON r.game_id = gp.game_id
         WHERE r.id = q.round_id 
         AND gp.id != q.asked_by_player_id
         AND gp."leftAt" IS NULL
         LIMIT 1
       )
       WHERE q.target_player_id IS NULL`,
    );

    // Step 3: Delete questions that still have null target_player_id (orphaned data)
    await queryRunner.query(
      `DELETE FROM questions WHERE target_player_id IS NULL`,
    );

    // Step 4: For guesses with null target_player_id, set it to the other player
    await queryRunner.query(
      `UPDATE guesses g
       SET target_player_id = (
         SELECT gp.id 
         FROM game_players gp
         JOIN rounds r ON r.game_id = gp.game_id
         WHERE r.id = g.round_id 
         AND gp.id != g.guessed_by_player_id
         AND gp."leftAt" IS NULL
         LIMIT 1
       )
       WHERE g.target_player_id IS NULL`,
    );

    // Step 5: Delete guesses that still have null target_player_id (orphaned data)
    await queryRunner.query(
      `DELETE FROM guesses WHERE target_player_id IS NULL`,
    );

    // Step 6: Drop the maxPlayers column from games table
    await queryRunner.query(`ALTER TABLE "games" DROP COLUMN "maxPlayers"`);

    // Step 7: Drop the seatOrder column from game_players table
    await queryRunner.query(
      `ALTER TABLE "game_players" DROP COLUMN "seatOrder"`,
    );

    // Step 8: Alter target_player_id to be NOT NULL in questions
    await queryRunner.query(
      `ALTER TABLE "questions" ALTER COLUMN "target_player_id" SET NOT NULL`,
    );

    // Step 9: Change questions foreign key constraint to CASCADE on delete
    await queryRunner.query(
      `ALTER TABLE "questions" DROP CONSTRAINT "FK_7191bf0ca015e46b92099a0e835"`,
    );
    await queryRunner.query(
      `ALTER TABLE "questions" ADD CONSTRAINT "FK_7191bf0ca015e46b92099a0e835" 
       FOREIGN KEY ("target_player_id") REFERENCES "game_players"("id") 
       ON DELETE CASCADE ON UPDATE NO ACTION`,
    );

    // Step 10: Alter target_player_id to be NOT NULL in guesses
    await queryRunner.query(
      `ALTER TABLE "guesses" ALTER COLUMN "target_player_id" SET NOT NULL`,
    );

    // Step 11: Change guesses foreign key constraint to CASCADE on delete
    await queryRunner.query(
      `ALTER TABLE "guesses" DROP CONSTRAINT "FK_003efff810140ddf142579f2228"`,
    );
    await queryRunner.query(
      `ALTER TABLE "guesses" ADD CONSTRAINT "FK_003efff810140ddf142579f2228" 
       FOREIGN KEY ("target_player_id") REFERENCES "game_players"("id") 
       ON DELETE CASCADE ON UPDATE NO ACTION`,
    );

    // Step 12: Remove 'spectator' value from game_player_role enum
    // First, check if any players have spectator role and convert them to player
    await queryRunner.query(
      `UPDATE game_players SET role = 'player' WHERE role = 'spectator'`,
    );

    // Create new enum without spectator
    await queryRunner.query(
      `CREATE TYPE "public"."game_player_role_new" AS ENUM('host', 'player')`,
    );

    // Update the column to use the new enum
    await queryRunner.query(
      `ALTER TABLE "game_players" ALTER COLUMN "role" TYPE "public"."game_player_role_new" USING role::text::"public"."game_player_role_new"`,
    );

    // Drop the old enum
    await queryRunner.query(`DROP TYPE "public"."game_player_role"`);

    // Rename the new enum to the original name
    await queryRunner.query(
      `ALTER TYPE "public"."game_player_role_new" RENAME TO "game_player_role"`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Recreate enum with spectator
    await queryRunner.query(
      `CREATE TYPE "public"."game_player_role_new" AS ENUM('host', 'player', 'spectator')`,
    );

    await queryRunner.query(
      `ALTER TABLE "game_players" ALTER COLUMN "role" TYPE "public"."game_player_role_new" USING role::text::"public"."game_player_role_new"`,
    );

    await queryRunner.query(`DROP TYPE "public"."game_player_role"`);

    await queryRunner.query(
      `ALTER TYPE "public"."game_player_role_new" RENAME TO "game_player_role"`,
    );

    // Restore guesses foreign key to SET NULL
    await queryRunner.query(
      `ALTER TABLE "guesses" DROP CONSTRAINT "FK_003efff810140ddf142579f2228"`,
    );
    await queryRunner.query(
      `ALTER TABLE "guesses" ADD CONSTRAINT "FK_003efff810140ddf142579f2228" 
       FOREIGN KEY ("target_player_id") REFERENCES "game_players"("id") 
       ON DELETE SET NULL ON UPDATE NO ACTION`,
    );

    // Make target_player_id nullable again in guesses
    await queryRunner.query(
      `ALTER TABLE "guesses" ALTER COLUMN "target_player_id" DROP NOT NULL`,
    );

    // Restore questions foreign key to SET NULL
    await queryRunner.query(
      `ALTER TABLE "questions" DROP CONSTRAINT "FK_7191bf0ca015e46b92099a0e835"`,
    );
    await queryRunner.query(
      `ALTER TABLE "questions" ADD CONSTRAINT "FK_7191bf0ca015e46b92099a0e835" 
       FOREIGN KEY ("target_player_id") REFERENCES "game_players"("id") 
       ON DELETE SET NULL ON UPDATE NO ACTION`,
    );

    // Make target_player_id nullable again in questions
    await queryRunner.query(
      `ALTER TABLE "questions" ALTER COLUMN "target_player_id" DROP NOT NULL`,
    );

    // Restore seatOrder column
    await queryRunner.query(
      `ALTER TABLE "game_players" ADD "seatOrder" integer`,
    );

    // Restore maxPlayers column
    await queryRunner.query(`ALTER TABLE "games" ADD "maxPlayers" integer`);
  }
}
