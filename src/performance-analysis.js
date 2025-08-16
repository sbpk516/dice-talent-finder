// src/performance-analysis.js

import { getPerformanceMonitor } from './utils/performance-monitor.js';
import GitHubCrawlerMonitored from './scrapers/github-crawler-monitored.js';
import { JobRequirementsParser } from './parsers/job-parser.js';
import sampleJobs from '../tests/sample-jobs.js';

class PerformanceAnalyzer {
    constructor() {
        this.monitor = getPerformanceMonitor();
        this.results = {
            bottlenecks: [],
            recommendations: [],
            optimizationOpportunities: []
        };
    }

    async analyzeJobParsing() {
        console.log('\n🔍 Analyzing Job Parsing Performance...');
        this.monitor.startOperation('Job Parsing Analysis');
        
        const parser = new JobRequirementsParser();
        const startTime = Date.now();
        
        try {
            const result = await parser.parseJobDescription(sampleJobs.jobDescription);
            const duration = Date.now() - startTime;
            
            this.monitor.endOperation('Job Parsing Analysis');
            
            if (duration > 5000) {
                this.results.bottlenecks.push({
                    component: 'Job Parsing',
                    duration: duration,
                    impact: 'High',
                    description: 'LLM API call taking too long',
                    suggestions: [
                        'Consider using a faster model (GPT-3.5-turbo instead of GPT-4)',
                        'Implement caching for similar job descriptions',
                        'Optimize the prompt to be more concise',
                        'Use streaming responses for better UX'
                    ]
                });
            }
            
            return result;
            
        } catch (error) {
            this.monitor.endOperation('Job Parsing Analysis');
            console.error('Job parsing failed:', error.message);
            throw error;
        }
    }

    async analyzeGitHubCrawling(jobRequirements) {
        console.log('\n🔍 Analyzing GitHub Crawling Performance...');
        this.monitor.startOperation('GitHub Crawling Analysis');
        
        const crawler = new GitHubCrawlerMonitored();
        const startTime = Date.now();
        
        try {
            const candidates = await crawler.searchCandidates(jobRequirements);
            const duration = Date.now() - startTime;
            
            this.monitor.endOperation('GitHub Crawling Analysis');
            
            // Analyze the performance report
            const report = crawler.getPerformanceReport();
            
            // Check for API bottlenecks
            report.apiSummary.forEach(api => {
                if (api.count > 20) {
                    this.results.bottlenecks.push({
                        component: 'GitHub API',
                        duration: api.totalDuration,
                        impact: 'High',
                        description: `Too many ${api.name} calls (${api.count})`,
                        suggestions: [
                            'Implement more aggressive caching',
                            'Reduce the number of candidates processed',
                            'Use batch API calls where possible',
                            'Implement rate limiting with exponential backoff'
                        ]
                    });
                }
                
                if (api.averageDuration > 3000) {
                    this.results.bottlenecks.push({
                        component: 'GitHub API',
                        duration: api.averageDuration,
                        impact: 'Medium',
                        description: `Slow ${api.name} response times`,
                        suggestions: [
                            'Check network connectivity',
                            'Verify GitHub API status',
                            'Consider using GitHub GraphQL API for batch queries',
                            'Implement request queuing with priority'
                        ]
                    });
                }
            });
            
            // Check for operation bottlenecks
            report.operationSummary.forEach(op => {
                if (op.percentage > 30) {
                    this.results.bottlenecks.push({
                        component: op.name,
                        duration: op.duration,
                        impact: 'High',
                        description: `${op.name} taking ${op.percentage}% of total time`,
                        suggestions: [
                            'Optimize the algorithm',
                            'Implement parallel processing',
                            'Consider using worker threads',
                            'Profile the specific operation for hotspots'
                        ]
                    });
                }
            });
            
            return candidates;
            
        } catch (error) {
            this.monitor.endOperation('GitHub Crawling Analysis');
            console.error('GitHub crawling failed:', error.message);
            throw error;
        }
    }

    async analyzeFullPipeline() {
        console.log('\n🚀 Starting Full Pipeline Performance Analysis...');
        this.monitor.startOperation('Full Pipeline Analysis');
        
        try {
            // Step 1: Analyze job parsing
            const parsedJob = await this.analyzeJobParsing();
            
            // Step 2: Analyze GitHub crawling
            const candidates = await this.analyzeGitHubCrawling(parsedJob);
            
            this.monitor.endOperation('Full Pipeline Analysis');
            
            // Generate comprehensive analysis
            this.generateOptimizationRecommendations();
            
            return {
                parsedJob,
                candidates,
                analysis: this.results
            };
            
        } catch (error) {
            this.monitor.endOperation('Full Pipeline Analysis');
            console.error('Full pipeline analysis failed:', error.message);
            throw error;
        }
    }

