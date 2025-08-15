// src/scrapers/github-crawler.js

import fetch from 'node-fetch';

class GitHubCrawler {
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
    }

    async searchCandidates(jobRequirements) {
        console.log('🔍 Searching GitHub for candidates...');
        
        const candidates = [];
        const searchQueries = this.buildSearchQueries(jobRequirements);
        
        for (const query of searchQueries) {
            try {
                const results = await this.searchUsers(query);
                candidates.push(...results);
            } catch (error) {
                console.error(`Error searching with query "${query}":`, error.message);
            }
        }
        
        // Remove duplicates and enrich candidate data
        const uniqueCandidates = this.removeDuplicates(candidates);
        const enrichedCandidates = await this.enrichCandidates(uniqueCandidates, jobRequirements);
        
        // Score and rank candidates
        const scoredCandidates = this.scoreCandidates(enrichedCandidates, jobRequirements);
        
        return scoredCandidates.slice(0, 20); // Return top 20 candidates
    }

    buildSearchQueries(jobRequirements) {
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
        
        return queries;
    }

    async searchUsers(query) {
        const url = `${this.baseUrl}/search/users?q=${encodeURIComponent(query)}&sort=followers&order=desc&per_page=30`;
        
        const response = await fetch(url, { headers: this.headers });
        
        if (!response.ok) {
            throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        return data.items || [];
    }

    async enrichCandidates(candidates, jobRequirements) {
        console.log(`📊 Enriching data for ${candidates.length} candidates...`);
        
        const enriched = [];
        
        for (const candidate of candidates) {
            try {
                const detailedProfile = await this.getUserProfile(candidate.login);
                const repositories = await this.getUserRepositories(candidate.login);
                const contributions = await this.getUserContributions(candidate.login);
                
                enriched.push({
                    ...candidate,
                    profile: detailedProfile,
                    repositories,
                    contributions,
                    skills: this.extractSkills(repositories, detailedProfile),
                    experience: this.calculateExperience(detailedProfile, repositories),
                    location: detailedProfile.location,
                    hireable: detailedProfile.hireable
                });
                
                // Rate limiting - GitHub allows 30 requests per minute for authenticated users
                await this.delay(1000);
                
            } catch (error) {
                console.error(`Error enriching candidate ${candidate.login}:`, error.message);
            }
        }
        
        return enriched;
    }

    async getUserProfile(username) {
        const url = `${this.baseUrl}/users/${username}`;
        const response = await fetch(url, { headers: this.headers });
        
        if (!response.ok) {
            throw new Error(`Failed to get profile for ${username}: ${response.status}`);
        }
        
        return await response.json();
    }

    async getUserRepositories(username) {
        const url = `${this.baseUrl}/users/${username}/repos?sort=updated&per_page=20`;
        const response = await fetch(url, { headers: this.headers });
        
        if (!response.ok) {
            throw new Error(`Failed to get repositories for ${username}: ${response.status}`);
        }
        
        return await response.json();
    }

    async getUserContributions(username) {
        // Note: GitHub API doesn't provide direct access to contribution graph
        // We'll use repository activity as a proxy
        const url = `${this.baseUrl}/users/${username}/events?per_page=30`;
        const response = await fetch(url, { headers: this.headers });
        
        if (!response.ok) {
            return [];
        }
        
        return await response.json();
    }

    extractSkills(repositories, profile) {
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
        
        return Array.from(skills);
    }

    calculateExperience(profile, repositories) {
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
        
        return {
            yearsSinceJoin: Math.round(yearsSinceJoin * 10) / 10,
            totalStars,
            totalForks,
            publicRepos,
            level: experienceLevel
        };
    }

    scoreCandidates(candidates, jobRequirements) {
        return candidates.map(candidate => {
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
}

export default GitHubCrawler;
