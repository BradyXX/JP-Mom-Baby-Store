# JP Mom & Baby Store (Skeleton)

Minimalist COD E-commerce built with Next.js 14, Supabase, and Tailwind CSS.

## Getting Started

1.  **Clone the repository**
2.  **Install dependencies:**
    ```bash
    npm install
    ```
3.  **Environment Setup:**
    Copy `.env.local.example` to `.env.local` and fill in your Supabase credentials.
    ```bash
    cp .env.local.example .env.local
    ```
4.  **Run Development Server:**
    ```bash
    npm run dev
    ```
    Open [http://localhost:3000](http://localhost:3000) with your browser.

## Tech Stack

*   **Framework:** Next.js 14 (App Router)
*   **Language:** TypeScript
*   **Styling:** Tailwind CSS (Mobile-first, Japanese Minimalist)
*   **State:** Zustand (Cart & UI)
*   **Icons:** Lucide React
*   **Backend:** Supabase (Postgres)

## Folder Structure

*   `app/`: Pages and layouts
*   `components/`: Reusable UI components
*   `lib/supabase/`: Supabase client and types
*   `store/`: Global state management
