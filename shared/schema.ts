import { pgTable, text, serial, integer, boolean, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

export const roleEnum = pgEnum("role", ["user", "admin"]);
export const statusEnum = pgEnum("status", ["pending", "approved", "rejected"]);
export const categoryEnum = pgEnum("category", ["technology", "business", "healthcare", "education", "environment", "other"]);
export const timelineEnum = pgEnum("timeline", ["immediate", "short", "medium", "long"]);

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  fullName: text("full_name").notNull(),
  role: roleEnum("role").default("user").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const ideas = pgTable("ideas", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  category: categoryEnum("category").notNull(),
  targetAudience: text("target_audience"),
  timeline: timelineEnum("timeline"),
  additionalResources: text("additional_resources"),
  status: statusEnum("status").default("pending").notNull(),
  aiScore: integer("ai_score"),
  aiEvaluation: text("ai_evaluation"),
  rejectionReason: text("rejection_reason"),
  authorId: integer("author_id").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const votes = pgTable("votes", {
  id: serial("id").primaryKey(),
  ideaId: integer("idea_id").references(() => ideas.id).notNull(),
  userId: integer("user_id").references(() => users.id).notNull(),
  voteType: text("vote_type").notNull(), // "upvote" or "downvote"
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const usersRelations = relations(users, ({ many }) => ({
  ideas: many(ideas),
  votes: many(votes),
}));

export const ideasRelations = relations(ideas, ({ one, many }) => ({
  author: one(users, { fields: [ideas.authorId], references: [users.id] }),
  votes: many(votes),
}));

export const votesRelations = relations(votes, ({ one }) => ({
  idea: one(ideas, { fields: [votes.ideaId], references: [ideas.id] }),
  user: one(users, { fields: [votes.userId], references: [users.id] }),
}));

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  email: true,
  password: true,
  fullName: true,
});

export const insertIdeaSchema = createInsertSchema(ideas).pick({
  title: true,
  description: true,
  category: true,
  targetAudience: true,
  timeline: true,
  additionalResources: true,
});

export const insertVoteSchema = createInsertSchema(votes).pick({
  ideaId: true,
  voteType: true,
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertIdea = z.infer<typeof insertIdeaSchema>;
export type InsertVote = z.infer<typeof insertVoteSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type User = typeof users.$inferSelect;
export type Idea = typeof ideas.$inferSelect;
export type Vote = typeof votes.$inferSelect;
