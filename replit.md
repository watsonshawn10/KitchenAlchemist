# ChefAI - AI-Powered Recipe Generator

## Overview

ChefAI is a full-stack web application that generates personalized recipes using AI based on available ingredients. The application features a React frontend with TypeScript, an Express.js backend, PostgreSQL database with Drizzle ORM, and integrates with OpenAI for recipe generation and Stripe for subscription management.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Styling**: Tailwind CSS with shadcn/ui components
- **State Management**: React Query (@tanstack/react-query) for server state
- **Routing**: Wouter for client-side navigation
- **Build Tool**: Vite with custom configuration for development and production

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **Authentication**: Replit Auth with OpenID Connect integration
- **Session Management**: Express sessions stored in PostgreSQL
- **API Design**: RESTful endpoints with proper middleware stack
- **Error Handling**: Centralized error handling with proper HTTP status codes

### Database Architecture
- **Database**: PostgreSQL (configured for Neon serverless)
- **ORM**: Drizzle ORM with type-safe schema definitions
- **Migrations**: Managed through Drizzle Kit
- **Connection**: Connection pooling with @neondatabase/serverless

## Key Components

### Authentication System
- **Provider**: Replit Auth with OIDC
- **Session Storage**: PostgreSQL-backed sessions using connect-pg-simple
- **User Management**: Complete user lifecycle with profile data storage
- **Security**: HTTP-only cookies, CSRF protection, secure session handling

### Recipe Generation Engine
- **AI Provider**: OpenAI GPT integration
- **Input Processing**: Ingredient validation and normalization
- **Output Formatting**: Structured recipe data with ingredients, instructions, and metadata
- **Usage Limits**: Tier-based monthly limits (free: 2 recipes, pro: 50, premium: unlimited)

### Payment Processing
- **Provider**: Stripe integration with React Stripe.js
- **Subscription Plans**: Free, Pro ($9.99/month), Premium ($19.99/month)
- **Webhook Handling**: Automatic subscription status updates
- **Payment Security**: PCI-compliant payment processing

### UI Component System
- **Design System**: shadcn/ui with Radix UI primitives
- **Theme**: Custom color scheme with CSS variables
- **Responsive Design**: Mobile-first approach with Tailwind breakpoints
- **Accessibility**: ARIA-compliant components with keyboard navigation

## Data Flow

### Recipe Generation Flow
1. User inputs ingredients through the ingredient input component
2. Frontend validates input and checks user's remaining quota
3. Request sent to `/api/generate-recipes` with authentication
4. Backend validates user permissions and usage limits
5. OpenAI API called to generate recipe suggestions
6. Generated recipes stored in database with user association
7. Response returned to frontend with generated recipes
8. User can view, save, and interact with recipes

### Authentication Flow
1. User initiates login through Replit Auth
2. OIDC authentication flow with Replit identity provider
3. User profile data extracted and stored/updated in database
4. Session created and stored in PostgreSQL
5. User redirected to main application with authenticated session
6. Protected routes check authentication status via middleware

### Subscription Flow
1. User selects subscription plan on pricing page
2. Stripe Checkout session created with plan details
3. User completes payment through Stripe
4. Webhook updates user subscription status in database
5. Usage limits updated based on new subscription tier
6. User gains access to increased recipe generation quota

## External Dependencies

### Core Services
- **OpenAI API**: Recipe generation and content creation
- **Stripe**: Payment processing and subscription management
- **Replit Auth**: Authentication and user identity management
- **Neon Database**: Serverless PostgreSQL hosting

### Development Tools
- **Vite**: Frontend build tool and development server
- **Drizzle Kit**: Database migration and schema management
- **ESBuild**: Backend bundling for production deployment
- **TypeScript**: Type safety across frontend and backend

### UI Libraries
- **Radix UI**: Accessible component primitives
- **Tailwind CSS**: Utility-first CSS framework
- **Lucide React**: Icon library
- **React Hook Form**: Form state management with validation

## Deployment Strategy

### Development Environment
- **Frontend**: Vite dev server with HMR
- **Backend**: tsx for TypeScript execution with auto-reload
- **Database**: Local development with environment-based connection string
- **Build Process**: Concurrent frontend and backend development

### Production Build
- **Frontend**: Vite production build to `dist/public`
- **Backend**: ESBuild bundle to `dist/index.js`
- **Static Assets**: Served through Express static middleware
- **Database**: Production PostgreSQL with connection pooling

### Environment Configuration
- **Database**: `DATABASE_URL` for PostgreSQL connection
- **Authentication**: `SESSION_SECRET`, `ISSUER_URL`, `REPLIT_DOMAINS`
- **API Keys**: `OPENAI_API_KEY`, `STRIPE_SECRET_KEY`, `VITE_STRIPE_PUBLIC_KEY`
- **Feature Flags**: Environment-based feature toggles

## Changelog

```
Changelog:
- July 01, 2025. Initial setup
```

## User Preferences

```
Preferred communication style: Simple, everyday language.
```