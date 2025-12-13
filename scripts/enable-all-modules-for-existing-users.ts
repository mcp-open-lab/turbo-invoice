import { db } from "@/lib/db";
import { accountModules, modules, userSettings } from "@/lib/db/schema";
import { createId } from "@paralleldrive/cuid2";
import { eq, sql } from "drizzle-orm";

async function main() {
  // Treat "current users" as anyone with a user_settings row
  const users = await db.select({ userId: userSettings.userId }).from(userSettings);
  const activeModules = await db
    .select({ id: modules.id })
    .from(modules)
    .where(eq(modules.isActive, true));

  let upserts = 0;

  for (const u of users) {
    for (const m of activeModules) {
      await db
        .insert(accountModules)
        .values({
          id: createId(),
          userId: u.userId,
          moduleId: m.id,
          enabled: true,
          source: "admin_grant",
          effectiveUntil: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: [accountModules.userId, accountModules.moduleId],
          set: {
            enabled: true,
            source: "admin_grant",
            effectiveUntil: null,
            updatedAt: new Date(),
          },
        });
      upserts++;
    }
  }

  console.log(
    `Enabled all modules for ${users.length} user(s) across ${activeModules.length} module(s). (${upserts} upsert operations)`
  );
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });


