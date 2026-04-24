import crypto from "crypto";
import passport from "passport";
import session from "express-session";
import { Strategy as LocalStrategy } from "passport-local";
import type { Express, RequestHandler } from "express";
import connectPg from "connect-pg-simple";
import { db } from "./db";
import { users, type User } from "../shared/models/auth";
import { eq, sql } from "drizzle-orm";

const SALT_LENGTH = 32;
const KEY_LENGTH = 64;
const ITERATIONS = 100000;

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(SALT_LENGTH).toString("hex");
  const hash = crypto
    .pbkdf2Sync(password, salt, ITERATIONS, KEY_LENGTH, "sha512")
    .toString("hex");
  return `${salt}:${hash}`;
}

export function comparePasswords(password: string, storedHash: string): boolean {
  const [salt, hash] = storedHash.split(":");
  if (!salt || !hash) return false;
  const verifyHash = crypto
    .pbkdf2Sync(password, salt, ITERATIONS, KEY_LENGTH, "sha512")
    .toString("hex");
  return crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(verifyHash));
}

function getSessionStore() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000;
  const PgSession = connectPg(session);
  return new PgSession({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: false,
    ttl: sessionTtl,
    tableName: "sessions",
  });
}

function getSessionMiddleware() {
  return session({
    secret: process.env.SESSION_SECRET || "dev-secret-change-in-production",
    store: getSessionStore(),
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    },
  });
}

async function getNextEmployeeId(): Promise<string> {
  const [result] = await db
    .select({ maxId: sql<number>`COALESCE(MAX(CAST(employee_id AS INTEGER)), 1000)` })
    .from(users);
  return String((result?.maxId || 1000) + 1);
}

passport.use(
  new LocalStrategy(
    { usernameField: "email", passwordField: "password" },
    async (email, password, done) => {
      try {
        const [user] = await db.select().from(users).where(eq(users.email, email.toLowerCase()));

        if (!user) {
          return done(null, false, { message: "Invalid email or password" });
        }

        if (!user.password) {
          return done(null, false, { message: "Invalid email or password" });
        }

        const isValid = comparePasswords(password, user.password);
        if (!isValid) {
          return done(null, false, { message: "Invalid email or password" });
        }

        return done(null, { id: user.id });
      } catch (error) {
        return done(error);
      }
    }
  )
);

passport.serializeUser((user: Express.User, cb) => {
  cb(null, (user as any).id);
});

passport.deserializeUser(async (id: string, cb) => {
  try {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    if (!user) {
      return cb(null, false);
    }
    return cb(null, user);
  } catch (error) {
    return cb(error);
  }
});

export const isAuthenticated: RequestHandler = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: "Unauthorized" });
};

export function setupAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSessionMiddleware());
  app.use(passport.initialize());
  app.use(passport.session());
}

export function registerAuthRoutes(app: Express) {
  app.post("/api/register", async (req, res) => {
    try {
      const { email, password, firstName, lastName } = req.body;

      if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" });
      }

      if (password.length < 6) {
        return res.status(400).json({ message: "Password must be at least 6 characters" });
      }

      const [existing] = await db
        .select()
        .from(users)
        .where(eq(users.email, email.toLowerCase()));

      if (existing) {
        return res.status(409).json({ message: "Email already registered" });
      }

      const hashedPassword = hashPassword(password);
      const employeeId = await getNextEmployeeId();

      const [countResult] = await db
        .select({ count: sql<number>`count(*)` })
        .from(users);
      const isFirstUser = (countResult?.count || 0) === 0;

      const displayName = [firstName, lastName].filter(Boolean).join(" ") || null;

      const [newUser] = await db
        .insert(users)
        .values({
          email: email.toLowerCase(),
          password: hashedPassword,
          firstName: firstName || null,
          lastName: lastName || null,
          displayName,
          employeeId,
          role: isFirstUser ? "admin" : "technician",
        })
        .returning();

      req.login({ id: newUser.id }, (err) => {
        if (err) {
          return res.status(500).json({ message: "Failed to login after registration" });
        }
        const { password: _, ...userWithoutPassword } = newUser;
        return res.status(201).json(userWithoutPassword);
      });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ message: "Failed to register user" });
    }
  });

  app.post("/api/login", (req, res, next) => {
    passport.authenticate("local", (err: any, user: User | false, info: any) => {
      if (err) {
        return res.status(500).json({ message: "Authentication failed" });
      }

      if (!user) {
        return res.status(401).json({ message: info?.message || "Invalid credentials" });
      }

      req.login(user, (loginErr) => {
        if (loginErr) {
          return res.status(500).json({ message: "Failed to establish session" });
        }
        const { password: _, ...userWithoutPassword } = user as User;
        return res.json(userWithoutPassword);
      });
    })(req, res, next);
  });

  app.post("/api/logout", (req, res) => {
    req.logout((err) => {
      if (err) {
        return res.status(500).json({ message: "Failed to logout" });
      }
      res.json({ success: true });
    });
  });

  app.get("/api/auth/user", (req, res) => {
    if (req.isAuthenticated()) {
      const user = req.user as User;
      const { password: _, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } else {
      res.status(401).json({ message: "Not authenticated" });
    }
  });
}