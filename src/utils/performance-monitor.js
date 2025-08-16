// src/utils/performance-monitor.js

class PerformanceMonitor {
    constructor() {
        this.metrics = {
            startTime: Date.now(),
            operations: {},
            apiCalls: {},
            bottlenecks: []
        };
        this.currentOperation = null;
    }

    startOperation(operationName) {
        this.currentOperation = operationName;
        this.metrics.operations[operationName] = {
            startTime: Date.now(),
            endTime: null,
            duration: null
        };
        console.log(`⏱️  Starting: ${operationName}`);
    }

    endOperation(operationName) {
        if (this.metrics.operations[operationName]) {
            this.metrics.operations[operationName].endTime = Date.now();
            this.metrics.operations[operationName].duration = 
                this.metrics.operations[operationName].endTime - 
                this.metrics.operations[operationName].startTime;
            
            console.log(`✅ Completed: ${operationName} (${this.metrics.operations[operationName].duration}ms)`);
        }
    }

    trackApiCall(apiName, duration) {
        if (!this.metrics.apiCalls[apiName]) {
            this.metrics.apiCalls[apiName] = {
                count: 0,
                totalDuration: 0,
                averageDuration: 0,
                minDuration: Infinity,
                maxDuration: 0
            };
        }
        
        const api = this.metrics.apiCalls[apiName];
        api.count++;
        api.totalDuration += duration;
        api.averageDuration = api.totalDuration / api.count;
        api.minDuration = Math.min(api.minDuration, duration);
        api.maxDuration = Math.max(api.maxDuration, duration);
    }

    addBottleneck(description, duration, impact) {
        this.metrics.bottlenecks.push({
            description,
            duration,
            impact,
            timestamp: Date.now()
        });
    }

    getSummary() {
        const totalDuration = Date.now() - this.metrics.startTime;
        const operationSummary = Object.entries(this.metrics.operations)
            .map(([name, data]) => ({
                name,
                duration: data.duration,
                percentage: ((data.duration / totalDuration) * 100).toFixed(2)
            }))
            .sort((a, b) => b.duration - a.duration);

        const apiSummary = Object.entries(this.metrics.apiCalls)
            .map(([name, data]) => ({
                name,
                count: data.count,
                totalDuration: data.totalDuration,
                averageDuration: data.averageDuration,
                percentage: ((data.totalDuration / totalDuration) * 100).toFixed(2)
            }))
            .sort((a, b) => b.totalDuration - a.totalDuration);

        return {
            totalDuration,
            operationSummary,
            apiSummary,
            bottlenecks: this.metrics.bottlenecks,
            recommendations: this.generateRecommendations()
        };
    }

    generateRecommendations() {
        const recommendations = [];
        const totalDuration = Date.now() - this.metrics.startTime;
        
        // Check operation bottlenecks
        Object.entries(this.metrics.operations).forEach(([name, data]) => {
            if (data.duration) {
                const percentage = ((data.duration / totalDuration) * 100).toFixed(2);
                if (percentage > 20) {
                    recommendations.push(`🔴 ${name} takes ${percentage}% of total time - consider optimization`);
                }
            }
        });
        
        // Check API bottlenecks
        Object.entries(this.metrics.apiCalls).forEach(([name, data]) => {
            if (data.count > 10) {
                recommendations.push(`🔴 ${name}: ${data.count} calls taking ${data.totalDuration}ms - consider batching or caching`);
            }
            if (data.averageDuration > 2000) {
                recommendations.push(`🟡 ${name}: slow average response (${data.averageDuration}ms) - check network or API limits`);
            }
        });
        
        const totalApiCalls = Object.values(this.metrics.apiCalls).reduce((sum, api) => sum + api.count, 0);
        if (totalApiCalls > 50) {
            recommendations.push(`🔴 High API call count (${totalApiCalls}) - implement caching and reduce redundant calls`);
        }
        
        return recommendations;
    }

    printReport() {
        const summary = this.getSummary();
        
        console.log('\n📊 PERFORMANCE REPORT');
        console.log('=' .repeat(50));
        console.log(`⏱️  Total Execution Time: ${summary.totalDuration}ms (${(summary.totalDuration / 1000).toFixed(2)}s)`);
        
        console.log('\n🔍 Operation Breakdown:');
        summary.operationSummary.forEach(op => {
            console.log(`   ${op.name}: ${op.duration}ms (${op.percentage}%)`);
        });
        
        console.log('\n🌐 API Call Analysis:');
        summary.apiSummary.forEach(api => {
            console.log(`   ${api.name}: ${api.count} calls, ${api.totalDuration}ms total, ${api.averageDuration.toFixed(0)}ms avg`);
        });
        
        console.log('\n🚨 Bottlenecks:');
        summary.bottlenecks.forEach(bottleneck => {
            console.log(`   ${bottleneck.description}: ${bottleneck.duration}ms (${bottleneck.impact})`);
        });
        
        console.log('\n💡 Recommendations:');
        summary.recommendations.forEach(rec => {
            console.log(`   ${rec}`);
        });
        
        console.log('=' .repeat(50));
    }
}

let globalMonitor = null;

export function getPerformanceMonitor() {
    if (!globalMonitor) {
        globalMonitor = new PerformanceMonitor();
    }
    return globalMonitor;
}

export { PerformanceMonitor };
