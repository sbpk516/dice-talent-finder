// src/scrapers/github-crawler-monitored.js

import fetch from 'node-fetch';
import { getPerformanceMonitor } from '../utils/performance-monitor.js';

class GitHubCrawlerMonitored {
    constructor(apiToken = null) {
        this.apiToken = apiToken || process.env.GITHUB_TOKEN;
        this.baseUrl = 'https://api.github.com';
        this.headers = {
            'Accept': 'application/vnd.github.v3+json',
            'User-Agent': 'TalentFinder-GitHub-Crawler'
        };
        
        if (this.apiToken) {
            this.headers['Authorization'] = `token ${this.apiToken}`;
        }
        
        this.monitor = getPerformanceMonitor();
        this.cache = new Map(); // Simple in-memory cache
    }

    async searchCandidates(jobRequirements) {
        this.monitor.startOperation('GitHub Candidate Search');
        
        console.log('🔍 Searching GitHub for candidates...');
        
        const candidates = [];
        const searchQueries = this.buildSearchQueries(jobRequirements);
        
        this.monitor.startOperation('User Search Queries');
        for (const query of searchQueries) {
            try {
                const results = await this.searchUsers(query);
                candidates.push(...results);
            } catch (error) {
                console.error(`Error searching with query "${query}":`, error.message);
            }
        }
        this.monitor.endOperation('User Search Queries');
        
        // Remove duplicates and enrich candidate data
        this.monitor.startOperation('Candidate Deduplication');
        const uniqueCandidates = this.removeDuplicates(candidates);
        this.monitor.endOperation('Candidate Deduplication');
        
        this.monitor.startOperation('Candidate Enrichment');
        const enrichedCandidates = await this.enrichCandidates(uniqueCandidates, jobRequirements);
        this.monitor.endOperation('Candidate Enrichment');
        
        // Score and rank candidates
        this.monitor.startOperation('Candidate Scoring');
        const scoredCandidates = this.scoreCandidates(enrichedCandidates, jobRequirements);
        this.monitor.endOperation('Candidate Scoring');
        
        this.monitor.endOperation('GitHub Candidate Search');
        
        return scoredCandidates.slice(0, 20); // Return top 20 candidates
    }

    buildSearchQueries(jobRequirements) {
        this.monitor.startOperation('Query Building');
        
        const queries = [];
        const { requiredSkills, preferredSkills, level, yearsExperience } = jobRequirements;
        
        // Build queries based on required skills
        for (const skill of requiredSkills) {
            queries.push(`${skill} language:JavaScript language:Python language:Java language:TypeScript`);
        }
        
        // Build queries based on job level and experience
        if (level === 'senior') {
            queries.push('followers:>100 created:>2018');
        } else if (level === 'mid') {
            queries.push('followers:>50 created:>2020');
        }
        
        // Build queries for specific technologies
        const techQueries = [
            'machine learning',
            'data science',
            'MLOps',
            'deep learning',
            'tensorflow pytorch',
            'pandas scikit-learn'
        ];
        
        for (const tech of techQueries) {
            queries.push(`${tech} language:Python`);
        }
        
        this.monitor.endOperation('Query Building');
        return queries;
    }

    async searchUsers(query) {
        const cacheKey = `search:${query}`;
        
        // Check cache first
        if (this.cache.has(cacheKey)) {
            console.log(`📦 Cache hit for query: ${query.substring(0, 50)}...`);
            return this.cache.get(cacheKey);
        }
        
        const startTime = Date.now();
        const url = `${this.baseUrl}/search/users?q=${encodeURIComponent(query)}&sort=followers&order=desc&per_page=30`;
        
        try {
            const response = await fetch(url, { headers: this.headers });
            
            if (!response.ok) {
                throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
            }
            
            const data = await response.json();
            const duration = Date.now() - startTime;
            
            this.monitor.trackApiCall('GitHub Search API', duration);
            
            // Cache the result
            this.cache.set(cacheKey, data.items || []);
            
            return data.items || [];
            
        } catch (error) {
            const duration = Date.now() - startTime;
            this.monitor.trackApiCall('GitHub Search API (Failed)', duration);
            throw error;
        }
    }

