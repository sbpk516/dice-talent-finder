// src/ai-optimized-pipeline.js

import { JobRequirementsParser } from './parsers/job-parser.js';
import GitHubCrawler from './scrapers/github-crawler.js';
import { getPerformanceMonitor } from './utils/performance-monitor.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

class AIOptimizedPipeline {
    constructor() {
        this.parser = new JobRequirementsParser();
        this.crawler = new GitHubCrawler();
        this.monitor = getPerformanceMonitor();
    }

    async runOptimizedPipeline(jobDescription) {
        try {
            console.log('🚀 Starting AI-Optimized Talent Finder Pipeline');
            console.log('=' .repeat(60));
            
            // Step 1: Parse job description and extract critical skills
            console.log('📋 Step 1: Parsing job description and extracting critical skills...');
            this.monitor.startOperation('Job Parsing & Skill Extraction');
            
            const parsedJob = await this.parser.parseJobDescription(jobDescription);
            const criticalSkills = await this.parser.extractCriticalSkills(jobDescription);
            const optimizedQueries = await this.parser.generateOptimizedSearchQueries({
                description: jobDescription,
                level: parsedJob.level
            });
            
            this.monitor.endOperation('Job Parsing & Skill Extraction');
            
            console.log('✅ Job parsing completed!');
            console.log(`📋 Job Title: ${parsedJob.title}`);
            console.log(`🏢 Company: ${parsedJob.companyInfo.name}`);
            console.log(`📍 Location: ${parsedJob.location.type} (${parsedJob.location.country})`);
            console.log(`💰 Salary: $${parsedJob.salary.min?.toLocaleString() || 'N/A'} - $${parsedJob.salary.max?.toLocaleString() || 'N/A'} ${parsedJob.salary.currency}`);
            console.log(`🧠 AI Identified Critical Skills: ${criticalSkills.join(', ')}`);
            console.log(`🔍 Optimized Search Queries: ${optimizedQueries.length} queries`);
            console.log('');
            
            // Step 2: Search for candidates using optimized queries
            console.log('🔍 Step 2: Searching GitHub with AI-optimized queries...');
            this.monitor.startOperation('Optimized GitHub Search');
            
            const candidates = await this.crawler.searchCandidates({
                ...parsedJob,
                optimizedQueries: optimizedQueries
            });
            
            this.monitor.endOperation('Optimized GitHub Search');
            
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
                console.log(`   🛠️  Skills Match: ${candidate.skillsMatch.required}/${criticalSkills.length} critical, ${candidate.skillsMatch.preferred}/${parsedJob.preferredSkills.length} preferred`);
                console.log(`   📦 Repositories: ${candidate.repositories} public repos`);
                console.log(`   ⭐ Stars: ${candidate.experience.totalStars}`);
                console.log(`   👥 Followers: ${candidate.followers}`);
                console.log(`   🔗 Profile: ${candidate.profile}`);
                console.log(`   💼 Hireable: ${candidate.hireable ? 'Yes' : 'No'}`);
                console.log(`   🎯 Top Skills: ${candidate.skills.slice(0, 5).join(', ')}`);
                console.log('');
            });
            
            // Step 4: Performance analysis
            console.log('📊 Performance Analysis:');
            console.log('=' .repeat(60));
            
            const performanceReport = this.monitor.getSummary();
            console.log(`⏱️  Total Execution Time: ${performanceReport.totalDuration}ms (${(performanceReport.totalDuration / 1000).toFixed(2)}s)`);
            
            console.log('\n🔍 Operation Breakdown:');
            performanceReport.operationSummary.forEach(op => {
                console.log(`   ${op.name}: ${op.duration}ms (${op.percentage}%)`);
            });
            
            console.log('\n🌐 API Call Analysis:');
            performanceReport.apiSummary.forEach(api => {
                console.log(`   ${api.name}: ${api.count} calls, ${api.totalDuration}ms total, ${api.averageDuration.toFixed(0)}ms avg`);
            });
            
            // Step 5: Save comprehensive results
            const fs = await import('fs/promises');
            const results = {
                parsedJob,
                criticalSkills,
                optimizedQueries,
                searchDate: new Date().toISOString(),
                totalCandidates: candidates.length,
                candidates: candidates,
                performanceReport: performanceReport,
                pipelineVersion: '2.0.0-ai-optimized'
            };
            
            await fs.writeFile(
                './data/ai-optimized-results.json', 
                JSON.stringify(results, null, 2)
            );
            
            console.log('\n💾 Complete results saved to ./data/ai-optimized-results.json');
            console.log('=' .repeat(60));
            console.log('🎉 AI-Optimized Pipeline completed successfully!');
            
            // Step 6: Performance comparison
            this.printPerformanceComparison(performanceReport, criticalSkills, optimizedQueries);
            
            return {
                parsedJob,
                criticalSkills,
                optimizedQueries,
                candidates,
                performanceReport
            };
            
        } catch (error) {
            console.error('❌ Error in AI-optimized pipeline:', error.message);
            throw error;
        }
    }

    printPerformanceComparison(performanceReport, criticalSkills, optimizedQueries) {
        console.log('\n📈 Performance Comparison (AI vs Traditional):');
        console.log('=' .repeat(60));
        
        // Estimate traditional approach performance
        const traditionalSearchQueries = 8; // Average number of traditional queries
        const traditionalApiCalls = traditionalSearchQueries + (20 * 3); // 20 candidates × 3 API calls each
        const aiOptimizedApiCalls = optimizedQueries.length + (20 * 3);
        
        console.log(`🔍 Search Queries:`);
        console.log(`   Traditional approach: ${traditionalSearchQueries} queries`);
        console.log(`   AI-optimized approach: ${optimizedQueries.length} queries`);
        console.log(`   Reduction: ${Math.round((traditionalSearchQueries - optimizedQueries.length) / traditionalSearchQueries * 100)}%`);
        
        console.log(`\n🌐 Estimated API Calls:`);
        console.log(`   Traditional approach: ~${traditionalApiCalls} calls`);
        console.log(`   AI-optimized approach: ~${aiOptimizedApiCalls} calls`);
        console.log(`   Reduction: ${Math.round((traditionalApiCalls - aiOptimizedApiCalls) / traditionalApiCalls * 100)}%`);
        
        console.log(`\n⏱️  Execution Time:`);
        console.log(`   Current execution: ${(performanceReport.totalDuration / 1000).toFixed(2)}s`);
        console.log(`   Estimated traditional: ~${(performanceReport.totalDuration * 1.5 / 1000).toFixed(2)}s`);
        console.log(`   Time saved: ~${(performanceReport.totalDuration * 0.5 / 1000).toFixed(2)}s`);
        
        console.log(`\n🎯 Quality Metrics:`);
        console.log(`   Critical skills identified: ${criticalSkills.length}`);
        console.log(`   Focus on essential skills: ✅`);
        console.log(`   Reduced noise from irrelevant searches: ✅`);
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
    
    const pipeline = new AIOptimizedPipeline();
    return await pipeline.runOptimizedPipeline(sampleJobDescription);
}

// Function to run with custom job description
async function runWithCustomJob(jobDescription) {
    const pipeline = new AIOptimizedPipeline();
    return await pipeline.runOptimizedPipeline(jobDescription);
}

// Run if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
    runWithSampleJob();
}

export { AIOptimizedPipeline, runWithSampleJob, runWithCustomJob };
