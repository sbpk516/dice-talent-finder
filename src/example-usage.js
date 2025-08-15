// src/example-usage.js
// Example usage of GitHub Talent Finder with your job requirements format

import GitHubCrawler from './scrapers/github-crawler.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Your job requirements in the exact format you provided
const jobRequirements = {
    "title": "Senior Data Scientist - Machine Learning",
    "level": "senior",
    "yearsExperience": {
        "min": 5,
        "max": 10
    },
    "location": {
        "type": "remote",
        "city": null,
        "state": null,
        "country": "USA"
    },
    "salary": {
        "min": 150000,
        "max": 200000,
        "currency": "USD",
        "period": "yearly"
    },
    "requiredSkills": [
        "Python",
        "pandas",
        "scikit-learn",
        "TensorFlow/PyTorch",
        "SQL",
        "data warehousing",
        "statistical analysis",
        "cloud platforms"
    ],
    "preferredSkills": [
        "MLOps",
        "deep learning",
        "neural networks",
        "real-time data processing",
        "A/B testing",
        "causal inference"
    ],
    "benefits": [
        "Competitive salary with equity participation",
        "Comprehensive health, dental, and vision coverage",
        "401(k) with company match",
        "Flexible work schedule and unlimited PTO",
        "Professional development budget",
        "Home office setup allowance"
    ],
    "companyInfo": {
        "name": "DataFlow Analytics",
        "size": "startup",
        "industry": "Analytics"
    }
};

async function findCandidatesForYourJob() {
    try {
        console.log('🚀 GitHub Talent Finder - Example Usage');
        console.log('=' .repeat(60));
        console.log(`📋 Job: ${jobRequirements.title}`);
        console.log(`🏢 Company: ${jobRequirements.companyInfo.name}`);
        console.log(`📍 Location: ${jobRequirements.location.type} (${jobRequirements.location.country})`);
        console.log(`💰 Salary: $${jobRequirements.salary.min.toLocaleString()} - $${jobRequirements.salary.max.toLocaleString()} ${jobRequirements.salary.currency}`);
        console.log(`📚 Required Skills: ${jobRequirements.requiredSkills.join(', ')}`);
        console.log(`🎯 Preferred Skills: ${jobRequirements.preferredSkills.join(', ')}`);
        console.log('');

        // Initialize GitHub crawler
        const crawler = new GitHubCrawler();
        
        console.log('🔍 Searching GitHub for suitable candidates...');
        console.log('⏳ This may take a few minutes due to API rate limiting...');
        console.log('');

        // Search for candidates
        const candidates = await crawler.searchCandidates(jobRequirements);
        
        if (candidates.length === 0) {
            console.log('❌ No suitable candidates found.');
            console.log('💡 Try:');
            console.log('   - Adding a GitHub token to your .env file for higher rate limits');
            console.log('   - Broadening the search criteria');
            console.log('   - Checking your internet connection');
            return;
        }
        
        console.log(`✅ Found ${candidates.length} potential candidates!`);
        console.log('');
        
        // Display top candidates
        console.log('🏆 Top 10 Candidates:');
        console.log('=' .repeat(60));
        
        candidates.slice(0, 10).forEach((candidate, index) => {
            const formatted = crawler.formatCandidateOutput(candidate);
            
            console.log(`#${index + 1} - ${formatted.name} (@${formatted.username})`);
            console.log(`   📊 Score: ${formatted.score}/100`);
            console.log(`   📍 Location: ${formatted.location || 'Not specified'}`);
            console.log(`   💼 Experience: ${formatted.experience.level} (${formatted.experience.yearsSinceJoin} years on GitHub)`);
            console.log(`   🛠️  Skills Match: ${formatted.skillsMatch.required}/${jobRequirements.requiredSkills.length} required, ${formatted.skillsMatch.preferred}/${jobRequirements.preferredSkills.length} preferred`);
            console.log(`   📦 Repositories: ${formatted.repositories} public repos`);
            console.log(`   ⭐ Stars: ${formatted.experience.totalStars}`);
            console.log(`   👥 Followers: ${formatted.followers}`);
            console.log(`   🔗 Profile: ${formatted.profile}`);
            console.log(`   💼 Hireable: ${formatted.hireable ? 'Yes' : 'No'}`);
            console.log(`   🎯 Top Skills: ${formatted.skills.slice(0, 5).join(', ')}`);
            console.log('');
        });
        
        // Save results
        const fs = await import('fs/promises');
        const results = {
            jobRequirements,
            searchDate: new Date().toISOString(),
            totalCandidates: candidates.length,
            candidates: candidates.map(c => crawler.formatCandidateOutput(c))
        };
        
        await fs.writeFile(
            './data/example-candidates.json', 
            JSON.stringify(results, null, 2)
        );
        
        console.log('💾 Results saved to ./data/example-candidates.json');
        console.log('=' .repeat(60));
        console.log('🎉 Search completed successfully!');
        
        // Show summary statistics
        const hireableCount = candidates.filter(c => c.hireable).length;
        const avgScore = Math.round(candidates.reduce((sum, c) => sum + c.score, 0) / candidates.length);
        
        console.log('');
        console.log('📊 Summary:');
        console.log(`   • Total candidates found: ${candidates.length}`);
        console.log(`   • Average score: ${avgScore}/100`);
        console.log(`   • Hireable candidates: ${hireableCount}`);
        console.log(`   • Senior level candidates: ${candidates.filter(c => c.experience.level === 'senior').length}`);
        
    } catch (error) {
        console.error('❌ Error finding candidates:', error.message);
        
        if (error.message.includes('rate limit')) {
            console.log('');
            console.log('💡 Rate limit exceeded. To fix this:');
            console.log('   1. Add a GitHub token to your .env file:');
            console.log('      GITHUB_TOKEN=your_github_token_here');
            console.log('   2. Get a token from: https://github.com/settings/tokens');
            console.log('   3. Wait an hour and try again');
        }
        
        process.exit(1);
    }
}

// Function to use with custom job requirements
async function findCandidatesWithCustomRequirements(customJobRequirements) {
    const crawler = new GitHubCrawler();
    const candidates = await crawler.searchCandidates(customJobRequirements);
    return candidates.map(c => crawler.formatCandidateOutput(c));
}

// Run if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
    findCandidatesForYourJob();
}

export { findCandidatesForYourJob, findCandidatesWithCustomRequirements };
