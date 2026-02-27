import { users, type User, type UpsertUser } from "@shared/models/auth";
import { db } from "../../db";
import { eq, sql } from "drizzle-orm";

export interface IAuthStorage {
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
}

class AuthStorage implements IAuthStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  private async getNextEmployeeId(): Promise<string> {
    const [result] = await db.select({ maxId: sql<number>`COALESCE(MAX(CAST(employee_id AS INTEGER)), 1000)` }).from(users);
    return String((result?.maxId || 1000) + 1);
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const existing = await this.getUser(userData.id!);

    if (existing) {
      const [user] = await db
        .update(users)
        .set({
          email: userData.email,
          firstName: userData.firstName,
          lastName: userData.lastName,
          profileImageUrl: userData.profileImageUrl,
          updatedAt: new Date(),
        })
        .where(eq(users.id, userData.id!))
        .returning();
      return user;
    }

    const employeeId = await this.getNextEmployeeId();
    const [user] = await db
      .insert(users)
      .values({
        ...userData,
        employeeId,
        displayName: [userData.firstName, userData.lastName].filter(Boolean).join(" ") || null,
      })
      .returning();
    return user;
  }
}

export const authStorage = new AuthStorage();
