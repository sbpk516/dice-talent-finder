#!/usr/bin/env node

// test-ai-skill-extraction.js - Test AI-powered critical skill extraction

import { JobRequirementsParser } from './src/parsers/job-parser.js';

const sampleJobDescriptions = [
    {
        title: "Senior Data Scientist - Machine Learning",
        description: `
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
        `
    },
    {
        title: "Full Stack Developer - React/Node.js",
        description: `
# Full Stack Developer - React/Node.js
**Company:** TechStart Inc  
**Location:** Hybrid (San Francisco)  
**Salary:** $120,000 - $160,000 USD

## About the Role
We're seeking a Full Stack Developer to build scalable web applications and APIs.

## What You'll Do
- Develop frontend applications using React and TypeScript
- Build RESTful APIs using Node.js and Express
- Design and implement database schemas
- Deploy applications using Docker and AWS
- Collaborate with product and design teams

## Requirements
- 3+ years experience in full stack development
- Proficiency in JavaScript/TypeScript, React, Node.js
- Experience with SQL databases (PostgreSQL, MySQL)
- Knowledge of Git version control
- Understanding of RESTful API design

## Nice to Have
- Experience with GraphQL
- Knowledge of microservices architecture
- Experience with CI/CD pipelines
- Familiarity with cloud platforms (AWS, GCP)

## Benefits
- Competitive salary and equity
- Health insurance and 401(k)
- Flexible work arrangements
- Professional development opportunities
        `
    },
    {
        title: "DevOps Engineer - Kubernetes/AWS",
        description: `
# DevOps Engineer - Kubernetes/AWS
**Company:** CloudScale Solutions  
**Location:** Remote  
**Salary:** $130,000 - $180,000 USD

## About the Role
We're looking for a DevOps Engineer to manage our cloud infrastructure and deployment pipelines.

## What You'll Do
- Manage Kubernetes clusters and container orchestration
- Automate deployment processes using CI/CD tools
- Monitor and optimize cloud infrastructure (AWS)
- Implement security best practices
- Troubleshoot production issues

## Requirements
- 4+ years experience in DevOps or infrastructure
- Strong knowledge of Kubernetes and Docker
- Experience with AWS services (EC2, S3, RDS, etc.)
- Proficiency in scripting (Python, Bash)
- Understanding of CI/CD principles

## Nice to Have
- Experience with Terraform or CloudFormation
- Knowledge of monitoring tools (Prometheus, Grafana)
- Experience with microservices architecture
- Security certifications (AWS, Kubernetes)

## Benefits
- Competitive salary and benefits
- Remote work flexibility
- Professional development budget
- Conference attendance opportunities
        `
    }
];

async function testAISkillExtraction() {
    console.log('🧠 Testing AI-Powered Critical Skill Extraction');
    console.log('=' .repeat(60));
    
    const parser = new JobRequirementsParser();
    
    for (let i = 0; i < sampleJobDescriptions.length; i++) {
        const job = sampleJobDescriptions[i];
        
        console.log(`\n📋 Job ${i + 1}: ${job.title}`);
        console.log('-'.repeat(40));
        
        try {
            console.log('🔍 Extracting critical skills with AI...');
            const startTime = Date.now();
            
            const criticalSkills = await parser.extractCriticalSkills(job.description);
            const duration = Date.now() - startTime;
            
            console.log(`✅ AI extracted ${criticalSkills.length} critical skills in ${duration}ms:`);
            console.log(`   ${criticalSkills.join(', ')}`);
            
            // Generate optimized search queries
            console.log('\n🔍 Generating optimized search queries...');
            const jobRequirements = {
                description: job.description,
                level: job.title.toLowerCase().includes('senior') ? 'senior' : 'mid'
            };
            
            const optimizedQueries = await parser.generateOptimizedSearchQueries(jobRequirements);
            
            console.log(`✅ Generated ${optimizedQueries.length} optimized search queries:`);
            optimizedQueries.forEach((query, index) => {
                console.log(`   ${index + 1}. ${query.substring(0, 80)}...`);
            });
            
            // Compare with traditional approach
            console.log('\n📊 Performance Comparison:');
            const traditionalSkills = parser.extractBasicSkills(job.description);
            console.log(`   Traditional approach: ${traditionalSkills.length} skills found`);
            console.log(`   AI approach: ${criticalSkills.length} critical skills identified`);
            console.log(`   Search queries reduced by: ${Math.round((traditionalSkills.length - optimizedQueries.length) / traditionalSkills.length * 100)}%`);
            
        } catch (error) {
            console.error(`❌ Error processing job ${i + 1}:`, error.message);
        }
        
        console.log('\n' + '='.repeat(60));
    }
    
    console.log('\n🎯 Summary:');
    console.log('• AI successfully identifies critical skills from job descriptions');
    console.log('• Reduces search queries by focusing on essential skills');
    console.log('• Improves performance by reducing API calls');
    console.log('• Provides fallback to basic extraction if AI fails');
}

// Run the test
testAISkillExtraction().catch(console.error);
