<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1A8UVm-5tINifrUBgaDIc6f7zu7tdS5N1

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the following keys in [.env.local](.env.local) (These keys are used by the secure backend server and frontend):
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY` (Public key for client-side Supabase interactions)
   - `SUPABASE_SERVICE_KEY` (Crucial for server-side auth and storage access)
   - `GEMINI_API_KEY`
   - `FREEPIK_API_KEY`
3. Run the app:
   `npm run dev`