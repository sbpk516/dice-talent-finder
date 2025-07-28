// src/parsers/job-parser.js

class JobRequirementsParser {
    constructor(llmClient = null) {
        // Lazy initialization to avoid circular dependency
        this.llmClient = llmClient;
        this.extractionPrompt = `
You are an expert job requirements analyzer. Parse the following job description and extract structured information.

Return a JSON object with the following structure:
{
    "title": "exact job title",
    "level": "junior|mid|senior|lead|principal",
    "yearsExperience": {
        "min": number,
        "max": number
    },
    "location": {
        "type": "remote|hybrid|onsite",
        "city": "city name or null",
        "state": "state or null",
        "country": "country or USA"
    },
    "salary": {
        "min": number,
        "max": number,
        "currency": "USD",
        "period": "yearly|hourly"
    },
    "requiredSkills": ["skill1", "skill2"],
    "preferredSkills": ["skill1", "skill2"],
    "benefits": ["benefit1", "benefit2"],
    "companyInfo": {
        "name": "company name",
        "size": "startup|small|medium|large|enterprise",
        "industry": "industry name"
    }
}

Job Description:
`;
    }

    // Initialize LLM client when needed
    async initializeLLM() {
        if (!this.llmClient) {
            try {
                // Dynamic import to avoid circular dependency
                const { LLMClient } = await import('../utils/llm-client.js');
                this.llmClient = new LLMClient();
            } catch (error) {
                console.warn('LLM client not available, using fallback parsing');
                this.llmClient = null;
            }
        }
    }

    async parseJobDescription(jobDescription) {
        await this.initializeLLM();
        
        if (!this.llmClient) {
            throw new Error('LLM client not available. AI-based parsing is required.');
        }
        
        return await this.parseWithAI(jobDescription);
    }

    async parseWithAI(jobDescription) {
        try {
            const prompt = this.extractionPrompt + jobDescription;
            const response = await this.llmClient.generateResponse(prompt);
            
            // Clean response and parse JSON
            const cleanedResponse = this.cleanJsonResponse(response);
            const parsed = JSON.parse(cleanedResponse);
            
            // Validate and enhance the parsed data
            return this.validateAndEnhance(parsed, jobDescription);
            
        } catch (error) {
            console.error('AI parsing failed:', error.message);
            throw new Error(`AI parsing failed: ${error.message}`);
        }
    }





    cleanJsonResponse(response) {
        // Remove markdown code blocks and extra text
        let cleaned = response.trim();
        
        // Remove markdown code blocks
        cleaned = cleaned.replace(/```json\s*/g, '').replace(/```\s*/g, '');
        
        // Find JSON object boundaries
        const start = cleaned.indexOf('{');
        const end = cleaned.lastIndexOf('}');
        
        if (start !== -1 && end !== -1) {
            cleaned = cleaned.substring(start, end + 1);
        }
        
        return cleaned;
    }

    validateAndEnhance(parsed, originalText) {
        // Ensure all required fields exist with defaults
        const defaults = {
            title: 'Software Developer',
            level: 'mid',
            yearsExperience: { min: 2, max: 5 },
            location: { type: 'onsite', city: null, state: null, country: 'USA' },
            salary: null,
            requiredSkills: [],
            preferredSkills: [],
            benefits: [],
            companyInfo: { name: null, size: 'medium', industry: 'Technology' }
        };

        // Merge with defaults
        const result = { ...defaults, ...parsed };
        
        // Validate salary range
        if (result.salary && result.salary.min > result.salary.max) {
            [result.salary.min, result.salary.max] = [result.salary.max, result.salary.min];
        }

        // Validate experience range
        if (result.yearsExperience.min > result.yearsExperience.max) {
            [result.yearsExperience.min, result.yearsExperience.max] = [result.yearsExperience.max, result.yearsExperience.min];
        }

        return result;
    }

    // Utility method to create a search query from parsed requirements
    generateSearchQuery(requirements) {
        const { title, requiredSkills, location, level } = requirements;
        
        let query = title;
        
        if (requiredSkills.length > 0) {
            query += ' ' + requiredSkills.slice(0, 3).join(' ');
        }
        
        if (level && level !== 'mid') {
            query += ' ' + level;
        }
        
        if (location.city) {
            query += ' ' + location.city;
        }
        
        return query.trim();
    }
}

// Export for use in other modules
export { JobRequirementsParser };