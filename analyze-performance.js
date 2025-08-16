#!/usr/bin/env node

// analyze-performance.js - Simple performance analysis runner

import { runPerformanceAnalysis } from './src/performance-analysis.js';

console.log('🔍 Dice Talent Finder - Performance Analysis');
console.log('=' .repeat(50));

async function main() {
    try {
        console.log('Starting performance analysis...');
        console.log('This will analyze your talent finder pipeline and identify bottlenecks.');
        console.log('');
        
        const results = await runPerformanceAnalysis();
        
        console.log('');
        console.log('✅ Analysis completed!');
        console.log('');
        console.log('📊 Summary:');
        console.log(`   • Total bottlenecks found: ${results.analysis.bottlenecks.length}`);
        console.log(`   • Optimization recommendations: ${results.analysis.recommendations.length}`);
        console.log(`   • Candidates processed: ${results.candidates.length}`);
        console.log('');
        console.log('📁 Check the following files for detailed information:');
        console.log('   • ./data/performance-analysis-report.json - Detailed analysis');
        console.log('   • ./PERFORMANCE_ANALYSIS_GUIDE.md - Complete optimization guide');
        console.log('');
        console.log('🚀 Next steps:');
        console.log('   1. Review the bottlenecks in the report');
        console.log('   2. Implement caching (highest impact)');
        console.log('   3. Optimize API calls with batching');
        console.log('   4. Set up monitoring for ongoing optimization');
        
    } catch (error) {
        console.error('❌ Performance analysis failed:', error.message);
        console.error('');
        console.error('Troubleshooting tips:');
        console.error('   • Check your GitHub API token is set');
        console.error('   • Verify your OpenAI API key is configured');
        console.error('   • Ensure you have internet connectivity');
        console.error('   • Check the console output for specific errors');
        
        process.exit(1);
    }
}

// Run the analysis
main();
