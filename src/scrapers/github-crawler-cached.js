// src/scrapers/github-crawler-cached.js

import fetch from 'node-fetch';
import { getCacheManager } from '../utils/cache-manager.js';
import { getPerformanceMonitor } from '../utils/performance-monitor.js';

class GitHubCrawlerCached {
    constructor(apiToken = null) {
        this.apiToken = apiToken || process.env.GITHUB_TOKEN;
        this.baseURL = 'https://api.github.com';
        this.cache = getCacheManager();
        this.monitor = getPerformanceMonitor();
        
        // Rate limiting
        this.rateLimitRemaining = 30;
        this.rateLimitReset = Date.now() + 60000; // 1 minute from now
    }

    async searchCandidates(jobRequirements) {
        this.monitor.startOperation('Cached GitHub Search');
        console.log('🔍 Searching GitHub for candidates (with caching)...');
        
        const candidates = [];
        
        try {
            // Build search queries
            this.monitor.startOperation('Query Building');
            const searchQueries = await this.buildSearchQueries(jobRequirements);
            this.monitor.endOperation('Query Building');
            
            // Search for users with caching
            this.monitor.startOperation('Cached User Search Queries');
            for (const query of searchQueries) {
                const users = await this.searchUsersCached(query);
                candidates.push(...users);
            }
            this.monitor.endOperation('Cached User Search Queries');
            
            // Remove duplicates
            this.monitor.startOperation('Candidate Deduplication');
            const uniqueCandidates = this.removeDuplicates(candidates);
            this.monitor.endOperation('Candidate Deduplication');
            
            console.log(`📊 Enriching data for ${uniqueCandidates.length} candidates (with caching)...`);
            
            // Enrich candidate data with caching
            this.monitor.startOperation('Cached Candidate Enrichment');
            const enrichedCandidates = await this.enrichCandidatesCached(uniqueCandidates, jobRequirements);
            this.monitor.endOperation('Cached Candidate Enrichment');
            
            // Score and sort candidates
            this.monitor.startOperation('Candidate Scoring');
            const scoredCandidates = this.scoreCandidates(enrichedCandidates, jobRequirements);
            this.monitor.endOperation('Candidate Scoring');
            
            this.monitor.endOperation('Cached GitHub Search');
            return scoredCandidates;
            
        } catch (error) {
            console.error('Error in cached GitHub search:', error);
            this.monitor.endOperation('Cached GitHub Search');
            return [];
        }
    }

    async buildSearchQueries(jobRequirements) {
        // Use AI-powered optimized queries if available
        if (jobRequirements.optimizedQueries) {
            return jobRequirements.optimizedQueries;
        }
        
        // Fallback to traditional approach
        const queries = [];
        const { requiredSkills, preferredSkills, level, yearsExperience } = jobRequirements;
        
        // Create queries for required skills
        for (const skill of requiredSkills.slice(0, 5)) {
            let query = `${skill} language:JavaScript language:Python language:Java language:TypeScript`;
            
            // Add experience level filters
            if (level === 'senior') {
                query += ' followers:>100 created:>2018';
            } else if (level === 'mid') {
                query += ' followers:>50 created:>2020';
            }
            
            queries.push(query);
        }
        
        // Add a general experience-based query
        if (level === 'senior') {
            queries.push('followers:>100 created:>2018');
        } else if (level === 'mid') {
            queries.push('followers:>50 created:>2020');
        }
        
        return queries;
    }

    async searchUsersCached(query) {
        const cacheKey = this.cache.generateKey('search', query);
        
        // Try to get from cache first
        const cached = await this.cache.get(cacheKey);
        if (cached) {
            console.log(`💾 Disk cache hit: ${cacheKey}`);
            return cached;
        }
        
        // If not in cache, fetch from API
        console.log(`❌ Cache miss: ${cacheKey}`);
        
        try {
            const response = await this.makeGitHubRequest(`/search/users?q=${encodeURIComponent(query)}&per_page=30`);
            
            if (response && response.items) {
                // Cache the results
                await this.cache.set(cacheKey, response.items);
                console.log(`💾 Cached to disk: ${cacheKey}`);
                return response.items;
            }
        } catch (error) {
            console.error(`Error searching users for query "${query}":`, error.message);
        }
        
        return [];
    }

