# IdeaVault - Idea Submission and Evaluation Platform

## Overview

IdeaVault is a full-stack web application that allows users to submit, evaluate, and vote on ideas. The platform includes AI-powered idea evaluation, user authentication, role-based access control, and a comprehensive admin dashboard. Built with modern web technologies including React, Express, PostgreSQL, and integrated with Google's Gemini AI.

## User Preferences

Preferred communication style: Simple, everyday language.
- Removed all Replit authentication dependencies and session-based auth
- Uses pure JWT-based authentication system
- Cleaned up all Replit-specific integrations from the codebase

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter for client-side routing
- **State Management**: Zustand for global state, React Query for server state
- **UI Components**: Radix UI primitives with custom Tailwind CSS styling
- **Build Tool**: Vite for development and production builds
- **Styling**: Tailwind CSS with CSS variables for theming

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **Database**: PostgreSQL with Neon serverless
- **ORM**: Drizzle ORM for type-safe database operations
- **Authentication**: JWT tokens with bcrypt for password hashing
- **AI Integration**: Google Gemini AI for idea evaluation
- **API Design**: RESTful API with structured error handling

### Project Structure
- `client/` - React frontend application
- `server/` - Express backend API
- `shared/` - Shared TypeScript schemas and types
- `migrations/` - Database migration files

## Key Components

### Authentication System
- JWT-based authentication with 7-day token expiration
- Role-based access control (user/admin roles)  
- Password hashing using bcrypt
- Token stored in localStorage with automatic header injection
- Protected routes with authentication middleware
- Completely independent authentication system (no Replit dependencies)

### Database Schema
- **Users**: Authentication, profile, and role management
- **Ideas**: Core idea entity with status tracking, AI evaluation scores
- **Votes**: User voting system with upvote/downvote functionality
- **Enums**: Predefined categories, statuses, timelines, and roles

### AI Evaluation Service
- Integration with Google Gemini AI for idea assessment
- Scoring system across multiple criteria (feasibility, market potential, innovation, impact)
- Structured evaluation with detailed feedback
- Optional AI evaluation during idea submission

### Admin Dashboard
- Idea approval/rejection workflow
- Statistics and analytics
- User management capabilities
- Bulk operations for content moderation

### Voting System
- Upvote/downvote functionality for approved ideas
- Vote tracking per user with update capabilities
- Real-time vote count aggregation
- Integration with idea display components

## Data Flow

### Idea Submission Flow
1. User submits idea through form with optional AI evaluation request
2. System validates input using Zod schemas
3. If AI evaluation requested, calls Gemini API for scoring
4. Stores idea with "pending" status in database
5. Admin reviews and approves/rejects via admin dashboard
6. Approved ideas appear in public dashboard for voting

### Authentication Flow
1. User registers/logs in through auth endpoints
2. Server validates credentials and generates JWT token
3. Token stored in localStorage and automatically included in requests
4. Protected routes verify token and extract user information
5. Role-based access control restricts admin functionality

### Voting Flow
1. User clicks vote button on approved idea
2. System checks for existing vote and updates/creates accordingly
3. Vote counts aggregated and displayed in real-time
4. Ideas sorted by vote score in dashboard

## External Dependencies

### Core Technologies
- **React Query**: Server state management and caching
- **Radix UI**: Accessible component primitives
- **Drizzle ORM**: Type-safe database operations
- **Neon Database**: Serverless PostgreSQL hosting
- **Google Gemini AI**: Idea evaluation and scoring
- **Tailwind CSS**: Utility-first styling framework

### Development Tools
- **Vite**: Fast build tool with HMR
- **TypeScript**: Type safety across the stack
- **ESLint/Prettier**: Code quality and formatting
- **Zod**: Runtime type validation and schema definition

### Third-Party Services
- **Neon**: Serverless PostgreSQL database hosting
- **Google AI**: Gemini API for natural language processing
- **JWT**: Stateless authentication tokens

## Deployment Strategy

### Development Setup
- Environment variables for database connection and API keys
- Vite development server with hot module replacement
- TypeScript compilation with shared type definitions
- Database migrations using Drizzle Kit

### Production Build
- Vite builds optimized React bundle
- esbuild compiles Node.js server code
- Static assets served from Express server
- Database schema deployed via migration system

### Environment Configuration
- `DATABASE_URL`: PostgreSQL connection string
- `JWT_SECRET`: Token signing secret
- `GEMINI_API_KEY`: Google AI API access
- `NODE_ENV`: Environment mode (development/production)

### Key Architectural Decisions

1. **Monorepo Structure**: Shared types and schemas between frontend and backend reduce duplication and ensure consistency
2. **Serverless Database**: Neon provides scalable PostgreSQL without infrastructure management
3. **Type Safety**: End-to-end TypeScript with Zod validation ensures runtime safety
4. **AI Integration**: Optional AI evaluation provides value-added features without blocking core functionality
5. **Component-Based UI**: Radix UI primitives ensure accessibility while maintaining design flexibility
6. **JWT Authentication**: Stateless tokens enable scalable authentication without server-side sessions