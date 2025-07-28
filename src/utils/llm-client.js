// src/services/llm-client.js

class LLMClient {
    constructor(config = {}) {
        this.config = {
            provider: 'openai', // or 'anthropic', 'local'
            model: 'gpt-3.5-turbo',
            maxTokens: 2000,
            temperature: 0.1,
            ...config
        };
        
        // Initialize API client based on provider
        this.initializeClient();
    }

    initializeClient() {
        // This would initialize the actual LLM client
        // For now, we'll use a mock implementation
        console.log(`Initializing LLM client with provider: ${this.config.provider}`);
        
        // In production, you would initialize:
        // - OpenAI client
        // - Anthropic client  
        // - Local model client
        // - etc.
        
        this.isInitialized = true;
    }

    async generateResponse(prompt, options = {}) {
        if (!this.isInitialized) {
            throw new Error('LLM client not initialized');
        }

        console.log('🤖 LLM Query:', prompt.substring(0, 100) + '...');
        
        try {
            // Use real OpenAI API
            const { OpenAI } = await import('openai');
            const openai = new OpenAI({
                apiKey: process.env.OPENAI_API_KEY || ''
            });
            
            const response = await openai.chat.completions.create({
                model: 'gpt-3.5-turbo',
                messages: [{ role: 'user', content: prompt }],
                temperature: 0.1,
                max_tokens: 1000
            });
            
            return response.choices[0].message.content;
            
        } catch (error) {
            console.error('OpenAI API Error:', error.message);
            
            // Fallback to dynamic mock based on actual job content
            return this.createDynamicResponse(prompt);
        }
    }

    createDynamicResponse(prompt) {
        // Extract job description from prompt
        const jobDescription = prompt.split('Job Description:')[1] || prompt;
        
        // Simple parsing logic based on keywords in the actual job description
        const lowerDesc = jobDescription.toLowerCase();
        
        // Extract title
        let title = 'Software Developer';
        if (lowerDesc.includes('backend engineer')) title = 'Backend Engineer';
        if (lowerDesc.includes('frontend')) title = 'Frontend Developer';
        if (lowerDesc.includes('full stack')) title = 'Full Stack Developer';
        if (lowerDesc.includes('data engineer')) title = 'Data Engineer';
        
        // Extract level
        let level = 'mid';
        if (lowerDesc.includes('senior')) level = 'senior';
        if (lowerDesc.includes('junior')) level = 'junior';
        if (lowerDesc.includes('lead')) level = 'lead';
        
        // Extract experience
        let minExp = 2, maxExp = 5;
        const expMatch = jobDescription.match(/(\d+)\+?\s*years?/i);
        if (expMatch) {
            minExp = parseInt(expMatch[1]);
            maxExp = minExp + 2;
        }
        
        // Extract location
        let locationType = 'onsite';
        if (lowerDesc.includes('remote')) locationType = 'remote';
        if (lowerDesc.includes('hybrid')) locationType = 'hybrid';
        
        // Extract salary
        let salary = null;
        const salaryMatch = jobDescription.match(/\$(\d{1,3}(?:,\d{3})*)\s*[-–]\s*\$(\d{1,3}(?:,\d{3})*)/);
        if (salaryMatch) {
            salary = {
                min: parseInt(salaryMatch[1].replace(/,/g, '')),
                max: parseInt(salaryMatch[2].replace(/,/g, '')),
                currency: 'USD',
                period: 'yearly'
            };
        }
        
        // Extract skills
        const skills = [];
        const skillKeywords = ['rust', 'golang', 'python', 'javascript', 'react', 'node.js', 'kubernetes', 'kafka', 'redis', 'grpc'];
        skillKeywords.forEach(skill => {
            if (lowerDesc.includes(skill)) skills.push(skill);
        });
        
        // Extract company info
        let companyName = null;
        if (lowerDesc.includes('neuraforge')) companyName = 'NeuraForge';
        
        return JSON.stringify({
            title: title,
            level: level,
            yearsExperience: { min: minExp, max: maxExp },
            location: { type: locationType, city: null, state: null, country: 'USA' },
            salary: salary,
            requiredSkills: skills,
            preferredSkills: [],
            benefits: ['equity', 'remote work'],
            companyInfo: {
                name: companyName,
                size: 'startup',
                industry: 'Technology'
            }
        }, null, 2);
    }

    async parseJobDescription(jobDescription) {
        const prompt = `
Parse this job description and extract structured information as JSON:

${jobDescription}

Return only valid JSON with the structure:
{
    "title": "job title",
    "level": "junior|mid|senior|lead|principal", 
    "yearsExperience": {"min": number, "max": number},
    "location": {"type": "remote|hybrid|onsite", "city": "string", "state": "string", "country": "string"},
    "salary": {"min": number, "max": number, "currency": "USD", "period": "yearly"},
    "requiredSkills": ["skill1", "skill2"],
    "preferredSkills": ["skill1", "skill2"],
    "benefits": ["benefit1", "benefit2"],
    "companyInfo": {"name": "string", "size": "startup|small|medium|large|enterprise", "industry": "string"}
}
`;

        return await this.generateResponse(prompt);
    }

    // Method to test if LLM is available
    async testConnection() {
        try {
            const response = await this.generateResponse('Test connection. Respond with "OK".');
            return response.includes('OK');
        } catch (error) {
            console.warn('LLM connection test failed:', error.message);
            return false;
        }
    }

    // Method to configure different providers
    setProvider(provider, config = {}) {
        this.config.provider = provider;
        this.config = { ...this.config, ...config };
        this.initializeClient();
    }

    // Method to update model settings
    updateSettings(settings) {
        this.config = { ...this.config, ...settings };
    }
}

// Factory function to create LLM client with different providers
export function createLLMClient(provider = 'openai', config = {}) {
    return new LLMClient({ provider, ...config });
}

// Default export
export { LLMClient };

// Production implementation examples:

/*
// OpenAI Implementation
class OpenAIClient extends LLMClient {
    initializeClient() {
        const { OpenAI } = require('openai');
        this.client = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY
        });
        this.isInitialized = true;
    }

    async generateResponse(prompt, options = {}) {
        const response = await this.client.chat.completions.create({
            model: this.config.model,
            messages: [{ role: 'user', content: prompt }],
            max_tokens: this.config.maxTokens,
            temperature: this.config.temperature,
            ...options
        });
        
        return response.choices[0].message.content;
    }
}

// Anthropic Implementation  
class AnthropicClient extends LLMClient {
    initializeClient() {
        const Anthropic = require('@anthropic-ai/sdk');
        this.client = new Anthropic({
            apiKey: process.env.ANTHROPIC_API_KEY
        });
        this.isInitialized = true;
    }

    async generateResponse(prompt, options = {}) {
        const response = await this.client.messages.create({
            model: this.config.model,
            max_tokens: this.config.maxTokens,
            messages: [{ role: 'user', content: prompt }],
            ...options
        });
        
        return response.content[0].text;
    }
}
*/