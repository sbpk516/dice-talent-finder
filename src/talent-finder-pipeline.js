// src/talent-finder-pipeline.js

import { JobRequirementsParser } from './parsers/job-parser.js';
import { findCandidatesForJob } from './github-talent-finder.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function runTalentFinderPipeline(jobDescription) {
    try {
        console.log('🚀 Starting Talent Finder Pipeline...');
        console.log('=' .repeat(60));
        
        // Step 1: Parse job description
        console.log('📋 Step 1: Parsing job description with AI...');
        const parser = new JobRequirementsParser();
        const parsedJob = await parser.parseJobDescription(jobDescription);
        
        console.log('✅ Job parsing completed!');
        console.log(`📋 Job Title: ${parsedJob.title}`);
        console.log(`🏢 Company: ${parsedJob.companyInfo.name}`);
        console.log(`📍 Location: ${parsedJob.location.type} (${parsedJob.location.country})`);
        console.log(`💰 Salary: $${parsedJob.salary.min?.toLocaleString() || 'N/A'} - $${parsedJob.salary.max?.toLocaleString() || 'N/A'} ${parsedJob.salary.currency}`);
        console.log(`📚 Required Skills: ${parsedJob.requiredSkills.join(', ')}`);
        console.log('');
        
        // Step 2: Find candidates on GitHub
        console.log('🔍 Step 2: Searching GitHub for suitable candidates...');
        const candidates = await findCandidatesForJob(parsedJob);
        
        console.log(`✅ Found ${candidates.length} potential candidates!`);
        console.log('');
        
        // Step 3: Display results
        console.log('🏆 Top Candidates:');
        console.log('=' .repeat(60));
        
        candidates.slice(0, 10).forEach((candidate, index) => {
            console.log(`#${index + 1} - ${candidate.name} (@${candidate.username})`);
            console.log(`   📊 Score: ${candidate.score}/100`);
            console.log(`   📍 Location: ${candidate.location || 'Not specified'}`);
            console.log(`   💼 Experience: ${candidate.experience.level} (${candidate.experience.yearsSinceJoin} years on GitHub)`);
            console.log(`   🛠️  Skills Match: ${candidate.skillsMatch.required}/${parsedJob.requiredSkills.length} required, ${candidate.skillsMatch.preferred}/${parsedJob.preferredSkills.length} preferred`);
            console.log(`   📦 Repositories: ${candidate.repositories} public repos`);
            console.log(`   ⭐ Stars: ${candidate.experience.totalStars}`);
            console.log(`   👥 Followers: ${candidate.followers}`);
            console.log(`   🔗 Profile: ${candidate.profile}`);
            console.log(`   💼 Hireable: ${candidate.hireable ? 'Yes' : 'No'}`);
            console.log(`   🎯 Top Skills: ${candidate.skills.slice(0, 5).join(', ')}`);
            console.log('');
        });
        
        // Step 4: Save comprehensive results
        const fs = await import('fs/promises');
        const results = {
            parsedJob,
            searchDate: new Date().toISOString(),
            totalCandidates: candidates.length,
            candidates: candidates,
            pipelineVersion: '1.0.0'
        };
        
        await fs.writeFile(
            './data/talent-finder-results.json', 
            JSON.stringify(results, null, 2)
        );
        
        console.log('💾 Complete results saved to ./data/talent-finder-results.json');
        console.log('=' .repeat(60));
        console.log('🎉 Talent Finder Pipeline completed successfully!');
        
        return {
            parsedJob,
            candidates,
            results
        };
        
    } catch (error) {
        console.error('❌ Error in talent finder pipeline:', error.message);
        throw error;
    }
}

// Function to run with sample job description
async function runWithSampleJob() {
    const sampleJobDescription = `
# Senior Data Scientist - Machine Learning
**Company:** DataFlow Analytics  
**Location:** Remote (US-based)  
**Salary:** $150,000 - $200,000 USD + equity

## About the Role
We're looking for a Senior Data Scientist to lead our ML initiatives and build predictive models that drive business decisions.

## What You'll Do
- Develop and deploy machine learning models in production
- Analyze large datasets to uncover insights and patterns
- Collaborate with engineering teams to integrate ML solutions
- Mentor junior data scientists and analysts
- Present findings to stakeholders and executives

## Requirements
- 5+ years experience in data science or ML engineering
- Strong Python skills (pandas, scikit-learn, TensorFlow/PyTorch)
- Experience with SQL and data warehousing
- Knowledge of statistical analysis and experimental design
- Experience with cloud platforms (AWS, GCP, or Azure)

## Nice to Have
- Experience with MLOps and model deployment
- Knowledge of deep learning and neural networks
- Experience with real-time data processing (Kafka, Spark)
- Background in A/B testing and causal inference

## Benefits
- Competitive salary with equity participation
- Comprehensive health, dental, and vision coverage
- 401(k) with company match
- Flexible work schedule and unlimited PTO
- Professional development budget
- Home office setup allowance

Join us in transforming data into actionable insights!
    `;
    
    return await runTalentFinderPipeline(sampleJobDescription);
}

// Function to run with custom job description
async function runWithCustomJob(jobDescription) {
    return await runTalentFinderPipeline(jobDescription);
}

// Run if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
    runWithSampleJob();
}

export { runTalentFinderPipeline, runWithSampleJob, runWithCustomJob };
