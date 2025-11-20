"use server";

import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { userSettings } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export type UsageType = "personal" | "business" | "mixed";
export type Country = "US" | "CA";

export type UserSettingsInput = {
  usageType: UsageType;
  country: Country;
  province?: string;
  currency?: string;
  visibleFields?: Record<string, boolean>;
};

export async function saveUserSettings(data: UserSettingsInput) {
  const { userId } = await auth();
  if (!userId) {
    throw new Error("Unauthorized");
  }

  const settingsData = {
    userId,
    usageType: data.usageType,
    country: data.country,
    province: data.province || null,
    currency: data.currency || (data.country === "CA" ? "CAD" : "USD"),
    visibleFields: data.visibleFields
      ? JSON.stringify(data.visibleFields)
      : null,
    updatedAt: new Date(),
  };

  await db.insert(userSettings).values(settingsData).onConflictDoUpdate({
    target: userSettings.userId,
    set: settingsData,
  });

  revalidatePath("/app");
  return { success: true };
}

export async function getUserSettings() {
  const { userId } = await auth();
  if (!userId) {
    return null;
  }

  const settings = await db
    .select()
    .from(userSettings)
    .where(eq(userSettings.userId, userId))
    .limit(1);

  if (settings.length === 0) {
    return null;
  }

  const setting = settings[0];
  return {
    ...setting,
    visibleFields: setting.visibleFields
      ? JSON.parse(setting.visibleFields)
      : {},
  };
}