    async enrichCandidates(candidates, jobRequirements) {
        console.log(`📊 Enriching data for ${candidates.length} candidates...`);
        
        const enriched = [];
        const batchSize = 5; // Process in batches to avoid overwhelming the API
        
        for (let i = 0; i < candidates.length; i += batchSize) {
            const batch = candidates.slice(i, i + batchSize);
            
            this.monitor.startOperation(`Enrichment Batch ${Math.floor(i/batchSize) + 1}`);
            
            const batchPromises = batch.map(async (candidate) => {
                try {
                    const [detailedProfile, repositories, contributions] = await Promise.all([
                        this.getUserProfile(candidate.login),
                        this.getUserRepositories(candidate.login),
                        this.getUserContributions(candidate.login)
                    ]);
                    
                    return {
                        ...candidate,
                        profile: detailedProfile,
                        repositories,
                        contributions,
                        skills: this.extractSkills(repositories, detailedProfile),
                        experience: this.calculateExperience(detailedProfile, repositories),
                        location: detailedProfile.location,
                        hireable: detailedProfile.hireable
                    };
                    
                } catch (error) {
                    console.error(`Error enriching candidate ${candidate.login}:`, error.message);
                    return null;
                }
            });
            
            const batchResults = await Promise.all(batchPromises);
            enriched.push(...batchResults.filter(result => result !== null));
            
            this.monitor.endOperation(`Enrichment Batch ${Math.floor(i/batchSize) + 1}`);
            
            // Rate limiting - GitHub allows 30 requests per minute for authenticated users
            if (i + batchSize < candidates.length) {
                await this.delay(2000); // 2 second delay between batches
            }
        }
        
        return enriched;
    }

    async getUserProfile(username) {
        const cacheKey = `profile:${username}`;
        
        if (this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey);
        }
        
        const startTime = Date.now();
        const url = `${this.baseUrl}/users/${username}`;
        
