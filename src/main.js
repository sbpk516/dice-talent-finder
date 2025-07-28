// src/main.js - Simple entry point for AI job parsing

import { JobRequirementsParser } from './parsers/job-parser.js';
import sampleJobs from '../tests/sample-jobs.js';

async function main() {
    try {
        // Get the single job description
        const jobDescription = sampleJobs.jobDescription;
        
        // Create parser instance
        const parser = new JobRequirementsParser();
        
        // Parse job description with AI
        const result = await parser.parseJobDescription(jobDescription);
        
        // Output structured JSON
        console.log(JSON.stringify(result, null, 2));
        
    } catch (error) {
        console.error('Error parsing job description:', error.message);
        process.exit(1);
    }
}

// Run the main function
main(); 