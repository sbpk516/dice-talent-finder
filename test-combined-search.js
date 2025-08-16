#!/usr/bin/env node

// test-combined-search.js - Test separate vs combined search approaches

import fetch from 'node-fetch';

class SearchTester {
    constructor() {
        this.baseUrl = 'https://api.github.com';
        this.headers = {
            'Accept': 'application/vnd.github.v3+json',
            'User-Agent': 'Search-Tester'
        };
        
        if (process.env.GITHUB_TOKEN) {
            this.headers['Authorization'] = `token ${process.env.GITHUB_TOKEN}`;
        }
    }

    async searchUsers(query) {
        const url = `${this.baseUrl}/search/users?q=${encodeURIComponent(query)}&sort=followers&order=desc&per_page=10`;
        
        const response = await fetch(url, { headers: this.headers });
        
        if (!response.ok) {
            throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        return data.items || [];
    }

    async testSeparateSearches() {
        console.log('🔍 Testing Separate Searches...');
        
        const separateQueries = [
            'python language:Python',
            'machine learning language:Python', 
            'pandas language:Python',
            'tensorflow language:Python'
        ];
        
        const allUsers = new Set();
        const startTime = Date.now();
        
        for (const query of separateQueries) {
            try {
                console.log(`  Searching: "${query}"`);
                const users = await this.searchUsers(query);
                users.forEach(user => allUsers.add(user.login));
                console.log(`    Found: ${users.length} users`);
                
                // Rate limiting delay
                await new Promise(resolve => setTimeout(resolve, 1000));
                
            } catch (error) {
                console.error(`    Error: ${error.message}`);
            }
        }
        
        const duration = Date.now() - startTime;
        console.log(`  Total unique users found: ${allUsers.size}`);
        console.log(`  Time taken: ${duration}ms`);
        console.log(`  API calls made: ${separateQueries.length}`);
        
        return {
            users: Array.from(allUsers),
            duration,
            apiCalls: separateQueries.length
        };
    }

    async testCombinedSearch() {
        console.log('\n🔍 Testing Combined Search...');
        
        const combinedQuery = 'python machine learning pandas tensorflow language:Python';
        
        const startTime = Date.now();
        
        try {
            console.log(`  Searching: "${combinedQuery}"`);
            const users = await this.searchUsers(combinedQuery);
            const duration = Date.now() - startTime;
            
            console.log(`  Found: ${users.length} users`);
            console.log(`  Time taken: ${duration}ms`);
            console.log(`  API calls made: 1`);
            
            return {
                users: users.map(user => user.login),
                duration,
                apiCalls: 1
            };
            
        } catch (error) {
            console.error(`  Error: ${error.message}`);
            return { users: [], duration: 0, apiCalls: 1 };
        }
    }

    async testAlternativeCombinedSearches() {
        console.log('\n🔍 Testing Alternative Combined Approaches...');
        
        const alternativeQueries = [
            'python OR "machine learning" OR pandas OR tensorflow language:Python',
            'python language:Python followers:>10',
            'python language:Python created:>2020',
            'python language:Python location:remote'
        ];
        
        for (const query of alternativeQueries) {
            try {
                console.log(`  Testing: "${query}"`);
                const users = await this.searchUsers(query);
                console.log(`    Found: ${users.length} users`);
                
                // Rate limiting delay
                await new Promise(resolve => setTimeout(resolve, 1000));
                
            } catch (error) {
                console.error(`    Error: ${error.message}`);
            }
        }
    }

    async runComparison() {
        console.log('🚀 GitHub Search API Comparison Test');
        console.log('=' .repeat(50));
        
        // Test separate searches
        const separateResults = await this.testSeparateSearches();
        
        // Test combined search
        const combinedResults = await this.testCombinedSearch();
        
        // Test alternative approaches
        await this.testAlternativeCombinedSearches();
        
        // Compare results
        console.log('\n📊 Comparison Results:');
        console.log('=' .repeat(50));
        console.log(`Separate Searches:`);
        console.log(`  Users found: ${separateResults.users.length}`);
        console.log(`  Time: ${separateResults.duration}ms`);
        console.log(`  API calls: ${separateResults.apiCalls}`);
        console.log(`  Users per API call: ${(separateResults.users.length / separateResults.apiCalls).toFixed(1)}`);
        
        console.log(`\nCombined Search:`);
        console.log(`  Users found: ${combinedResults.users.length}`);
        console.log(`  Time: ${combinedResults.duration}ms`);
        console.log(`  API calls: ${combinedResults.apiCalls}`);
        console.log(`  Users per API call: ${combinedResults.users.length}`);
        
        console.log(`\n💡 Analysis:`);
        if (combinedResults.users.length > 0) {
            console.log(`  ✅ Combined search works and is ${Math.round(separateResults.duration / combinedResults.duration)}x faster`);
            console.log(`  ⚠️  But found ${Math.round(separateResults.users.length / combinedResults.users.length)}x fewer users`);
        } else {
            console.log(`  ❌ Combined search didn't work - GitHub API doesn't support this syntax`);
        }
        
        console.log(`\n🎯 Recommendation:`);
        if (combinedResults.users.length > separateResults.users.length * 0.3) {
            console.log(`  Use combined search for speed, then supplement with separate searches`);
        } else {
            console.log(`  Stick with separate searches for better coverage`);
        }
    }
}

// Run the test
const tester = new SearchTester();
tester.runComparison().catch(console.error);
