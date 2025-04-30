# Agri Advice

## System Description

Agri-Advice is a specialized agricultural advisory platform designed to connect pig farmers with technical experts and provide AI-assisted guidance for swine management. The system features:

- **Multi-User Support**: Separate interfaces for farmers, technicians, and administrators
- **AI-Assisted Chat**: Intelligent responses to common pig farming queries
- **Expert Connection**: Direct communication between farmers and specialized technicians
- **Knowledge Management**: Curated reading lists and resources for farming best practices
- **Case Management**: Tracking of solved issues with categorization for reporting
- **Archiving System**: Organization of conversations for future reference
- **Feedback Collection**: Rating system for continuous service improvement

The platform aims to improve agricultural outcomes by providing timely expert advice and knowledge resources to pig farmers, while creating a supportive community of practice.

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

<!-- Tung other features;
•Archive of Message/Selection of Queries
•Identification of Unread message (Pf and Technician)
its either unread notif or number of message same sa messenger nga number ang mabutang kung pila ang naabot nga message sa both users

•Remarks for Report (Pending and Solve) for Technician portal nga mo display sa Report sa admin portal
•Delete button (AI and user (PF and Technician) -->