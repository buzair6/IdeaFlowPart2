import { users, ideas, votes, type User, type InsertUser, type Idea, type InsertIdea, type Vote, type InsertVote } from "@shared/schema";
import { db } from "./db";
import { eq, desc, sql, and } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getAllUsers(): Promise<User[]>;
  updateUserRole(userId: number, role: string): Promise<User>;
  
  // Idea operations
  getIdea(id: number): Promise<Idea | undefined>;
  getIdeas(status?: string, category?: string, authorId?: number): Promise<Idea[]>;
  getIdeaWithAuthor(id: number): Promise<any>;
  createIdea(idea: InsertIdea & { authorId: number }): Promise<Idea>;
  updateIdea(id: number, updates: Partial<Idea>): Promise<Idea>;
  deleteIdea(id: number): Promise<void>;
  
  // Vote operations
  getVote(ideaId: number, userId: number): Promise<Vote | undefined>;
  createVote(vote: InsertVote & { userId: number }): Promise<Vote>;
  updateVote(ideaId: number, userId: number, voteType: string): Promise<Vote>;
  deleteVote(ideaId: number, userId: number): Promise<void>;
  getIdeaVoteCounts(ideaId: number): Promise<{ upvotes: number; downvotes: number }>;
  
  // Dashboard operations
  getApprovedIdeasWithVotes(): Promise<any[]>;
  getIdeasForAdmin(): Promise<any[]>;
  getStatistics(): Promise<{
    pendingIdeas: number;
    approvedIdeas: number;
    totalVotes: number;
    activeUsers: number;
  }>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users).orderBy(users.createdAt);
  }

  async updateUserRole(userId: number, role: string): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ role: role as any })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  async getIdea(id: number): Promise<Idea | undefined> {
    const [idea] = await db.select().from(ideas).where(eq(ideas.id, id));
    return idea || undefined;
  }

  async getIdeas(status?: string, category?: string, authorId?: number): Promise<Idea[]> {
    let query = db.select().from(ideas);
    
    const conditions = [];
    if (status) conditions.push(eq(ideas.status, status as any));
    if (category) conditions.push(eq(ideas.category, category as any));
    if (authorId) conditions.push(eq(ideas.authorId, authorId));
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }
    
    return await query.orderBy(desc(ideas.createdAt));
  }

  async getIdeaWithAuthor(id: number): Promise<any> {
    const result = await db
      .select({
        id: ideas.id,
        title: ideas.title,
        description: ideas.description,
        category: ideas.category,
        targetAudience: ideas.targetAudience,
        timeline: ideas.timeline,
        additionalResources: ideas.additionalResources,
        status: ideas.status,
        aiScore: ideas.aiScore,
        aiEvaluation: ideas.aiEvaluation,
        rejectionReason: ideas.rejectionReason,
        createdAt: ideas.createdAt,
        updatedAt: ideas.updatedAt,
        author: {
          id: users.id,
          username: users.username,
          fullName: users.fullName,
          email: users.email,
        },
      })
      .from(ideas)
      .leftJoin(users, eq(ideas.authorId, users.id))
      .where(eq(ideas.id, id));
    
    return result[0] || undefined;
  }

  async createIdea(idea: InsertIdea & { authorId: number }): Promise<Idea> {
    const [newIdea] = await db
      .insert(ideas)
      .values(idea)
      .returning();
    return newIdea;
  }

  async updateIdea(id: number, updates: Partial<Idea>): Promise<Idea> {
    const [updatedIdea] = await db
      .update(ideas)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(ideas.id, id))
      .returning();
    return updatedIdea;
  }

  async deleteIdea(id: number): Promise<void> {
    await db.delete(ideas).where(eq(ideas.id, id));
  }

  async getVote(ideaId: number, userId: number): Promise<Vote | undefined> {
    const [vote] = await db
      .select()
      .from(votes)
      .where(and(eq(votes.ideaId, ideaId), eq(votes.userId, userId)));
    return vote || undefined;
  }

  async createVote(vote: InsertVote & { userId: number }): Promise<Vote> {
    const [newVote] = await db
      .insert(votes)
      .values(vote)
      .returning();
    return newVote;
  }

  async updateVote(ideaId: number, userId: number, voteType: string): Promise<Vote> {
    const [updatedVote] = await db
      .update(votes)
      .set({ voteType })
      .where(and(eq(votes.ideaId, ideaId), eq(votes.userId, userId)))
      .returning();
    return updatedVote;
  }

  async deleteVote(ideaId: number, userId: number): Promise<void> {
    await db.delete(votes).where(and(eq(votes.ideaId, ideaId), eq(votes.userId, userId)));
  }

  async getIdeaVoteCounts(ideaId: number): Promise<{ upvotes: number; downvotes: number }> {
    const upvotes = await db
      .select({ count: sql<number>`count(*)` })
      .from(votes)
      .where(and(eq(votes.ideaId, ideaId), eq(votes.voteType, 'upvote')));
    
    const downvotes = await db
      .select({ count: sql<number>`count(*)` })
      .from(votes)
      .where(and(eq(votes.ideaId, ideaId), eq(votes.voteType, 'downvote')));
    
    return {
      upvotes: upvotes[0]?.count || 0,
      downvotes: downvotes[0]?.count || 0,
    };
  }

  async getApprovedIdeasWithVotes(): Promise<any[]> {
    const result = await db
      .select({
        id: ideas.id,
        title: ideas.title,
        description: ideas.description,
        category: ideas.category,
        aiScore: ideas.aiScore,
        createdAt: ideas.createdAt,
        author: {
          id: users.id,
          username: users.username,
          fullName: users.fullName,
        },
        upvotes: sql<number>`count(case when ${votes.voteType} = 'upvote' then 1 end)`,
        downvotes: sql<number>`count(case when ${votes.voteType} = 'downvote' then 1 end)`,
      })
      .from(ideas)
      .leftJoin(users, eq(ideas.authorId, users.id))
      .leftJoin(votes, eq(ideas.id, votes.ideaId))
      .where(eq(ideas.status, 'approved'))
      .groupBy(ideas.id, users.id)
      .orderBy(desc(ideas.createdAt));
    
    return result;
  }

  async getIdeasForAdmin(): Promise<any[]> {
    const result = await db
      .select({
        id: ideas.id,
        title: ideas.title,
        description: ideas.description,
        category: ideas.category,
        status: ideas.status,
        aiScore: ideas.aiScore,
        createdAt: ideas.createdAt,
        author: {
          id: users.id,
          username: users.username,
          fullName: users.fullName,
          email: users.email,
        },
      })
      .from(ideas)
      .leftJoin(users, eq(ideas.authorId, users.id))
      .orderBy(desc(ideas.createdAt));
    
    return result;
  }

  async getStatistics(): Promise<{
    pendingIdeas: number;
    approvedIdeas: number;
    totalVotes: number;
    activeUsers: number;
  }> {
    const [pendingIdeas] = await db
      .select({ count: sql<number>`count(*)` })
      .from(ideas)
      .where(eq(ideas.status, 'pending'));
    
    const [approvedIdeas] = await db
      .select({ count: sql<number>`count(*)` })
      .from(ideas)
      .where(eq(ideas.status, 'approved'));
    
    const [totalVotes] = await db
      .select({ count: sql<number>`count(*)` })
      .from(votes);
    
    const [activeUsers] = await db
      .select({ count: sql<number>`count(distinct ${users.id})` })
      .from(users);
    
    return {
      pendingIdeas: pendingIdeas.count || 0,
      approvedIdeas: approvedIdeas.count || 0,
      totalVotes: totalVotes.count || 0,
      activeUsers: activeUsers.count || 0,
    };
  }
}

export const storage = new DatabaseStorage();
