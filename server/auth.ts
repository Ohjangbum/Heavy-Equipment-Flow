import crypto from "crypto";
import passport from "passport";
import session from "express-session";
import { Strategy as LocalStrategy } from "passport-local";
import type { Express, RequestHandler } from "express";
import connectPg from "connect-pg-simple";
import { db } from "./db.js";
import { users, type User } from "../shared/models/auth.js";
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

export const isMaster: RequestHandler = (req, res, next) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  if ((req.user as any).role !== "master") {
    return res.status(403).json({ message: "Only master account can perform this action" });
  }
  next();
};

export const isAdminOrMaster: RequestHandler = (req, res, next) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  const role = (req.user as any).role;
  if (role !== "admin" && role !== "master") {
    return res.status(403).json({ message: "Forbidden" });
  }
  next();
};

export function setupAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSessionMiddleware());
  app.use(passport.initialize());
  app.use(passport.session());
}

export function registerAuthRoutes(app: Express) {
  app.post("/api/users/create", isMaster, async (req, res) => {
    try {
      const { email, password, firstName, lastName, employeeId: reqEmployeeId, role } = req.body;

      if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" });
      }

      if (password.length < 6) {
        return res.status(400).json({ message: "Password must be at least 6 characters" });
      }

      if (role && !["admin", "technician"].includes(role)) {
        return res.status(400).json({ message: "Role must be admin or technician" });
      }

      const [existing] = await db
        .select()
        .from(users)
        .where(eq(users.email, email.toLowerCase()));

      if (existing) {
        return res.status(409).json({ message: "Email already registered" });
      }

      const employeeId = reqEmployeeId || await getNextEmployeeId();

      const [existingId] = await db
        .select()
        .from(users)
        .where(eq(users.employeeId, employeeId));

      if (existingId) {
        return res.status(409).json({ message: `Employee ID ${employeeId} already used` });
      }

      const hashedPassword = hashPassword(password);
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
          role: role || "technician",
        })
        .returning();

      const { password: _, ...userWithoutPassword } = newUser;
      res.status(201).json(userWithoutPassword);
    } catch (error) {
      console.error("Create user error:", error);
      res.status(500).json({ message: "Failed to create user" });
    }
  });

  app.post("/api/users/create-bulk", isMaster, async (req, res) => {
    try {
      const { users: userList } = req.body;

      if (!Array.isArray(userList) || userList.length === 0) {
        return res.status(400).json({ message: "users array is required" });
      }

      const created: any[] = [];
      const errors: any[] = [];

      for (const u of userList) {
        try {
          const { email, password, firstName, lastName, employeeId, role } = u;

          if (!email || !password) {
            errors.push({ email, error: "Email and password required" });
            continue;
          }

          if (password.length < 6) {
            errors.push({ email, error: "Password must be at least 6 characters" });
            continue;
          }

          const [existing] = await db.select().from(users).where(eq(users.email, email.toLowerCase()));
          if (existing) {
            errors.push({ email, error: "Email already registered" });
            continue;
          }

          const eid = employeeId || await getNextEmployeeId();
          const [existingId] = await db.select().from(users).where(eq(users.employeeId, eid));
          if (existingId) {
            errors.push({ email, error: `Employee ID ${eid} already used` });
            continue;
          }

          const hashedPassword = hashPassword(password);
          const displayName = [firstName, lastName].filter(Boolean).join(" ") || null;

          const [newUser] = await db
            .insert(users)
            .values({
              email: email.toLowerCase(),
              password: hashedPassword,
              firstName: firstName || null,
              lastName: lastName || null,
              displayName,
              employeeId: eid,
              role: role || "technician",
            })
            .returning();

          const { password: _, ...userWithoutPassword } = newUser;
          created.push(userWithoutPassword);
        } catch (err: any) {
          errors.push({ email: u.email, error: err.message });
        }
      }

      res.json({ created, errors });
    } catch (error) {
      console.error("Bulk create error:", error);
      res.status(500).json({ message: "Failed to create users" });
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
