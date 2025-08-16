// src/utils/cache-manager.js

import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';

class CacheManager {
    constructor(options = {}) {
        this.cacheDir = options.cacheDir || './data/github-cache';
        this.defaultTTL = options.defaultTTL || 3600000; // 1 hour default
        this.maxMemorySize = options.maxMemorySize || 200;
        this.memoryCache = new Map();
        this.stats = {
            hits: 0,
            misses: 0,
            memoryHits: 0,
            diskHits: 0,
            writes: 0
        };
    }

    // Generate a cache key from parameters
    generateKey(prefix, ...params) {
        const keyString = `${prefix}:${params.join('_')}`;
        return crypto.createHash('md5').update(keyString).digest('hex');
    }

    // Get data from cache (memory first, then disk)
    async get(key) {
        // Check memory cache first
        const memoryCached = this.memoryCache.get(key);
        if (memoryCached && this.isValid(memoryCached)) {
            this.stats.hits++;
            this.stats.memoryHits++;
            return memoryCached.data;
        }

        // Check disk cache
        try {
            const filePath = path.join(this.cacheDir, `${key}.json`);
            const fileContent = await fs.readFile(filePath, 'utf8');
            const cached = JSON.parse(fileContent);
            
            if (this.isValid(cached)) {
                // Add to memory cache for faster access
                this.setMemoryCache(key, cached);
                this.stats.hits++;
                this.stats.diskHits++;
                return cached.data;
            }
        } catch (error) {
            // File doesn't exist or is invalid
        }

        this.stats.misses++;
        return null;
    }

    // Set data in cache (both memory and disk)
    async set(key, data, ttl = this.defaultTTL) {
        const cached = {
            data,
            timestamp: Date.now(),
            ttl
        };

        // Set in memory cache
        this.setMemoryCache(key, cached);

        // Set in disk cache
        try {
            await this.ensureCacheDir();
            const filePath = path.join(this.cacheDir, `${key}.json`);
            await fs.writeFile(filePath, JSON.stringify(cached, null, 2));
            this.stats.writes++;
        } catch (error) {
            console.error('Failed to write to disk cache:', error.message);
        }
    }

    // Set data in memory cache with size management
    setMemoryCache(key, cached) {
        // Remove oldest entries if cache is full
        if (this.memoryCache.size >= this.maxMemorySize) {
            const firstKey = this.memoryCache.keys().next().value;
            this.memoryCache.delete(firstKey);
        }
        this.memoryCache.set(key, cached);
    }

    // Check if cached data is still valid
    isValid(cached) {
        return Date.now() - cached.timestamp < cached.ttl;
    }

    // Ensure cache directory exists
    async ensureCacheDir() {
        try {
            await fs.access(this.cacheDir);
        } catch {
            await fs.mkdir(this.cacheDir, { recursive: true });
        }
    }

    // Clean up expired cache entries
    async cleanup() {
        console.log('🧹 Cleaning up expired cache entries...');
        
        // Clean memory cache
        for (const [key, cached] of this.memoryCache.entries()) {
            if (!this.isValid(cached)) {
                this.memoryCache.delete(key);
            }
        }

        // Clean disk cache
        try {
            const files = await fs.readdir(this.cacheDir);
            let cleanedCount = 0;
            
            for (const file of files) {
                if (file.endsWith('.json')) {
                    try {
                        const filePath = path.join(this.cacheDir, file);
                        const content = await fs.readFile(filePath, 'utf8');
                        const cached = JSON.parse(content);
                        
                        if (!this.isValid(cached)) {
                            await fs.unlink(filePath);
                            cleanedCount++;
                        }
                    } catch (error) {
                        // Invalid file, remove it
                        await fs.unlink(path.join(this.cacheDir, file));
                        cleanedCount++;
                    }
                }
            }
            
            console.log(`✅ Cleaned up ${cleanedCount} expired cache entries`);
        } catch (error) {
            console.error('Error during cache cleanup:', error.message);
        }
    }

    // Get cache statistics
    getStats() {
        const totalRequests = this.stats.hits + this.stats.misses;
        const hitRate = totalRequests > 0 ? (this.stats.hits / totalRequests * 100).toFixed(2) : 0;
        
        return {
            hitRate: `${hitRate}%`,
            memoryHits: this.stats.memoryHits,
            diskHits: this.stats.diskHits,
            totalHits: this.stats.hits,
            misses: this.stats.misses,
            writes: this.stats.writes,
            memorySize: this.memoryCache.size,
            maxMemorySize: this.maxMemorySize
        };
    }

    // Clear all cache
    async clear() {
        this.memoryCache.clear();
        this.stats = {
            hits: 0,
            misses: 0,
            memoryHits: 0,
            diskHits: 0,
            writes: 0
        };
        
        try {
            const files = await fs.readdir(this.cacheDir);
            for (const file of files) {
                if (file.endsWith('.json')) {
                    await fs.unlink(path.join(this.cacheDir, file));
                }
            }
            console.log('✅ All cache cleared');
        } catch (error) {
            console.error('Error clearing disk cache:', error.message);
        }
    }

    // Preload specific keys into memory cache
    async preload(keys) {
        for (const key of keys) {
            try {
                const filePath = path.join(this.cacheDir, `${key}.json`);
                const content = await fs.readFile(filePath, 'utf8');
                const cached = JSON.parse(content);
                
                if (this.isValid(cached)) {
                    this.setMemoryCache(key, cached);
                }
            } catch (error) {
                // Key doesn't exist or is invalid
            }
        }
    }
}

// Singleton instance
let cacheManagerInstance = null;

export function getCacheManager(options = {}) {
    if (!cacheManagerInstance) {
        cacheManagerInstance = new CacheManager(options);
    }
    return cacheManagerInstance;
}

export default CacheManager;
