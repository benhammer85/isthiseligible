# Harvard Bike Benefit Eligibility Checker

A web-based tool for Harvard employees to determine if their bike-related purchases are eligible for reimbursement.

## 🚀 Deployment Instructions (Netlify)

1. **Upload to GitHub**: Create a new GitHub repository and upload all files in this project.
2. **Connect to Netlify**: 
   - Log in to [Netlify](https://www.netlify.com/).
   - Click **"Add new site"** > **"Import an existing project"**.
   - Select your GitHub repository.
3. **Add API Key (Crucial Step)**:
   - Once the site is created, click the **"Site configuration"** tab in the left-hand menu.
   - Click **"Environment variables"** (under Site configuration).
   - Click **"Add a variable"** > **"Create a single variable"**.
   - **Key**: `API_KEY`
   - **Value**: (Paste your Google Gemini API Key here)
   - Click **"Create variable"**.
4. **Re-deploy**:
   - Go to the **"Deploys"** tab.
   - Click the **"Trigger deploy"** dropdown menu.
   - Select **"Clear cache and deploy site"**. This ensures the build uses the new key.

## 🛠 Project Structure

- `index.html` & `index.tsx`: Entry points.
- `App.tsx`: Main application logic and layout.
- `components/`: UI pieces (Header, Results).
- `services/`: AI logic (Gemini API integration).
- `constants.ts`: Harvard's program parameters and AI instructions.
- `types.ts`: TypeScript definitions.