    async enrichCandidatesCached(candidates, jobRequirements) {
        const enriched = [];
        const batchSize = 5; // Process in smaller batches
        
        for (let i = 0; i < candidates.length; i += batchSize) {
            const batch = candidates.slice(i, i + batchSize);
            const batchNumber = Math.floor(i / batchSize) + 1;
            
            this.monitor.startOperation(`Cached Enrichment Batch ${batchNumber}`);
            
            const batchPromises = batch.map(async (candidate) => {
                try {
                    const [profile, repos, contributions] = await Promise.all([
                        this.getUserProfileCached(candidate.login),
                        this.getUserRepositoriesCached(candidate.login),
                        this.getUserContributionsCached(candidate.login)
                    ]);
                    
                    // Extract skills from repositories
                    this.monitor.startOperation('Skills Extraction');
                    const skills = this.extractSkillsFromRepos(repos);
                    this.monitor.endOperation('Skills Extraction');
                    
                    // Calculate experience
                    this.monitor.startOperation('Experience Calculation');
                    const experience = this.calculateExperience(profile, repos);
                    this.monitor.endOperation('Experience Calculation');
                    
                    return {
                        username: candidate.login,
                        name: profile.name || candidate.login,
                        profile: profile.html_url,
                        avatar: profile.avatar_url,
                        location: profile.location,
                        hireable: profile.hireable,
                        followers: profile.followers,
                        experience,
                        skills,
                        repositories: repos.length,
                        skillsMatch: this.calculateSkillsMatch(skills, jobRequirements)
                    };
                } catch (error) {
                    console.error(`Error enriching candidate ${candidate.login}:`, error.message);
                    return null;
                }
            });
            
            const batchResults = await Promise.all(batchPromises);
            enriched.push(...batchResults.filter(c => c !== null));
            
            this.monitor.endOperation(`Cached Enrichment Batch ${batchNumber}`);
            
            // Small delay to respect rate limits
            if (i + batchSize < candidates.length) {
                await this.delay(100);
            }
        }
        
        return enriched;
    }

    async getUserProfileCached(username) {
        const cacheKey = this.cache.generateKey('profile', username);
        
        const cached = await this.cache.get(cacheKey);
        if (cached) {
            console.log(`💾 Disk cache hit: ${cacheKey}`);
            return cached;
        }
        
        try {
            const profile = await this.makeGitHubRequest(`/users/${username}`);
            await this.cache.set(cacheKey, profile);
            return profile;
        } catch (error) {
            console.error(`Error fetching profile for ${username}:`, error.message);
            return {};
        }
    }

    async getUserRepositoriesCached(username) {
        const cacheKey = this.cache.generateKey('repos', username);
        
        const cached = await this.cache.get(cacheKey);
        if (cached) {
            console.log(`💾 Disk cache hit: ${cacheKey}`);
            return cached;
        }
        
        try {
            const repos = await this.makeGitHubRequest(`/users/${username}/repos?per_page=100&sort=updated`);
            await this.cache.set(cacheKey, repos);
            return repos;
        } catch (error) {
            console.error(`Error fetching repos for ${username}:`, error.message);
            return [];
        }
    }

    async getUserContributionsCached(username) {
        const cacheKey = this.cache.generateKey('contributions', username);
        
        const cached = await this.cache.get(cacheKey);
        if (cached) {
            console.log(`💾 Disk cache hit: ${cacheKey}`);
            return cached;
        }
        
        try {
            const events = await this.makeGitHubRequest(`/users/${username}/events?per_page=100`);
            await this.cache.set(cacheKey, events);
            return events;
        } catch (error) {
            console.error(`Error fetching contributions for ${username}:`, error.message);
            return [];
        }
    }

    async makeGitHubRequest(endpoint) {
        const url = `${this.baseURL}${endpoint}`;
        const headers = {
            'Accept': 'application/vnd.github.v3+json',
            'User-Agent': 'GitHub-Talent-Finder'
        };
        
        if (this.apiToken) {
            headers['Authorization'] = `token ${this.apiToken}`;
        }
        
        const startTime = Date.now();
        
        try {
            const response = await fetch(url, { headers });
            
            if (response.status === 403) {
                console.warn('⚠️  Rate limit exceeded, waiting...');
                await this.delay(60000); // Wait 1 minute
                return this.makeGitHubRequest(endpoint);
            }
            
            if (!response.ok) {
                throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
            }
            
            const data = await response.json();
            const duration = Date.now() - startTime;
            
            this.monitor.trackApiCall('GitHub API', duration);
            
            return data;
        } catch (error) {
            console.error(`GitHub API request failed: ${error.message}`);
            throw error;
        }
    }

