/**
 * Manages the recycling of rendered items in a virtualized list.
 * This class handles tracking, recycling, and reusing item keys to optimize
 * rendering performance by minimizing creation/destruction of components.
 */
export class RenderStackManager {
    /**
     * @param maxItemsInRecyclePool - Maximum number of items that can be in the recycle pool
     */
    constructor(maxItemsInRecyclePool = Number.MAX_SAFE_INTEGER) {
        this.disableRecycling = false;
        this.maxItemsInRecyclePool = maxItemsInRecyclePool;
        this.recycleKeyPools = new Map();
        this.keyMap = new Map();
        this.stableIdMap = new Map();
        this.keyCounter = 0;
        this.unProcessedIndices = new Set();
    }
    /**
     * Synchronizes the render stack with the current state of data.
     * This method is the core orchestrator that:
     * 1. Recycles keys for items that are no longer valid
     * 2. Updates existing keys for items that remain visible
     * 3. Assigns new keys for newly visible items
     * 4. Cleans up excess items to maintain the recycling pool size
     *
     * @param getStableId - Function to get a stable identifier for an item at a specific index
     * @param getItemType - Function to get the type of an item at a specific index
     * @param engagedIndices - Collection of indices that are currently visible or engaged
     * @param dataLength - Total length of the data set
     */
    sync(getStableId, getItemType, engagedIndices, dataLength) {
        this.clearRecyclePool();
        this.unProcessedIndices.clear();
        // Recycle keys for items that are no longer valid or visible
        this.keyMap.forEach((keyInfo, key) => {
            const { index, stableId, itemType } = keyInfo;
            if (index >= dataLength) {
                this.recycleKey(key);
                return;
            }
            if (!this.disableRecycling) {
                this.unProcessedIndices.add(index);
            }
            if (!engagedIndices.includes(index)) {
                this.recycleKey(key);
                return;
            }
            const newStableId = getStableId(index);
            const newItemType = getItemType(index);
            if (stableId !== newStableId || itemType !== newItemType) {
                this.recycleKey(key);
            }
        });
        // First pass: process items that already have optimized keys
        for (const index of engagedIndices) {
            if (this.hasOptimizedKey(getStableId(index))) {
                this.syncItem(index, getItemType(index), getStableId(index));
            }
        }
        // Second pass: process remaining items that need new keys
        for (const index of engagedIndices) {
            if (!this.hasOptimizedKey(getStableId(index))) {
                this.syncItem(index, getItemType(index), getStableId(index));
            }
        }
        // create indices that are not in the engagedIndices and less than dataLength
        // select only indices that are not in the engagedIndices
        const validIndicesInPool = [];
        for (const keyInfo of this.keyMap.values()) {
            const index = keyInfo.index;
            if (index < dataLength && !engagedIndices.includes(index)) {
                validIndicesInPool.push(index);
            }
        }
        // First pass: process items that already have optimized keys
        for (const index of validIndicesInPool) {
            if (this.hasOptimizedKey(getStableId(index))) {
                this.syncItem(index, getItemType(index), getStableId(index));
            }
        }
        for (const index of validIndicesInPool) {
            if (!this.hasOptimizedKey(getStableId(index))) {
                this.syncItem(index, getItemType(index), getStableId(index));
            }
        }
        // Clean up stale items and manage the recycle pool size
        this.cleanup(getStableId, getItemType, engagedIndices, dataLength);
    }
    /**
     * Checks if a stable ID already has an assigned key
     */
    hasOptimizedKey(stableId) {
        return this.stableIdMap.has(stableId);
    }
    /**
     * Cleans up stale keys and manages the recycle pool size.
     * This ensures we don't maintain references to items that are no longer in the dataset,
     * and limits the number of recycled items to avoid excessive memory usage.
     */
    cleanup(getStableId, getItemType, engagedIndices, dataLength) {
        const itemsToDelete = new Array();
        // Remove items that are no longer in the dataset
        for (const [key, keyInfo] of this.keyMap.entries()) {
            const { index, itemType, stableId } = keyInfo;
            const indexOutOfBounds = index >= dataLength;
            const hasStableIdChanged = !indexOutOfBounds && getStableId(index) !== stableId;
            if (indexOutOfBounds || hasStableIdChanged) {
                const nextIndex = this.unProcessedIndices.values().next().value;
                let shouldDeleteKey = true;
                if (nextIndex !== undefined) {
                    const nextItemType = getItemType(nextIndex);
                    const nextStableId = getStableId(nextIndex);
                    if (itemType === nextItemType) {
                        this.syncItem(nextIndex, nextItemType, nextStableId);
                        shouldDeleteKey = false;
                    }
                }
                if (shouldDeleteKey) {
                    this.deleteKeyFromRecyclePool(itemType, key);
                    this.stableIdMap.delete(stableId);
                    itemsToDelete.push(key);
                }
            }
        }
        for (const key of itemsToDelete) {
            this.keyMap.delete(key);
        }
        // Limit the size of the recycle pool
        const itemsRenderedForRecycling = this.keyMap.size - engagedIndices.length;
        if (itemsRenderedForRecycling > this.maxItemsInRecyclePool) {
            const deleteCount = itemsRenderedForRecycling - this.maxItemsInRecyclePool;
            let deleted = 0;
            // Use a for loop so we can break early once we've deleted enough items
            const entries = Array.from(this.keyMap.entries()).reverse();
            for (let i = 0; i < entries.length && deleted < deleteCount; i++) {
                const [key, keyInfo] = entries[i];
                const { index, itemType, stableId } = keyInfo;
                if (!engagedIndices.includes(index)) {
                    this.deleteKeyFromRecyclePool(itemType, key);
                    this.stableIdMap.delete(stableId);
                    this.keyMap.delete(key);
                    deleted++;
                }
            }
        }
    }
    /**
     * Places a key back into its type-specific recycle pool for future reuse
     */
    recycleKey(key) {
        if (this.disableRecycling) {
            return;
        }
        const keyInfo = this.keyMap.get(key);
        if (!keyInfo) {
            return;
        }
        const { itemType } = keyInfo;
        // Add key back to its type's pool
        const pool = this.getRecyclePoolForType(itemType);
        pool.add(key);
    }
    /**
     * Returns the current render stack containing all active keys and their metadata
     */
    getRenderStack() {
        return this.keyMap;
    }
    /**
     * Syncs an individual item by assigning it an appropriate key.
     * Will use an existing key if available, or generate a new one.
     *
     * @returns The key assigned to the item
     */
    syncItem(index, itemType, stableId) {
        // Try to reuse an existing key, or get one from the recycle pool, or generate a new one
        const newKey = this.stableIdMap.get(stableId) ||
            this.getKeyFromRecyclePool(itemType) ||
            this.generateKey();
        this.unProcessedIndices.delete(index);
        const keyInfo = this.keyMap.get(newKey);
        if (keyInfo) {
            // Update an existing key's metadata
            this.deleteKeyFromRecyclePool(itemType, newKey);
            this.deleteKeyFromRecyclePool(keyInfo.itemType, newKey);
            this.stableIdMap.delete(keyInfo.stableId);
            keyInfo.index = index;
            keyInfo.itemType = itemType;
            keyInfo.stableId = stableId;
        }
        else {
            // Create a new entry in the key map
            this.keyMap.set(newKey, {
                itemType,
                index,
                stableId,
            });
        }
        this.stableIdMap.set(stableId, newKey);
        return newKey;
    }
    /**
     * Clears all recycled keys from the pool, effectively resetting the recycling system.
     * This operation does not affect currently active keys.
     */
    clearRecyclePool() {
        // iterate over all pools and clear them
        for (const pool of this.recycleKeyPools.values()) {
            pool.clear();
        }
    }
    /**
     * Generates a unique sequential key using an internal counter.
     * @returns A unique key as a string
     */
    generateKey() {
        return (this.keyCounter++).toString();
    }
    /**
     * Removes a specific key from its type's recycle pool
     */
    deleteKeyFromRecyclePool(itemType, key) {
        var _a;
        (_a = this.recycleKeyPools.get(itemType)) === null || _a === void 0 ? void 0 : _a.delete(key);
    }
    /**
     * Gets or creates a recycle pool for a specific item type
     */
    getRecyclePoolForType(itemType) {
        let pool = this.recycleKeyPools.get(itemType);
        if (!pool) {
            pool = new Set();
            this.recycleKeyPools.set(itemType, pool);
        }
        return pool;
    }
    /**
     * Retrieves and removes a key from the type's recycle pool
     * @returns A recycled key or undefined if none available
     */
    getKeyFromRecyclePool(itemType) {
        const pool = this.getRecyclePoolForType(itemType);
        if (pool.size > 0) {
            const key = pool.values().next().value;
            pool.delete(key);
            return key;
        }
        return undefined;
    }
}
//# sourceMappingURL=RenderStackManager.js.map