// src/github-talent-finder.js

import GitHubCrawler from './scrapers/github-crawler.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Sample job requirements (you can replace this with your parsed job data)
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

async function findCandidates() {
    try {
        console.log('🚀 Starting GitHub Talent Finder...');
        console.log(`📋 Job Title: ${jobRequirements.title}`);
        console.log(`🏢 Company: ${jobRequirements.companyInfo.name}`);
        console.log(`📍 Location: ${jobRequirements.location.type} (${jobRequirements.location.country})`);
        console.log(`💰 Salary: $${jobRequirements.salary.min.toLocaleString()} - $${jobRequirements.salary.max.toLocaleString()} ${jobRequirements.salary.currency}`);
        console.log(`📚 Required Skills: ${jobRequirements.requiredSkills.join(', ')}`);
        console.log('');

        // Initialize GitHub crawler
        const crawler = new GitHubCrawler();
        
        // Search for candidates
        const candidates = await crawler.searchCandidates(jobRequirements);
        
        if (candidates.length === 0) {
            console.log('❌ No suitable candidates found.');
            return;
        }
        
        console.log(`✅ Found ${candidates.length} potential candidates:`);
        console.log('');
        
        // Display top candidates
        candidates.forEach((candidate, index) => {
            const formatted = crawler.formatCandidateOutput(candidate);
            
            console.log(`🏆 #${index + 1} - ${formatted.name} (@${formatted.username})`);
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
        
        // Save results to file
        const fs = await import('fs/promises');
        const results = {
            jobRequirements,
            searchDate: new Date().toISOString(),
            totalCandidates: candidates.length,
            candidates: candidates.map(c => crawler.formatCandidateOutput(c))
        };
        
        await fs.writeFile(
            './data/github-candidates.json', 
            JSON.stringify(results, null, 2)
        );
        
        console.log('💾 Results saved to ./data/github-candidates.json');
        
    } catch (error) {
        console.error('❌ Error finding candidates:', error.message);
        process.exit(1);
    }
}

// Function to use with parsed job data from your existing parser
async function findCandidatesForJob(parsedJobData) {
    try {
        console.log('🚀 Starting GitHub Talent Finder for parsed job...');
        
        const crawler = new GitHubCrawler();
        const candidates = await crawler.searchCandidates(parsedJobData);
        
        return candidates.map(c => crawler.formatCandidateOutput(c));
        
    } catch (error) {
        console.error('❌ Error finding candidates:', error.message);
        throw error;
    }
}

// Run if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
    findCandidates();
}

export { findCandidates, findCandidatesForJob };
