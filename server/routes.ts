import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { hashPassword, verifyPassword, generateToken, verifyToken, extractTokenFromHeader } from "./services/auth";
import { evaluateIdea } from "./services/ai-evaluator";
import { insertUserSchema, insertIdeaSchema, insertVoteSchema, loginSchema } from "@shared/schema";
import "./types";

// Middleware to verify JWT token
async function authenticateToken(req: Request, res: Response, next: Function) {
  const token = extractTokenFromHeader(req.headers.authorization);
  
  if (!token) {
    return res.status(401).json({ message: "Access token required" });
  }
  
  try {
    const payload = verifyToken(token);
    const user = await storage.getUser(payload.userId);
    
    if (!user) {
      return res.status(401).json({ message: "Invalid token" });
    }
    
    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid token" });
  }
}

// Middleware to verify admin role
function requireAdmin(req: Request, res: Response, next: Function) {
  if (req.user?.role !== "admin") {
    return res.status(403).json({ message: "Admin access required" });
  }
  next();
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Authentication routes
  app.post("/api/auth/signup", async (req: Request, res: Response) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(userData.email);
      if (existingUser) {
        return res.status(400).json({ message: "User already exists" });
      }
      
      // Hash password
      const hashedPassword = await hashPassword(userData.password);
      
      // Create user
      const user = await storage.createUser({
        ...userData,
        password: hashedPassword,
      });
      
      // Generate token
      const token = generateToken(user);
      
      res.json({
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          fullName: user.fullName,
          role: user.role,
        },
      });
    } catch (error) {
      console.error("Signup error:", error);
      res.status(400).json({ message: "Invalid input data" });
    }
  });

  app.post("/api/auth/login", async (req: Request, res: Response) => {
    try {
      const { email, password } = loginSchema.parse(req.body);
      
      // Find user
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      
      // Verify password
      const isValid = await verifyPassword(password, user.password);
      if (!isValid) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      
      // Generate token
      const token = generateToken(user);
      
      res.json({
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          fullName: user.fullName,
          role: user.role,
        },
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(400).json({ message: "Invalid input data" });
    }
  });

  app.get("/api/auth/me", authenticateToken, async (req: Request, res: Response) => {
    res.json({
      user: {
        id: req.user!.id,
        username: req.user!.username,
        email: req.user!.email,
        fullName: req.user!.fullName,
        role: req.user!.role,
      },
    });
  });

  // Ideas routes
  app.get("/api/ideas", async (req: Request, res: Response) => {
    try {
      const { status, category } = req.query;
      const ideas = await storage.getApprovedIdeasWithVotes();
      res.json(ideas);
    } catch (error) {
      console.error("Get ideas error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/ideas/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const idea = await storage.getIdeaWithAuthor(id);
      
      if (!idea) {
        return res.status(404).json({ message: "Idea not found" });
      }
      
      const voteCounts = await storage.getIdeaVoteCounts(id);
      
      res.json({
        ...idea,
        upvotes: voteCounts.upvotes,
        downvotes: voteCounts.downvotes,
      });
    } catch (error) {
      console.error("Get idea error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/ideas", authenticateToken, async (req: Request, res: Response) => {
    try {
      const ideaData = insertIdeaSchema.parse(req.body);
      const { requestAiEvaluation } = req.body;
      
      let aiScore = null;
      let aiEvaluation = null;
      
      // Perform AI evaluation if requested
      if (requestAiEvaluation) {
        const evaluation = await evaluateIdea(
          ideaData.title,
          ideaData.description,
          ideaData.category,
          ideaData.targetAudience || undefined,
          ideaData.timeline || undefined
        );
        
        aiScore = evaluation.score;
        aiEvaluation = evaluation.feedback;
      }
      
      // Create idea
      const idea = await storage.createIdea({
        ...ideaData,
        authorId: req.user!.id,
        ...(aiScore && { aiScore }),
        ...(aiEvaluation && { aiEvaluation }),
      });
      
      res.json(idea);
    } catch (error) {
      console.error("Create idea error:", error);
      res.status(400).json({ message: "Invalid input data" });
    }
  });

  app.put("/api/ideas/:id", authenticateToken, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const idea = await storage.getIdea(id);
      
      if (!idea) {
        return res.status(404).json({ message: "Idea not found" });
      }
      
      // Check if user owns the idea or is admin
      if (idea.authorId !== req.user!.id && req.user!.role !== "admin") {
        return res.status(403).json({ message: "Not authorized to edit this idea" });
      }
      
      const updates = insertIdeaSchema.partial().parse(req.body);
      const updatedIdea = await storage.updateIdea(id, updates);
      
      res.json(updatedIdea);
    } catch (error) {
      console.error("Update idea error:", error);
      res.status(400).json({ message: "Invalid input data" });
    }
  });

  app.delete("/api/ideas/:id", authenticateToken, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const idea = await storage.getIdea(id);
      
      if (!idea) {
        return res.status(404).json({ message: "Idea not found" });
      }
      
      // Check if user owns the idea or is admin
      if (idea.authorId !== req.user!.id && req.user!.role !== "admin") {
        return res.status(403).json({ message: "Not authorized to delete this idea" });
      }
      
      await storage.deleteIdea(id);
      res.json({ message: "Idea deleted successfully" });
    } catch (error) {
      console.error("Delete idea error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // User's ideas route
  app.get("/api/my-ideas", authenticateToken, async (req: Request, res: Response) => {
    try {
      const { status } = req.query;
      const ideas = await storage.getIdeas(status as string, undefined, req.user!.id);
      res.json(ideas);
    } catch (error) {
      console.error("Get my ideas error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Voting routes
  app.post("/api/ideas/:id/vote", authenticateToken, async (req: Request, res: Response) => {
    try {
      const ideaId = parseInt(req.params.id);
      const { voteType } = insertVoteSchema.parse(req.body);
      
      // Check if idea exists and is approved
      const idea = await storage.getIdea(ideaId);
      if (!idea) {
        return res.status(404).json({ message: "Idea not found" });
      }
      
      if (idea.status !== "approved") {
        return res.status(400).json({ message: "Can only vote on approved ideas" });
      }
      
      // Check if user already voted
      const existingVote = await storage.getVote(ideaId, req.user!.id);
      
      if (existingVote) {
        if (existingVote.voteType === voteType) {
          // Same vote type - remove vote
          await storage.deleteVote(ideaId, req.user!.id);
          res.json({ message: "Vote removed" });
        } else {
          // Different vote type - update vote
          await storage.updateVote(ideaId, req.user!.id, voteType);
          res.json({ message: "Vote updated" });
        }
      } else {
        // Create new vote
        await storage.createVote({
          ideaId,
          userId: req.user!.id,
          voteType,
        });
        res.json({ message: "Vote created" });
      }
    } catch (error) {
      console.error("Vote error:", error);
      res.status(400).json({ message: "Invalid input data" });
    }
  });

  // Admin routes
  app.get("/api/admin/ideas", authenticateToken, requireAdmin, async (req: Request, res: Response) => {
    try {
      const ideas = await storage.getIdeasForAdmin();
      res.json(ideas);
    } catch (error) {
      console.error("Get admin ideas error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.put("/api/admin/ideas/:id/approve", authenticateToken, requireAdmin, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const idea = await storage.getIdea(id);
      
      if (!idea) {
        return res.status(404).json({ message: "Idea not found" });
      }
      
      const updatedIdea = await storage.updateIdea(id, { status: "approved" });
      res.json(updatedIdea);
    } catch (error) {
      console.error("Approve idea error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.put("/api/admin/ideas/:id/reject", authenticateToken, requireAdmin, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const { reason } = req.body;
      
      const idea = await storage.getIdea(id);
      if (!idea) {
        return res.status(404).json({ message: "Idea not found" });
      }
      
      const updatedIdea = await storage.updateIdea(id, {
        status: "rejected",
        rejectionReason: reason,
      });
      
      res.json(updatedIdea);
    } catch (error) {
      console.error("Reject idea error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/admin/statistics", authenticateToken, requireAdmin, async (req: Request, res: Response) => {
    try {
      const stats = await storage.getStatistics();
      res.json(stats);
    } catch (error) {
      console.error("Get statistics error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // AI Evaluator route
  app.post("/api/ai-evaluator/evaluate", authenticateToken, async (req: Request, res: Response) => {
    try {
      const { title, description, category, timeline, targetAudience } = req.body;
      
      // Create comprehensive evaluation prompt
      const evaluationPrompt = `
        As an expert business analyst and innovation consultant, evaluate this idea with detailed insights:
        
        Title: ${title}
        Description: ${description}
        Category: ${category}
        Timeline: ${timeline}
        Target Audience: ${targetAudience}
        
        Please provide:
        1. Overall assessment and persona-based feedback
        2. Specific data sources for market research
        3. Recommended charts and visualizations
        4. Next steps and action plan
        5. Market research areas
        6. Timeline and budget estimates
        
        Be thorough and actionable in your recommendations.
      `;
      
      const evaluation = await evaluateIdea(title, evaluationPrompt, category, timeline, targetAudience);
      
      // Enhanced evaluation with additional insights
      const enhancedEvaluation = {
        ...evaluation,
        persona: `As your AI business consultant, I see ${title} as a ${category} solution with ${timeline} timeline potential. Based on the target audience of ${targetAudience}, this idea shows promise but requires strategic positioning and market validation.`,
        dataSources: [
          "Google Trends for market interest analysis",
          "Industry reports from IBISWorld or Statista",
          "Competitor analysis using SimilarWeb",
          "Social media sentiment analysis",
          "Government databases for regulatory information",
          "Patent databases for innovation landscape"
        ],
        recommendedCharts: [
          "Market Size Analysis (Bar Chart)",
          "Competitive Landscape (Bubble Chart)",
          "Customer Segmentation (Pie Chart)",
          "Revenue Projections (Line Chart)",
          "SWOT Analysis Matrix",
          "Timeline Gantt Chart"
        ],
        nextSteps: [
          "Conduct primary market research with target audience",
          "Develop minimum viable product (MVP) prototype",
          "Analyze competitive landscape and positioning",
          "Create detailed financial projections",
          "Develop go-to-market strategy",
          "Secure initial funding or investment"
        ],
        marketResearch: [
          "Customer pain points and needs analysis",
          "Pricing strategy and willingness to pay",
          "Distribution channels and partnerships",
          "Market entry barriers and regulations",
          "Competitive advantages and differentiation",
          "Scalability and growth potential"
        ],
        timeline: `Based on ${timeline} timeline: ${timeline === 'immediate' ? '1-3 months' : timeline === 'short' ? '3-6 months' : timeline === 'medium' ? '6-12 months' : '12+ months'} for initial market entry`,
        budgetEstimate: `Estimated initial investment: ${category === 'technology' ? '$50k-200k' : category === 'healthcare' ? '$100k-500k' : category === 'business' ? '$25k-100k' : '$10k-75k'} depending on scope and complexity`
      };
      
      res.json(enhancedEvaluation);
    } catch (error) {
      console.error("AI Evaluator error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // User management routes
  app.get("/api/admin/users", authenticateToken, requireAdmin, async (req: Request, res: Response) => {
    try {
      const users = await storage.getAllUsers();
      // Remove password from response
      const safeUsers = users.map(({ password, ...user }) => user);
      res.json(safeUsers);
    } catch (error) {
      console.error("Get users error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.put("/api/admin/users/:id/role", authenticateToken, requireAdmin, async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.id);
      const { role } = req.body;
      
      // Validate role
      if (!["user", "admin"].includes(role)) {
        return res.status(400).json({ message: "Invalid role" });
      }
      
      // Prevent admin from changing their own role
      if (userId === req.user!.id) {
        return res.status(400).json({ message: "Cannot change your own role" });
      }
      
      const user = await storage.updateUserRole(userId, role);
      const { password, ...safeUser } = user;
      res.json(safeUser);
    } catch (error) {
      console.error("Update user role error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
