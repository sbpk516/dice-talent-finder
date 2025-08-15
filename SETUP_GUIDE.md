# Setup Guide - GitHub Token and Environment Variables

## Step 1: Create GitHub Token

### 1. Go to GitHub Settings
- Log into your GitHub account
- Click your profile picture → **Settings**

### 2. Navigate to Developer Settings
- Scroll down → **Developer settings**
- Click **Personal access tokens**
- Select **Tokens (classic)**

### 3. Generate New Token
- Click **Generate new token (classic)**
- **Note**: "Talent Finder GitHub Crawler"
- **Expiration**: 90 days (recommended)
- **Scopes**: Select these permissions:
  - ✅ `public_repo` (read public repositories)
  - ✅ `read:user` (read user profiles)
  - ✅ `read:email` (optional, additional user info)

### 4. Copy Token
- Click **Generate token**
- **IMPORTANT**: Copy the token immediately - you won't see it again!

## Step 2: Create Environment File

Create a `.env` file in your project root directory:

```bash
# In your project root directory
touch .env
```

Add your tokens to the `.env` file:

```env
# GitHub API Token
GITHUB_TOKEN=ghp_your_actual_token_here

# OpenAI API Key (for job parsing)
OPENAI_API_KEY=sk-your_openai_key_here
```

## Step 3: Verify Setup

### Test GitHub Token
```bash
# Test if your token works
curl -H "Authorization: token YOUR_TOKEN_HERE" https://api.github.com/user
```

### Test the Crawler
```bash
# Run the example to test everything
npm run example
```

## Token Security

### ✅ Do's:
- Store tokens in `.env` file (already in .gitignore)
- Use descriptive token names
- Set appropriate expiration dates
- Use minimal required permissions

### ❌ Don'ts:
- Never commit tokens to git
- Don't share tokens publicly
- Don't use tokens in client-side code
- Don't hardcode tokens in source files

## Rate Limits

### Without GitHub Token:
- 60 requests per hour
- Limited search capabilities

### With GitHub Token:
- 5,000 requests per hour
- Full search capabilities
- Better rate limit handling

## Troubleshooting

### "Rate limit exceeded"
- Add GitHub token to `.env` file
- Wait an hour and try again
- Check token permissions

### "Invalid token"
- Verify token is copied correctly
- Check token hasn't expired
- Ensure correct scopes are selected

### "Token not found"
- Make sure `.env` file exists in project root
- Check file format (no spaces around `=`)
- Restart your terminal/IDE

## Example .env File

```env
# GitHub API Token for Talent Finder
GITHUB_TOKEN=ghp_1234567890abcdef1234567890abcdef12345678

# OpenAI API Key for job parsing
OPENAI_API_KEY=sk-1234567890abcdef1234567890abcdef1234567890abcdef
```

## Next Steps

After setting up your tokens:

1. **Test the setup**:
   ```bash
   npm run example
   ```

2. **Run the full pipeline**:
   ```bash
   npm run talent-finder
   ```

3. **Check results**:
   - Look in `./data/` folder for JSON results
   - Review candidate profiles and scores

## Need Help?

- GitHub Token Issues: [GitHub Personal Access Tokens](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/creating-a-personal-access-token)
- OpenAI API Issues: [OpenAI API Documentation](https://platform.openai.com/docs/api-reference)
- Project Issues: Check the `GITHUB_CRAWLER_README.md` file
