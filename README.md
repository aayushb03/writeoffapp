<a href="https://demo-nextjs-with-supabase.vercel.app/">
  <img alt="Next.js and Supabase Starter Kit - the fastest way to build apps with Next.js and Supabase" src="https://demo-nextjs-with-supabase.vercel.app/opengraph-image.png">
  <h1 align="center">Next.js and Supabase Starter Kit</h1>
</a>

<p align="center">
 The fastest way to build apps with Next.js and Supabase
</p>

<p align="center">
  <a href="#features"><strong>Features</strong></a> ·
  <a href="#demo"><strong>Demo</strong></a> ·
  <a href="#deploy-to-vercel"><strong>Deploy to Vercel</strong></a> ·
  <a href="#clone-and-run-locally"><strong>Clone and run locally</strong></a> ·
  <a href="#feedback-and-issues"><strong>Feedback and issues</strong></a>
  <a href="#more-supabase-examples"><strong>More Examples</strong></a>
</p>
<br/>

# WriteOff App

A Next.js application for managing business expenses and tax deductions with Plaid integration and OpenAI-powered analysis.

## Backend Structure

The backend is organized into clear, modular functions separated by concern:

### Database Operations (`lib/database/`)
- **`users.ts`** - User CRUD operations
- **`transactions.ts`** - Transaction CRUD operations

### Plaid Integration (`lib/plaid/`)
- **`client.ts`** - Plaid client configuration
- **`auth.ts`** - Plaid authentication (link tokens, token exchange)
- **`transactions.ts`** - Plaid transaction fetching and account operations

### OpenAI Integration (`lib/openai/`)
- **`client.ts`** - OpenAI client configuration
- **`analysis.ts`** - Transaction analysis and tax summary generation

### API Routes (`app/api/`)
- **`/plaid/link-token`** - Create Plaid link tokens
- **`/plaid/exchange-token`** - Exchange public tokens for access tokens
- **`/plaid/transactions`** - Fetch transactions from Plaid
- **`/openai/analyze`** - Analyze transactions for deductibility
- **`/openai/summary`** - Generate tax summaries
- **`/database/transactions`** - Database transaction operations

## Key Features

- **Plaid Integration**: Connect bank accounts and fetch transactions
- **AI Analysis**: OpenAI-powered transaction categorization and deduction analysis
- **Database Management**: Organized Supabase operations for users and transactions
- **Modular Architecture**: Clean separation of concerns with reusable functions

## Environment Variables

Required environment variables:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `PLAID_CLIENT_ID`
- `PLAID_SECRET`
- `PLAID_ENV` (sandbox/development/production)
- `OPENAI_API_KEY`

## Usage

Import functions from the main API index:
```typescript
import { 
  createLinkToken, 
  fetchTransactions, 
  analyzeAllTransactions,
  getTransactions 
} from '@/lib/api'
```

This structure provides a clean, maintainable backend with clear separation between database operations, Plaid API calls, and OpenAI analysis functions.