        try {
            const response = await fetch(url, { headers: this.headers });
            
            if (!response.ok) {
                throw new Error(`Failed to get profile for ${username}: ${response.status}`);
            }
            
            const data = await response.json();
            const duration = Date.now() - startTime;
            
            this.monitor.trackApiCall('GitHub Profile API', duration);
            
            // Cache the result
            this.cache.set(cacheKey, data);
            
            return data;
            
        } catch (error) {
            const duration = Date.now() - startTime;
            this.monitor.trackApiCall('GitHub Profile API (Failed)', duration);
            throw error;
        }
    }

    async getUserRepositories(username) {
        const cacheKey = `repos:${username}`;
        
        if (this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey);
        }
        
        const startTime = Date.now();
        const url = `${this.baseUrl}/users/${username}/repos?sort=updated&per_page=20`;
        
        try {
            const response = await fetch(url, { headers: this.headers });
            
            if (!response.ok) {
                throw new Error(`Failed to get repositories for ${username}: ${response.status}`);
            }
            
            const data = await response.json();
            const duration = Date.now() - startTime;
            
            this.monitor.trackApiCall('GitHub Repos API', duration);
            
            // Cache the result
            this.cache.set(cacheKey, data);
            
            return data;
            
        } catch (error) {
            const duration = Date.now() - startTime;
            this.monitor.trackApiCall('GitHub Repos API (Failed)', duration);
            throw error;
        }
    }

    async getUserContributions(username) {
        const cacheKey = `contributions:${username}`;
        
        if (this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey);
        }
        
        const startTime = Date.now();
        const url = `${this.baseUrl}/users/${username}/events?per_page=30`;
        
        try {
            const response = await fetch(url, { headers: this.headers });
            
            if (!response.ok) {
                return [];
            }
            
            const data = await response.json();
            const duration = Date.now() - startTime;
            
            this.monitor.trackApiCall('GitHub Events API', duration);
            
            // Cache the result
            this.cache.set(cacheKey, data);
            
            return data;
            
        } catch (error) {
            const duration = Date.now() - startTime;
            this.monitor.trackApiCall('GitHub Events API (Failed)', duration);
            return [];
        }
    }

    extractSkills(repositories, profile) {
        this.monitor.startOperation('Skills Extraction');
        
        const skills = new Set();
        
        // Extract from repository languages
        repositories.forEach(repo => {
            if (repo.language) {
                skills.add(repo.language.toLowerCase());
            }
        });
        
        // Extract from repository names and descriptions
        const repoText = repositories
            .map(repo => `${repo.name} ${repo.description || ''}`)
            .join(' ')
            .toLowerCase();
        
        const skillKeywords = [
            'python', 'javascript', 'java', 'typescript', 'react', 'vue', 'angular',
            'node.js', 'express', 'django', 'flask', 'fastapi', 'tensorflow', 'pytorch',
            'pandas', 'numpy', 'scikit-learn', 'sql', 'postgresql', 'mysql', 'mongodb',
            'docker', 'kubernetes', 'aws', 'azure', 'gcp', 'machine learning', 'ml',
            'data science', 'deep learning', 'neural networks', 'mlops', 'ci/cd',
            'git', 'github', 'gitlab', 'jenkins', 'travis', 'circleci'
        ];
        
        skillKeywords.forEach(skill => {
            if (repoText.includes(skill)) {
                skills.add(skill);
            }
        });
        
        this.monitor.endOperation('Skills Extraction');
        return Array.from(skills);
    }

    calculateExperience(profile, repositories) {
        this.monitor.startOperation('Experience Calculation');
        
        const createdAt = new Date(profile.created_at);
        const now = new Date();
        const yearsSinceJoin = (now - createdAt) / (1000 * 60 * 60 * 24 * 365);
        
        // Calculate based on repository count and activity
        const totalStars = repositories.reduce((sum, repo) => sum + repo.stargazers_count, 0);
        const totalForks = repositories.reduce((sum, repo) => sum + repo.forks_count, 0);
        const publicRepos = profile.public_repos;
        
        let experienceLevel = 'junior';
        
        if (yearsSinceJoin > 5 || totalStars > 100 || publicRepos > 20) {
            experienceLevel = 'senior';
        } else if (yearsSinceJoin > 2 || totalStars > 20 || publicRepos > 10) {
            experienceLevel = 'mid';
        }
        
        this.monitor.endOperation('Experience Calculation');
        
        return {
            yearsSinceJoin: Math.round(yearsSinceJoin * 10) / 10,
            totalStars,
            totalForks,
            publicRepos,
            level: experienceLevel
        };
    }

    scoreCandidates(candidates, jobRequirements) {
        this.monitor.startOperation('Candidate Scoring');
        
        const scored = candidates.map(candidate => {
            let score = 0;
            const { requiredSkills, preferredSkills, level, yearsExperience } = jobRequirements;
            
            // Score based on required skills match
            const requiredSkillsMatch = requiredSkills.filter(skill => 
                candidate.skills.some(candidateSkill => 
                    candidateSkill.includes(skill.toLowerCase()) || 
                    skill.toLowerCase().includes(candidateSkill)
                )
            ).length;
            
            score += (requiredSkillsMatch / requiredSkills.length) * 40;
            
            // Score based on preferred skills match
            const preferredSkillsMatch = preferredSkills.filter(skill => 
                candidate.skills.some(candidateSkill => 
                    candidateSkill.includes(skill.toLowerCase()) || 
                    skill.toLowerCase().includes(candidateSkill)
                )
            ).length;
            
            score += (preferredSkillsMatch / preferredSkills.length) * 20;
            
            // Score based on experience level match
            if (candidate.experience.level === level) {
                score += 20;
            } else if (
                (level === 'senior' && candidate.experience.level === 'mid') ||
                (level === 'mid' && candidate.experience.level === 'junior')
            ) {
                score += 10;
            }
            
            // Score based on years of experience
            if (yearsExperience.min && yearsExperience.max) {
                if (candidate.experience.yearsSinceJoin >= yearsExperience.min && 
                    candidate.experience.yearsSinceJoin <= yearsExperience.max) {
                    score += 10;
                }
            }
            
            // Score based on GitHub activity
            if (candidate.experience.totalStars > 50) score += 5;
            if (candidate.experience.publicRepos > 15) score += 5;
            
            // Bonus for hireable status
            if (candidate.hireable) score += 5;
            
            return {
                ...candidate,
                score: Math.round(score),
                skillsMatch: {
                    required: requiredSkillsMatch,
                    preferred: preferredSkillsMatch,
                    total: requiredSkillsMatch + preferredSkillsMatch
                }
            };
        }).sort((a, b) => b.score - a.score);
        
        this.monitor.endOperation('Candidate Scoring');
        return scored;
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

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    formatCandidateOutput(candidate) {
        return {
            username: candidate.login,
            name: candidate.name || candidate.login,
            score: candidate.score,
            profile: candidate.profile.html_url,
            avatar: candidate.avatar_url,
            location: candidate.location,
            hireable: candidate.hireable,
            experience: candidate.experience,
            skills: candidate.skills,
            skillsMatch: candidate.skillsMatch,
            repositories: candidate.repositories.length,
            followers: candidate.followers,
            publicRepos: candidate.public_repos
        };
    }

    // Method to get performance report
    getPerformanceReport() {
        return this.monitor.getSummary();
    }

    // Method to print performance report
    printPerformanceReport() {
        this.monitor.printReport();
    }
}

export default GitHubCrawlerMonitored;