    removeDuplicates(candidates) {
        const seen = new Set();
        return candidates.filter(candidate => {
            if (seen.has(candidate.login)) {
                return false;
            }
            seen.add(candidate.login);
            return true;
        });
    }

    extractSkillsFromRepos(repos) {
        const skills = new Set();
        
        repos.forEach(repo => {
            if (repo.language) {
                skills.add(repo.language.toLowerCase());
            }
            
            // Extract skills from description and topics
            const text = `${repo.description || ''} ${repo.topics?.join(' ') || ''}`.toLowerCase();
            
            const commonSkills = [
                'python', 'javascript', 'java', 'typescript', 'react', 'node.js', 'django',
                'flask', 'express', 'mongodb', 'postgresql', 'mysql', 'redis', 'docker',
                'kubernetes', 'aws', 'azure', 'gcp', 'tensorflow', 'pytorch', 'scikit-learn',
                'pandas', 'numpy', 'matplotlib', 'seaborn', 'sql', 'html', 'css', 'vue',
                'angular', 'spring', 'laravel', 'php', 'ruby', 'go', 'rust', 'c++', 'c#',
                'swift', 'kotlin', 'flutter', 'react native', 'machine learning', 'ai',
                'data science', 'devops', 'ci/cd', 'git', 'github', 'gitlab', 'jenkins'
            ];
            
            commonSkills.forEach(skill => {
                if (text.includes(skill)) {
                    skills.add(skill);
                }
            });
        });
        
        return Array.from(skills).slice(0, 20); // Limit to top 20 skills
    }

    calculateExperience(profile, repos) {
        const joinDate = new Date(profile.created_at);
        const yearsSinceJoin = (Date.now() - joinDate.getTime()) / (1000 * 60 * 60 * 24 * 365);
        
        const totalStars = repos.reduce((sum, repo) => sum + (repo.stargazers_count || 0), 0);
        const totalForks = repos.reduce((sum, repo) => sum + (repo.forks_count || 0), 0);
        
        let level = 'junior';
        if (yearsSinceJoin > 5 || totalStars > 1000) {
            level = 'senior';
        } else if (yearsSinceJoin > 2 || totalStars > 100) {
            level = 'mid';
        }
        
        return {
            yearsSinceJoin: Math.round(yearsSinceJoin * 10) / 10,
            totalStars,
            totalForks,
            publicRepos: repos.length,
            level
        };
    }

    calculateSkillsMatch(skills, jobRequirements) {
        const requiredSkills = jobRequirements.requiredSkills || [];
        const preferredSkills = jobRequirements.preferredSkills || [];
        
        const requiredMatch = requiredSkills.filter(skill => 
            skills.some(s => s.toLowerCase().includes(skill.toLowerCase()))
        ).length;
        
        const preferredMatch = preferredSkills.filter(skill => 
            skills.some(s => s.toLowerCase().includes(skill.toLowerCase()))
        ).length;
        
        return {
            required: requiredMatch,
            preferred: preferredMatch,
            total: requiredMatch + preferredMatch
        };
    }

    scoreCandidates(candidates, jobRequirements) {
        return candidates
            .map(candidate => {
                const skillsScore = (candidate.skillsMatch.required / (jobRequirements.requiredSkills?.length || 1)) * 40;
                const experienceScore = Math.min(candidate.experience.yearsSinceJoin * 5, 30);
                const activityScore = Math.min(candidate.experience.totalStars / 100, 20);
                const locationScore = candidate.location ? 10 : 0;
                
                const totalScore = Math.round(skillsScore + experienceScore + activityScore + locationScore);
                
                return {
                    ...candidate,
                    score: Math.min(totalScore, 100)
                };
            })
            .sort((a, b) => b.score - a.score)
            .slice(0, 20); // Return top 20 candidates
    }

    async delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    getCacheStats() {
        return this.cache.getStats();
    }

    printPerformanceReport() {
        const stats = this.cache.getStats();
        console.log('\n📦 Cache Performance:');
        console.log('==============================');
        console.log(`   Cache Hit Rate: ${stats.hitRate}`);
        console.log(`   Memory Cache Hits: ${stats.memoryHits}`);
        console.log(`   Disk Cache Hits: ${stats.diskHits}`);
        console.log(`   Total Cache Requests: ${stats.totalHits + stats.misses}`);
        console.log(`   Memory Cache Size: ${stats.memorySize}/${stats.maxMemorySize}`);
    }

    async cleanupCache() {
        await this.cache.cleanup();
    }
}

export default GitHubCrawlerCached;
