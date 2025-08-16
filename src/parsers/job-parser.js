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

    // AI-powered method to identify critical skills from job description
    async extractCriticalSkills(jobDescription) {
        await this.initializeLLM();
        
        if (!this.llmClient) {
            throw new Error('LLM client not available for skill extraction');
        }
        
        const prompt = `
You are an expert technical recruiter. Analyze this job description and identify ONLY the 3-5 most critical technical skills that are absolutely essential for this role.

IMPORTANT: Focus on ADVANCED libraries/frameworks that imply foundational knowledge, not basic programming languages.

For example:
- If job mentions "Python, pandas, numpy, TensorFlow" → choose "TensorFlow" (implies Python, pandas, numpy)
- If job mentions "JavaScript, React, Node.js" → choose "React" and "Node.js" (implies JavaScript)
- If job mentions "Java, Spring, Hibernate" → choose "Spring" (implies Java)
- If job mentions "SQL, PostgreSQL, AWS" → choose "PostgreSQL" and "AWS" (implies SQL)

Focus on:
- Advanced ML/AI frameworks (TensorFlow, PyTorch, scikit-learn)
- Modern web frameworks (React, Vue, Angular, Django, FastAPI)
- Cloud platforms (AWS, Azure, GCP)
- Advanced databases (PostgreSQL, MongoDB, Redis)
- DevOps tools (Docker, Kubernetes, Jenkins)

AVOID basic programming languages unless they are the ONLY requirement.

Job Description:
${jobDescription}

Return ONLY a JSON array of skill names, no explanations:
["skill1", "skill2", "skill3", "skill4", "skill5"]
`;

        try {
            const response = await this.llmClient.generateResponse(prompt);
            const cleanedResponse = this.cleanJsonResponse(response);
            const skills = JSON.parse(cleanedResponse);
            
            // Validate and limit to 5 skills maximum
            if (Array.isArray(skills)) {
                return skills.slice(0, 5).filter(skill => 
                    typeof skill === 'string' && skill.trim().length > 0
                );
            }
            
            throw new Error('Invalid skills format returned by AI');
            
        } catch (error) {
            console.error('AI skill extraction failed:', error.message);
            // Fallback to basic skill extraction
            return this.extractBasicSkills(jobDescription);
        }
    }

    // Fallback method for basic skill extraction
    extractBasicSkills(jobDescription) {
        const skillKeywords = [
            'python', 'javascript', 'java', 'typescript', 'react', 'vue', 'angular',
            'node.js', 'express', 'django', 'flask', 'fastapi', 'tensorflow', 'pytorch',
            'pandas', 'numpy', 'scikit-learn', 'sql', 'postgresql', 'mysql', 'mongodb',
            'docker', 'kubernetes', 'aws', 'azure', 'gcp', 'machine learning', 'ml',
            'data science', 'deep learning', 'neural networks', 'mlops', 'ci/cd'
        ];
        
        const lowerDesc = jobDescription.toLowerCase();
        const foundSkills = skillKeywords.filter(skill => lowerDesc.includes(skill));
        
        return foundSkills.slice(0, 5); // Return top 5 found skills
    }

    // Enhanced method to create optimized search queries
    async generateOptimizedSearchQueries(jobRequirements) {
        let criticalSkills;
        
        if (jobRequirements.description) {
            // Use AI to identify critical skills
            criticalSkills = await this.extractCriticalSkills(jobRequirements.description);
        } else {
            // Use existing required skills if no description available
            criticalSkills = jobRequirements.requiredSkills.slice(0, 5);
        }
        
        const queries = [];
        
        // Create intelligent search queries for each critical skill
        for (const skill of criticalSkills) {
            let query = `${skill}`;
            
            // Add implied foundational skills based on advanced frameworks
            const impliedSkills = this.getImpliedSkills(skill);
            if (impliedSkills.length > 0) {
                query += ` ${impliedSkills.join(' ')}`;
            }
            
            // Add language filters based on the skill type
            const languageFilters = this.getLanguageFilters(skill);
            if (languageFilters.length > 0) {
                query += ` ${languageFilters.join(' ')}`;
            }
            
            // Add experience level filters
            if (jobRequirements.level === 'senior') {
                query += ' followers:>100 created:>2018';
            } else if (jobRequirements.level === 'mid') {
                query += ' followers:>50 created:>2020';
            }
            
            queries.push(query);
        }
        
        // Add a general experience-based query if we have level info
        if (jobRequirements.level && criticalSkills.length > 0) {
            if (jobRequirements.level === 'senior') {
                queries.push('followers:>100 created:>2018');
            } else if (jobRequirements.level === 'mid') {
                queries.push('followers:>50 created:>2020');
            }
        }
        
        return queries;
    }

    // Helper method to get implied foundational skills
    getImpliedSkills(advancedSkill) {
        const skillMap = {
            // ML/AI Frameworks
            'tensorflow': ['python', 'numpy', 'pandas'],
            'pytorch': ['python', 'numpy', 'pandas'],
            'scikit-learn': ['python', 'numpy', 'pandas'],
            'keras': ['python', 'tensorflow'],
            
            // Web Frameworks
            'react': ['javascript', 'html', 'css'],
            'vue': ['javascript', 'html', 'css'],
            'angular': ['typescript', 'javascript', 'html', 'css'],
            'django': ['python', 'sql'],
            'flask': ['python', 'sql'],
            'fastapi': ['python', 'sql'],
            'express': ['javascript', 'node.js'],
            'spring': ['java', 'sql'],
            
            // Cloud Platforms
            'aws': ['python', 'javascript', 'sql'],
            'azure': ['python', 'javascript', 'sql'],
            'gcp': ['python', 'javascript', 'sql'],
            
            // Databases
            'postgresql': ['sql', 'python'],
            'mongodb': ['javascript', 'python'],
            'redis': ['python', 'javascript'],
            
            // DevOps
            'docker': ['python', 'javascript', 'bash'],
            'kubernetes': ['yaml', 'bash', 'python'],
            'jenkins': ['bash', 'python', 'javascript']
        };
        
        const lowerSkill = advancedSkill.toLowerCase();
        return skillMap[lowerSkill] || [];
    }

    // Helper method to get appropriate language filters
    getLanguageFilters(skill) {
        const languageMap = {
            // Python-based frameworks
            'tensorflow': ['language:Python'],
            'pytorch': ['language:Python'],
            'scikit-learn': ['language:Python'],
            'django': ['language:Python'],
            'flask': ['language:Python'],
            'fastapi': ['language:Python'],
            
            // JavaScript-based frameworks
            'react': ['language:JavaScript', 'language:TypeScript'],
            'vue': ['language:JavaScript', 'language:TypeScript'],
            'angular': ['language:TypeScript', 'language:JavaScript'],
            'express': ['language:JavaScript'],
            'node.js': ['language:JavaScript'],
            
            // Java-based frameworks
            'spring': ['language:Java'],
            
            // Cloud platforms (multi-language)
            'aws': ['language:Python', 'language:JavaScript', 'language:Java'],
            'azure': ['language:Python', 'language:JavaScript', 'language:Java'],
            'gcp': ['language:Python', 'language:JavaScript', 'language:Java']
        };
        
        const lowerSkill = skill.toLowerCase();
        return languageMap[lowerSkill] || ['language:JavaScript', 'language:Python', 'language:Java', 'language:TypeScript'];
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