    generateOptimizationRecommendations() {
        console.log('\n💡 Generating Optimization Recommendations...');
        
        // Analyze overall performance patterns
        const report = this.monitor.getSummary();
        
        // Check total execution time
        if (report.totalDuration > 60000) { // More than 1 minute
            this.results.recommendations.push({
                priority: 'High',
                category: 'Overall Performance',
                description: 'Total execution time is too long',
                actions: [
                    'Implement parallel processing for independent operations',
                    'Add caching layer for repeated API calls',
                    'Optimize the most time-consuming operations first',
                    'Consider using a queue system for background processing'
                ]
            });
        }
        
        // Check API call efficiency
        const totalApiCalls = report.apiSummary.reduce((sum, api) => sum + api.count, 0);
        if (totalApiCalls > 100) {
            this.results.recommendations.push({
                priority: 'High',
                category: 'API Efficiency',
                description: 'Too many API calls detected',
                actions: [
                    'Implement Redis or database caching',
                    'Use GraphQL for batch queries',
                    'Reduce the scope of candidate search',
                    'Implement intelligent pagination'
                ]
            });
        }
        
        // Check for memory usage patterns
        this.results.recommendations.push({
            priority: 'Medium',
            category: 'Memory Management',
            description: 'Consider memory optimization',
            actions: [
                'Implement streaming for large datasets',
                'Use object pooling for frequently created objects',
                'Implement garbage collection optimization',
                'Monitor memory usage with heap snapshots'
            ]
        });
        
        // Check for scalability issues
        this.results.recommendations.push({
            priority: 'Medium',
            category: 'Scalability',
            description: 'Prepare for scale',
            actions: [
                'Implement horizontal scaling with load balancers',
                'Use microservices architecture',
                'Implement database connection pooling',
                'Consider using CDN for static assets'
            ]
        });
    }

    printDetailedReport() {
        console.log('\n📊 DETAILED PERFORMANCE ANALYSIS REPORT');
        console.log('=' .repeat(60));
        
        // Print performance monitor report
        this.monitor.printReport();
        
        // Print bottlenecks
        console.log('\n🚨 IDENTIFIED BOTTLENECKS:');
        this.results.bottlenecks.forEach((bottleneck, index) => {
            console.log(`\n${index + 1}. ${bottleneck.component} (${bottleneck.impact} Impact)`);
            console.log(`   Duration: ${bottleneck.duration}ms`);
            console.log(`   Description: ${bottleneck.description}`);
            console.log(`   Suggestions:`);
            bottleneck.suggestions.forEach(suggestion => {
                console.log(`     • ${suggestion}`);
            });
        });
        
        // Print recommendations
        console.log('\n💡 OPTIMIZATION RECOMMENDATIONS:');
        this.results.recommendations.forEach((rec, index) => {
            console.log(`\n${index + 1}. ${rec.category} (${rec.priority} Priority)`);
            console.log(`   ${rec.description}`);
            console.log(`   Actions:`);
            rec.actions.forEach(action => {
                console.log(`     • ${action}`);
            });
        });
        
        // Print next steps
        console.log('\n🎯 NEXT STEPS FOR OPTIMIZATION:');
        console.log('1. Implement caching layer (Redis recommended)');
        console.log('2. Optimize API calls with batching and rate limiting');
        console.log('3. Profile memory usage with Node.js --inspect');
        console.log('4. Consider using worker threads for CPU-intensive tasks');
        console.log('5. Implement monitoring and alerting for production');
        console.log('6. Add performance regression tests');
        
        console.log('=' .repeat(60));
    }

    async saveReportToFile() {
        const fs = await import('fs/promises');
        const report = {
            timestamp: new Date().toISOString(),
            performanceReport: this.monitor.getSummary(),
            bottlenecks: this.results.bottlenecks,
            recommendations: this.results.recommendations,
            optimizationOpportunities: this.results.optimizationOpportunities
        };
        
        await fs.writeFile(
            './data/performance-analysis-report.json',
            JSON.stringify(report, null, 2)
        );
        
        console.log('\n💾 Performance analysis report saved to ./data/performance-analysis-report.json');
    }
}

// Function to run the analysis
async function runPerformanceAnalysis() {
    const analyzer = new PerformanceAnalyzer();
    
    try {
        console.log('🔍 Starting Performance Analysis...');
        console.log('This will analyze the entire pipeline and identify bottlenecks.');
        console.log('=' .repeat(60));
        
        const results = await analyzer.analyzeFullPipeline();
        
        // Print detailed report
        analyzer.printDetailedReport();
        
        // Save report to file
        await analyzer.saveReportToFile();
        
        console.log('\n✅ Performance analysis completed successfully!');
        console.log(`📊 Found ${results.analysis.bottlenecks.length} bottlenecks`);
        console.log(`💡 Generated ${results.analysis.recommendations.length} recommendations`);
        
        return results;
        
    } catch (error) {
        console.error('❌ Performance analysis failed:', error.message);
        throw error;
    }
}

// Run if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
    runPerformanceAnalysis();
}

export { PerformanceAnalyzer, runPerformanceAnalysis };
