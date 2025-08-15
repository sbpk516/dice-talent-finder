# GitHub Talent Finder - AI-Powered Candidate Search

This GitHub crawler automatically searches for suitable candidates based on job requirements by analyzing GitHub profiles, repositories, and contributions.

## Features

- 🔍 **Smart Search**: Uses GitHub API to search for developers with matching skills
- 📊 **AI Scoring**: Scores candidates based on skills match, experience, and GitHub activity
- 🎯 **Skill Matching**: Analyzes repositories and profiles to extract relevant skills
- 📈 **Experience Assessment**: Calculates experience level based on GitHub activity
- 💼 **Hireable Status**: Identifies candidates who are actively looking for opportunities
- 📁 **Results Export**: Saves detailed candidate profiles to JSON files

## Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Set Up Environment Variables
Create a `.env` file in the root directory:

```env
# Required for job parsing
OPENAI_API_KEY=your_openai_api_key_here

# Optional: GitHub API token for higher rate limits
GITHUB_TOKEN=your_github_token_here
```

**Note**: GitHub token is optional but recommended for higher rate limits (5000 requests/hour vs 60 requests/hour for unauthenticated requests).

### 3. Get GitHub Token (Optional but Recommended)
1. Go to [GitHub Settings > Developer settings > Personal access tokens](https://github.com/settings/tokens)
2. Generate a new token with `public_repo` and `read:user` permissions
3. Add it to your `.env` file

## Usage

### Option 1: Run Complete Pipeline (Recommended)
This parses a job description and finds candidates:

```bash
npm run talent-finder
```

### Option 2: Run GitHub Search Only
This searches for candidates using predefined job requirements:

```bash
npm run github-search
```

### Option 3: Use in Your Code
```javascript
import { runTalentFinderPipeline } from './src/talent-finder-pipeline.js';

const jobDescription = `
# Senior Data Scientist
**Company:** Your Company
**Location:** Remote
**Requirements:**
- 5+ years Python experience
- Machine learning expertise
- SQL and data analysis skills
`;

const results = await runTalentFinderPipeline(jobDescription);
console.log(`Found ${results.candidates.length} candidates`);
```

## How It Works

### 1. Job Parsing
- Uses AI to extract structured job requirements from job descriptions
- Identifies required skills, experience level, location, and salary

### 2. GitHub Search
- Builds search queries based on required skills and experience
- Searches GitHub users with relevant repositories and activity
- Filters by location, followers, and account age

### 3. Candidate Enrichment
- Fetches detailed profiles for potential candidates
- Analyzes repositories to extract skills and technologies
- Calculates experience level based on GitHub activity

### 4. Scoring and Ranking
- Scores candidates based on:
  - Skills match (40% weight)
  - Preferred skills match (20% weight)
  - Experience level match (20% weight)
  - Years of experience (10% weight)
  - GitHub activity (10% weight)
- Ranks candidates by total score

## Output Format

The crawler generates detailed candidate profiles:

```json
{
  "username": "johndoe",
  "name": "John Doe",
  "score": 85,
  "profile": "https://github.com/johndoe",
  "avatar": "https://avatars.githubusercontent.com/u/123456",
  "location": "San Francisco, CA",
  "hireable": true,
  "experience": {
    "level": "senior",
    "yearsSinceJoin": 6.2,
    "totalStars": 150,
    "publicRepos": 25
  },
  "skills": ["python", "machine learning", "tensorflow", "sql", "aws"],
  "skillsMatch": {
    "required": 6,
    "preferred": 3,
    "total": 9
  },
  "repositories": 25,
  "followers": 200,
  "publicRepos": 25
}
```

## Rate Limiting

- **Without GitHub Token**: 60 requests/hour
- **With GitHub Token**: 5000 requests/hour

The crawler includes built-in rate limiting and delays to respect GitHub's API limits.

## Customization

### Modify Search Queries
Edit `buildSearchQueries()` in `src/scrapers/github-crawler.js` to customize search strategies.

### Adjust Scoring Weights
Modify `scoreCandidates()` in `src/scrapers/github-crawler.js` to change how candidates are ranked.

### Add New Skills
Update the `skillKeywords` array in `extractSkills()` to recognize additional technologies.

## Troubleshooting

### Rate Limit Errors
- Add a GitHub token to your `.env` file
- The crawler automatically handles rate limiting with delays

### No Candidates Found
- Check if your job requirements are too specific
- Try broadening the search criteria
- Verify your GitHub token has correct permissions

### API Errors
- Ensure your GitHub token is valid
- Check network connectivity
- Verify the GitHub API is accessible

## Files Structure

```
src/
├── scrapers/
│   └── github-crawler.js      # Main GitHub crawler
├── talent-finder-pipeline.js  # Complete pipeline
├── github-talent-finder.js    # GitHub search only
└── parsers/
    └── job-parser.js          # Job description parser

data/
├── github-candidates.json     # GitHub search results
└── talent-finder-results.json # Complete pipeline results
```

## Example Output

```
🚀 Starting Talent Finder Pipeline...
============================================================
📋 Step 1: Parsing job description with AI...
✅ Job parsing completed!
📋 Job Title: Senior Data Scientist - Machine Learning
🏢 Company: DataFlow Analytics
📍 Location: remote (USA)
💰 Salary: $150,000 - $200,000 USD
📚 Required Skills: Python, pandas, scikit-learn, TensorFlow/PyTorch, SQL, data warehousing, statistical analysis, cloud platforms

🔍 Step 2: Searching GitHub for suitable candidates...
✅ Found 15 potential candidates!

🏆 Top Candidates:
============================================================
#1 - John Smith (@johnsmith)
   📊 Score: 92/100
   📍 Location: San Francisco, CA
   💼 Experience: senior (6.2 years on GitHub)
   🛠️  Skills Match: 7/8 required, 4/6 preferred
   📦 Repositories: 25 public repos
   ⭐ Stars: 150
   👥 Followers: 200
   🔗 Profile: https://github.com/johnsmith
   💼 Hireable: Yes
   🎯 Top Skills: python, machine learning, tensorflow, sql, aws
```

## License

MIT License - feel free to use and modify for your recruitment needs!
