# Contributing to ResilientPH

Thank you for your interest in contributing to ResilientPH! This is an open-source project dedicated to providing accessible, real-time disaster preparedness and hazard monitoring across the Philippines.

## Code of Conduct

All contributors and participants are expected to adhere to our [Code of Conduct](CODE_OF_CONDUCT.md).

## Getting Started

1. **Fork the Repository:** Create your own fork of the repo on GitHub.
2. **Clone Locally:**
   ```bash
   git clone https://github.com/<your-username>/resilientph.git
   cd resilientph
   ```
3. **Install Dependencies:**
   We use `pnpm` exclusively:
   ```bash
   pnpm install
   ```
4. **Environment Setup:**
   Copy `.env.example` to `.env.local` and configure your local Supabase and API credentials:
   ```bash
   cp .env.example .env.local
   ```
5. **Run the Development Server:**
   ```bash
   pnpm dev
   ```

## Architectural Guidelines

To maintain code quality and modularity, please follow the conventions documented in [`AGENTS.md`](AGENTS.md):

- **Package Manager:** Use `pnpm` exclusively. Never commit `package-lock.json` or `yarn.lock`.
- **Folder Boundaries:**
  - `app/`: Thin route entrypoints only. No heavy business logic.
  - `components/<domain>/`: Feature UI and presentation. Custom hooks belong in `hooks/`.
  - `components/ui/`: Reusable, generic UI primitives.
  - `hooks/<domain>/`: Custom domain state and hooks.
  - `lib/<domain>/`: Pure utilities, parsers, and API clients.
  - `supabase/migrations/`: Idempotent SQL migrations with timestamp prefixes.
- **File Length:** Keep files focused and under 300 lines where practical.
- **Design & UI:** Use Tailwind CSS tokens (`bg-background`, `text-foreground`, etc.). Do not use emoji in the UI; use Lucide React icons.
- **Security First:** Never expose secrets or `SUPABASE_SERVICE_ROLE_KEY`. Validate authentication using `supabase.auth.getUser()`, never `getSession()`.

## Pull Request Process

1. **Create a Feature Branch:**
   ```bash
   git checkout -b feat/your-feature-name
   # or
   git checkout -b fix/issue-description
   ```
2. **Verify Changes:**
   Ensure both the linter and production build pass with zero errors before submitting:
   ```bash
   pnpm lint
   pnpm build
   ```
3. **Open a PR:**
   - Provide a clear description of the problem solved or feature added.
   - Reference any relevant issues (e.g., `Fixes #12`).
   - Keep pull requests focused on a single responsibility.
