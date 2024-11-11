# Agri Advice


## Setup Instructions

1. Install dependencies:
    ```sh
    npm install
    ```

2. Set up Supabase:
    - Create a Supabase project at [supabase.com](https://supabase.com).
    - Obtain the following keys from your Supabase project settings:
        - `NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY`
        - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
        - `NEXT_PUBLIC_SUPABASE_URL`
    - Add these keys to your `.env.local` file:
        ```env
        NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
        NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
        NEXT_PUBLIC_SUPABASE_URL=<your-supabase-url>
        ```

3. Set up Resend:
    - Create a Resend account at [resend.com](https://resend.com).

4. Configure Resend integration in Supabase:
    - Go to your Resend Settings.
    - Navigate to Settings -> Integrations.
    - Select corresponding options based on the project your working on.

5. Run the development server:
    ```sh
    npm run dev
    ```

6. Build the project for production:
    ```sh
    npm run build
    ```

7. Start the production server:
    ```sh
    npm start
    ```