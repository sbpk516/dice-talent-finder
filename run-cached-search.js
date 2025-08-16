#!/usr/bin/env node

import { runWithSampleJob } from './src/ultimate-cached-pipeline.js';

console.log('🚀 Running Cached GitHub Search...');
console.log('This will use AI skill extraction and intelligent caching for optimal performance!');
console.log('');

runWithSampleJob()
    .then(() => {
        console.log('✅ Cached search completed successfully!');
    })
    .catch((error) => {
        console.error('❌ Error running cached search:', error);
    });
