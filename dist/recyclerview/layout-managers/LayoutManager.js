// Interface of layout manager for app's listviews
import { MultiTypeAverageWindow } from "../../utils/AverageWindow";
import { ConsecutiveNumbers } from "../helpers/ConsecutiveNumbers";
import { findFirstVisibleIndex, findLastVisibleIndex, } from "../utils/findVisibleIndex";
import { areDimensionsNotEqual } from "../utils/measureLayout";
import { ErrorMessages } from "../../errors/ErrorMessages";
/**
 * Base abstract class for layout managers in the recycler view system.
 * Provides common functionality for managing item layouts and dimensions.
 * Supports both horizontal and vertical layouts with dynamic item sizing.
 */
export class RVLayoutManager {
    constructor(params, previousLayoutManager) {
        var _a, _b;
        /** Flag indicating if the layout requires repainting */
        this.requiresRepaint = false;
        /** Maximum number of items to process in a single layout pass */
        this.maxItemsToProcess = 250;
        /** Information about item spans and sizes */
        this.spanSizeInfo = {};
        /** Span tracker for each item */
        this.spanTracker = [];
        /** Current max index with changed layout */
        this.currentMaxIndexWithChangedLayout = -1;
        /**
         * Last index that was skipped during layout computation.
         * Used to determine if a layout needs to be recomputed.
         */
        this.lastSkippedLayoutIndex = Number.MAX_VALUE;
        this.heightAverageWindow = new MultiTypeAverageWindow(5, 200);
        this.widthAverageWindow = new MultiTypeAverageWindow(5, 200);
        this.getItemType = params.getItemType;
        this.overrideItemLayout = params.overrideItemLayout;
        this.layouts = (_a = previousLayoutManager === null || previousLayoutManager === void 0 ? void 0 : previousLayoutManager.layouts) !== null && _a !== void 0 ? _a : [];
        if (previousLayoutManager) {
            this.updateLayoutParams(params);
        }
        else {
            this.horizontal = Boolean(params.horizontal);
            this.windowSize = params.windowSize;
            this.maxColumns = (_b = params.maxColumns) !== null && _b !== void 0 ? _b : 1;
        }
    }
    /**
     * Gets the estimated width for an item based on its type.
     * @param index Index of the item
     * @returns Estimated width
     */
    getEstimatedWidth(index) {
        return this.widthAverageWindow.getCurrentValue(this.getItemType(index));
    }
    /**
     * Gets the estimated height for an item based on its type.
     * @param index Index of the item
     * @returns Estimated height
     */
    getEstimatedHeight(index) {
        return this.heightAverageWindow.getCurrentValue(this.getItemType(index));
    }
    /**
     * Checks if the layout is horizontal.
     * @returns True if horizontal, false if vertical
     */
    isHorizontal() {
        return this.horizontal;
    }
    /**
     * Gets the dimensions of the visible window.
     * @returns Window dimensions
     */
    getWindowsSize() {
        return this.windowSize;
    }
    /**
     * Gets indices of items currently visible in the viewport.
     * Uses binary search for efficient lookup.
     * @param unboundDimensionStart Start position of viewport (start X or start Y)
     * @param unboundDimensionEnd End position of viewport (end X or end Y)
     * @returns ConsecutiveNumbers containing visible indices
     */
    getVisibleLayouts(unboundDimensionStart, unboundDimensionEnd) {
        // Find the first visible index
        const firstVisibleIndex = findFirstVisibleIndex(this.layouts, unboundDimensionStart, this.horizontal);
        // Find the last visible index
        const lastVisibleIndex = findLastVisibleIndex(this.layouts, unboundDimensionEnd, this.horizontal);
        // Collect the indices in the range
        if (firstVisibleIndex !== -1 && lastVisibleIndex !== -1) {
            return new ConsecutiveNumbers(firstVisibleIndex, lastVisibleIndex);
        }
        return ConsecutiveNumbers.EMPTY;
    }
    /**
     * Removes layout information for specified indices and recomputes layout.
     * @param indices Array of indices to remove
     */
    deleteLayout(indices) {
        // Sort indices in descending order
        indices.sort((num1, num2) => num2 - num1);
        // Remove elements from the array
        for (const index of indices) {
            this.layouts.splice(index, 1);
        }
        const startIndex = Math.min(...indices);
        // Recompute layouts starting from the smallest index in the original indices array
        this._recomputeLayouts(this.getMinRecomputeIndex(startIndex), this.getMaxRecomputeIndex(startIndex));
    }
    /**
     * Updates layout information for items and recomputes layout if necessary.
     * @param layoutInfo Array of layout information for items (real measurements)
     * @param totalItemCount Total number of items in the list
     */
    modifyLayout(layoutInfo, totalItemCount) {
        var _a;
        this.maxItemsToProcess = Math.max(this.maxItemsToProcess, layoutInfo.length * 10);
        let minRecomputeIndex = Number.MAX_VALUE;
        if (this.layouts.length > totalItemCount) {
            this.layouts.length = totalItemCount;
            this.spanTracker.length = totalItemCount;
            minRecomputeIndex = totalItemCount - 1; // <0 gets skipped so it's safe to set to totalItemCount - 1
            // layoutInfo may contain stale indices from ViewHolders that were rendered
            // before the data shrunk. Filter out any indices that are now out of bounds.
            // eslint-disable-next-line no-param-reassign
            layoutInfo = layoutInfo.filter((info) => info.index < totalItemCount);
        }
        // update average windows
        minRecomputeIndex = Math.min(minRecomputeIndex, this.computeEstimatesAndMinMaxChangedLayout(layoutInfo));
        if (this.layouts.length < totalItemCount && totalItemCount > 0) {
            const startIndex = this.layouts.length;
            this.layouts.length = totalItemCount;
            this.spanTracker.length = totalItemCount;
            for (let i = startIndex; i < totalItemCount; i++) {
                this.getLayout(i);
                this.getSpan(i);
            }
            this.recomputeLayouts(startIndex, totalItemCount - 1);
        }
        // compute minRecomputeIndex
        minRecomputeIndex = Math.min(minRecomputeIndex, this.lastSkippedLayoutIndex, this.computeMinIndexWithChangedSpan(layoutInfo), (_a = this.processLayoutInfo(layoutInfo, totalItemCount)) !== null && _a !== void 0 ? _a : minRecomputeIndex, this.computeEstimatesAndMinMaxChangedLayout(layoutInfo));
        if (minRecomputeIndex >= 0 && minRecomputeIndex < totalItemCount) {
            const maxRecomputeIndex = this.getMaxRecomputeIndex(minRecomputeIndex);
            this._recomputeLayouts(minRecomputeIndex, maxRecomputeIndex);
        }
        this.currentMaxIndexWithChangedLayout = -1;
    }
    /**
     * Gets layout information for an item at the given index.
     * Creates and initializes a new layout if one doesn't exist.
     * @param index Index of the item
     * @returns Layout information for the item
     */
    getLayout(index) {
        if (index >= this.layouts.length) {
            throw new Error(ErrorMessages.indexOutOfBounds);
        }
        let layout = this.layouts[index];
        if (!layout) {
            // Create new layout with estimated dimensions
            layout = {
                x: 0,
                y: 0,
                width: 0,
                height: 0,
            };
            this.layouts[index] = layout;
        }
        if (!layout.isWidthMeasured || !layout.isHeightMeasured) {
            this.estimateLayout(index);
        }
        return layout;
    }
    /**
     * Updates layout parameters and triggers recomputation if necessary.
     * @param params New layout parameters
     */
    updateLayoutParams(params) {
        var _a, _b, _c;
        this.windowSize = params.windowSize;
        this.horizontal = (_a = params.horizontal) !== null && _a !== void 0 ? _a : this.horizontal;
        this.maxColumns = (_b = params.maxColumns) !== null && _b !== void 0 ? _b : this.maxColumns;
        this.optimizeItemArrangement =
            (_c = params.optimizeItemArrangement) !== null && _c !== void 0 ? _c : this.optimizeItemArrangement;
    }
    getLayoutCount() {
        return this.layouts.length;
    }
    /**
     * Returns whether the item at the given index is in the last row of the layout.
     * Used to suppress separators for all items in the last row, preventing
     * height mismatch when the last data item has no separator.
     *
     * Base implementation returns false — only layouts that normalize heights
     * across multiple items (e.g., grid) need to override this.
     * @param index Index of the item
     * @returns True if the item is in the last row
     */
    isInLastRow(index) {
        return false;
    }
    /**
     * Gets span for an item, applying any overrides.
     * This is intended to be called during a relayout call. The value is tracked and used to determine if a span change has occurred.
     * If skipTracking is true, the operation is not tracked. Can be useful if span is required outside of a relayout call.
     * The tracker is used to call handleSpanChange if a span change has occurred before relayout call.
     * // TODO: improve this contract.
     * @param index Index of the item
     * @returns Span for the item
     */
    getSpan(index, skipTracking = false) {
        var _a;
        this.spanSizeInfo.span = undefined;
        this.overrideItemLayout(index, this.spanSizeInfo);
        const span = Math.min((_a = this.spanSizeInfo.span) !== null && _a !== void 0 ? _a : 1, this.maxColumns);
        if (!skipTracking) {
            this.spanTracker[index] = span;
        }
        return span;
    }
    /**
     * Method to handle span change for an item. Can be overridden by subclasses.
     * @param index Index of the item
     */
    handleSpanChange(index) { }
    /**
     * Gets the maximum index to process in a single layout pass.
     * @param startIndex Starting index
     * @returns Maximum index to process
     */
    getMaxRecomputeIndex(startIndex) {
        return Math.min(Math.max(startIndex, this.currentMaxIndexWithChangedLayout) +
            this.maxItemsToProcess, this.layouts.length - 1);
    }
    /**
     * Gets the minimum index to process in a single layout pass.
     * @param startIndex Starting index
     * @returns Minimum index to process
     */
    getMinRecomputeIndex(startIndex) {
        return startIndex;
    }
    _recomputeLayouts(startIndex, endIndex) {
        this.recomputeLayouts(startIndex, endIndex);
        if (this.lastSkippedLayoutIndex >= startIndex &&
            this.lastSkippedLayoutIndex <= endIndex) {
            this.lastSkippedLayoutIndex = Number.MAX_VALUE;
        }
        if (endIndex + 1 < this.layouts.length) {
            this.lastSkippedLayoutIndex = Math.min(endIndex + 1, this.lastSkippedLayoutIndex);
            const lastIndex = this.layouts.length - 1;
            // Since layout managers derive height from last indices we need to make
            // sure they're not too much out of sync.
            if (this.layouts[lastIndex].y < this.layouts[endIndex].y) {
                this.recomputeLayouts(this.lastSkippedLayoutIndex, lastIndex);
                this.lastSkippedLayoutIndex = Number.MAX_VALUE;
            }
        }
    }
    /**
     * Computes size estimates and finds the minimum recompute index.
     * @param layoutInfo Array of layout information for items
     * @returns Minimum index that needs recomputation
     */
    computeEstimatesAndMinMaxChangedLayout(layoutInfo) {
        let minRecomputeIndex = Number.MAX_VALUE;
        for (const info of layoutInfo) {
            const { index, dimensions } = info;
            const storedLayout = this.layouts[index];
            if (index >= this.lastSkippedLayoutIndex ||
                !storedLayout ||
                !storedLayout.isHeightMeasured ||
                !storedLayout.isWidthMeasured ||
                areDimensionsNotEqual(storedLayout.height, dimensions.height) ||
                areDimensionsNotEqual(storedLayout.width, dimensions.width)) {
                minRecomputeIndex = Math.min(minRecomputeIndex, index);
                this.currentMaxIndexWithChangedLayout = Math.max(this.currentMaxIndexWithChangedLayout, index);
            }
            this.heightAverageWindow.addValue(dimensions.height, this.getItemType(index));
            this.widthAverageWindow.addValue(dimensions.width, this.getItemType(index));
        }
        return minRecomputeIndex;
    }
    computeMinIndexWithChangedSpan(layoutInfo) {
        let minIndexWithChangedSpan = Number.MAX_VALUE;
        for (const info of layoutInfo) {
            const { index } = info;
            const span = this.getSpan(index, true);
            const storedSpan = this.spanTracker[index];
            if (span !== storedSpan) {
                this.spanTracker[index] = span;
                this.handleSpanChange(index);
                minIndexWithChangedSpan = Math.min(minIndexWithChangedSpan, index);
            }
        }
        return minIndexWithChangedSpan;
    }
}
//# sourceMappingURL=LayoutManager.js.map