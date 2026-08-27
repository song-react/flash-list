import { ErrorMessages } from "../errors/ErrorMessages";
import { WarningMessages } from "../errors/WarningMessages";
import ViewabilityManager from "./viewability/ViewabilityManager";
import { RVGridLayoutManagerImpl } from "./layout-managers/GridLayoutManager";
import { RVLinearLayoutManagerImpl } from "./layout-managers/LinearLayoutManager";
import { RVMasonryLayoutManagerImpl } from "./layout-managers/MasonryLayoutManager";
import { RVEngagedIndicesTrackerImpl, } from "./helpers/EngagedIndicesTracker";
import { ConsecutiveNumbers } from "./helpers/ConsecutiveNumbers";
import { RenderStackManager } from "./RenderStackManager";
// Abstracts layout manager, render stack manager and viewability manager and generates render stack (progressively on load)
export class RecyclerViewManager {
    get animationOptimizationsEnabled() {
        return this._animationOptimizationsEnabled;
    }
    set animationOptimizationsEnabled(value) {
        this._animationOptimizationsEnabled = value;
        this.renderStackManager.disableRecycling = value;
    }
    get isOffsetProjectionEnabled() {
        return this.engagedIndicesTracker.enableOffsetProjection;
    }
    get isDisposed() {
        return this._isDisposed;
    }
    get numColumns() {
        var _a;
        return (_a = this.propsRef.numColumns) !== null && _a !== void 0 ? _a : 1;
    }
    constructor(props) {
        this.initialDrawBatchSize = 2;
        // Map of index to key
        this.isFirstLayoutComplete = false;
        this.hasRenderedProgressively = false;
        this.progressiveRenderCount = 0;
        this._isDisposed = false;
        this._isLayoutManagerDirty = false;
        this._animationOptimizationsEnabled = false;
        this.firstItemOffset = 0;
        this.ignoreScrollEvents = false;
        this.isFirstPaintOnUiComplete = false;
        this.isInitialScrollComplete = false;
        // updates render stack based on the engaged indices which are sorted. Recycles unused keys.
        this.updateRenderStack = (engagedIndices) => {
            this.renderStackManager.sync(this.getDataKey, this.getItemType, engagedIndices, this.getDataLength());
        };
        this.getDataKey = this.getDataKey.bind(this);
        this.getItemType = this.getItemType.bind(this);
        this.overrideItemLayout = this.overrideItemLayout.bind(this);
        this.propsRef = props;
        this.engagedIndicesTracker = new RVEngagedIndicesTrackerImpl();
        this.renderStackManager = new RenderStackManager(props.maxItemsInRecyclePool);
        this.itemViewabilityManager = new ViewabilityManager(this);
        this.isInitialScrollComplete = this.getInitialScrollIndex() === undefined;
        this.checkPropsAndWarn();
    }
    get props() {
        return this.propsRef;
    }
    setOffsetProjectionEnabled(value) {
        this.engagedIndicesTracker.enableOffsetProjection = value;
    }
    updateProps(props) {
        var _a, _b, _c;
        this.propsRef = props;
        this.engagedIndicesTracker.drawDistance =
            (_a = props.drawDistance) !== null && _a !== void 0 ? _a : this.engagedIndicesTracker.drawDistance;
        this.initialDrawBatchSize =
            (_c = (_b = this.propsRef.overrideProps) === null || _b === void 0 ? void 0 : _b.initialDrawBatchSize) !== null && _c !== void 0 ? _c : this.initialDrawBatchSize;
    }
    /**
     * Updates the scroll offset and returns the engaged indices if any
     * @param offset
     * @param velocity
     */
    updateScrollOffset(offset, velocity) {
        if (this.layoutManager && !this._isDisposed) {
            const engagedIndices = this.engagedIndicesTracker.updateScrollOffset(offset - this.firstItemOffset, velocity, this.layoutManager);
            if (engagedIndices) {
                this.updateRenderStack(engagedIndices);
                return engagedIndices;
            }
        }
        return undefined;
    }
    updateAverageRenderTime(time) {
        this.engagedIndicesTracker.averageRenderTime = time;
    }
    getIsFirstLayoutComplete() {
        return this.isFirstLayoutComplete;
    }
    getLayout(index) {
        if (!this.layoutManager) {
            throw new Error(ErrorMessages.layoutManagerNotInitializedLayoutInfo);
        }
        return this.layoutManager.getLayout(index);
    }
    tryGetLayout(index) {
        if (this.layoutManager &&
            index >= 0 &&
            index < this.layoutManager.getLayoutCount()) {
            return this.layoutManager.getLayout(index);
        }
        return undefined;
    }
    isInLastRow(index) {
        var _a, _b;
        return (_b = (_a = this.layoutManager) === null || _a === void 0 ? void 0 : _a.isInLastRow(index)) !== null && _b !== void 0 ? _b : false;
    }
    // Doesn't include header / foot etc
    getChildContainerDimensions() {
        if (!this.layoutManager) {
            throw new Error(ErrorMessages.layoutManagerNotInitializedChildContainer);
        }
        return this.layoutManager.getLayoutSize();
    }
    getRenderStack() {
        return this.renderStackManager.getRenderStack();
    }
    getWindowSize() {
        if (!this.layoutManager) {
            throw new Error(ErrorMessages.layoutManagerNotInitializedWindowSize);
        }
        return this.layoutManager.getWindowsSize();
    }
    // Includes first item offset correction
    getLastScrollOffset() {
        return this.engagedIndicesTracker.scrollOffset;
    }
    getMaxScrollOffset() {
        return Math.max(0, (this.propsRef.horizontal
            ? this.getChildContainerDimensions().width
            : this.getChildContainerDimensions().height) -
            (this.propsRef.horizontal
                ? this.getWindowSize().width
                : this.getWindowSize().height) +
            this.firstItemOffset);
    }
    // Doesn't include first item offset correction
    getAbsoluteLastScrollOffset() {
        return this.engagedIndicesTracker.scrollOffset + this.firstItemOffset;
    }
    setScrollDirection(scrollDirection) {
        this.engagedIndicesTracker.setScrollDirection(scrollDirection);
    }
    resetVelocityCompute() {
        this.engagedIndicesTracker.resetVelocityHistory();
    }
    updateLayoutParams(windowSize, firstItemOffset) {
        var _a, _b;
        this.firstItemOffset = firstItemOffset;
        const LayoutManagerClass = this.getLayoutManagerClass();
        if (this.layoutManager &&
            Boolean((_a = this.layoutManager) === null || _a === void 0 ? void 0 : _a.isHorizontal()) !==
                Boolean(this.propsRef.horizontal)) {
            throw new Error(ErrorMessages.horizontalPropCannotBeToggled);
        }
        if (this._isLayoutManagerDirty) {
            this.layoutManager = undefined;
            this._isLayoutManagerDirty = false;
        }
        const layoutManagerParams = {
            windowSize,
            maxColumns: this.numColumns,
            horizontal: Boolean(this.propsRef.horizontal),
            optimizeItemArrangement: (_b = this.propsRef.optimizeItemArrangement) !== null && _b !== void 0 ? _b : true,
            overrideItemLayout: this.overrideItemLayout,
            getItemType: this.getItemType,
        };
        if (!(this.layoutManager instanceof LayoutManagerClass)) {
            // console.log("-----> new LayoutManagerClass");
            this.layoutManager = new LayoutManagerClass(layoutManagerParams, this.layoutManager);
        }
        else {
            this.layoutManager.updateLayoutParams(layoutManagerParams);
        }
    }
    hasLayout() {
        return this.layoutManager !== undefined;
    }
    computeVisibleIndices() {
        if (!this.layoutManager) {
            throw new Error(ErrorMessages.layoutManagerNotInitializedVisibleIndices);
        }
        return this.engagedIndicesTracker.computeVisibleIndices(this.layoutManager);
    }
    getEngagedIndices() {
        return this.engagedIndicesTracker.getEngagedIndices();
    }
    modifyChildrenLayout(layoutInfo, dataLength) {
        var _a, _b;
        (_a = this.layoutManager) === null || _a === void 0 ? void 0 : _a.modifyLayout(layoutInfo, dataLength);
        if (dataLength === 0) {
            return false;
        }
        if ((_b = this.layoutManager) === null || _b === void 0 ? void 0 : _b.requiresRepaint) {
            // console.log("requiresRepaint triggered");
            this.layoutManager.requiresRepaint = false;
            return true;
        }
        if (this.hasRenderedProgressively) {
            if (!this.isFirstPaintOnUiComplete) {
                return false;
            }
            return this.recomputeEngagedIndices() !== undefined;
        }
        else {
            this.renderProgressively();
        }
        return !this.hasRenderedProgressively;
    }
    computeItemViewability() {
        // Using higher buffer for masonry to avoid missing items
        this.itemViewabilityManager.shouldListenToVisibleIndices &&
            this.itemViewabilityManager.updateViewableItems(this.propsRef.masonry
                ? this.engagedIndicesTracker.getEngagedIndices().toArray()
                : this.computeVisibleIndices().toArray());
    }
    recordInteraction() {
        this.itemViewabilityManager.recordInteraction();
    }
    recomputeViewableItems() {
        this.itemViewabilityManager.clearLastReportedViewableIndices();
        this.computeItemViewability();
    }
    processDataUpdate() {
        var _a, _b;
        if (this.hasLayout()) {
            this.modifyChildrenLayout([], (_b = (_a = this.propsRef.data) === null || _a === void 0 ? void 0 : _a.length) !== null && _b !== void 0 ? _b : 0);
            if (this.hasRenderedProgressively && !this.recomputeEngagedIndices()) {
                // recomputeEngagedIndices will update the render stack if there are any changes in the engaged indices.
                // It's important to update render stack so that elements are assgined right keys incase items were deleted.
                this.updateRenderStack(this.engagedIndicesTracker.getEngagedIndices());
            }
        }
    }
    recomputeEngagedIndices() {
        return this.updateScrollOffset(this.getAbsoluteLastScrollOffset());
    }
    restoreIfNeeded() {
        if (this._isDisposed) {
            this._isDisposed = false;
        }
    }
    dispose() {
        this._isDisposed = true;
        this.itemViewabilityManager.dispose();
    }
    markLayoutManagerDirty() {
        this._isLayoutManagerDirty = true;
    }
    getInitialScrollIndex() {
        var _a, _b;
        return ((_a = this.propsRef.initialScrollIndex) !== null && _a !== void 0 ? _a : (((_b = this.propsRef.maintainVisibleContentPosition) === null || _b === void 0 ? void 0 : _b.startRenderingFromBottom)
            ? this.getDataLength() - 1
            : undefined));
    }
    shouldMaintainVisibleContentPosition() {
        var _a;
        // Return true if maintainVisibleContentPosition is enabled
        return !((_a = this.propsRef.maintainVisibleContentPosition) === null || _a === void 0 ? void 0 : _a.disabled);
    }
    getDataLength() {
        var _a, _b;
        return (_b = (_a = this.propsRef.data) === null || _a === void 0 ? void 0 : _a.length) !== null && _b !== void 0 ? _b : 0;
    }
    hasStableDataKeys() {
        return Boolean(this.propsRef.keyExtractor);
    }
    getDataKey(index) {
        var _a, _b, _c;
        return ((_c = (_b = (_a = this.propsRef).keyExtractor) === null || _b === void 0 ? void 0 : _b.call(_a, this.propsRef.data[index], index)) !== null && _c !== void 0 ? _c : index.toString());
    }
    getLayoutManagerClass() {
        // throw errors for incompatible props
        if (this.propsRef.masonry && this.propsRef.horizontal) {
            throw new Error(ErrorMessages.masonryAndHorizontalIncompatible);
        }
        if (this.numColumns > 1 && this.propsRef.horizontal) {
            throw new Error(ErrorMessages.numColumnsAndHorizontalIncompatible);
        }
        return this.propsRef.masonry
            ? RVMasonryLayoutManagerImpl
            : this.numColumns > 1 && !this.propsRef.horizontal
                ? RVGridLayoutManagerImpl
                : RVLinearLayoutManagerImpl;
    }
    applyInitialScrollAdjustment() {
        if (!this.layoutManager || this.getDataLength() === 0) {
            return;
        }
        const initialScrollIndex = this.getInitialScrollIndex();
        if (initialScrollIndex !== undefined) {
            // Recompute layouts first, then read the offset. The recompute may
            // re-estimate unmeasured items with an updated average height, changing
            // the target item's position. Reading before recompute would capture a
            // stale offset, causing the wrong items to be rendered.
            this.layoutManager.recomputeLayouts(0, initialScrollIndex);
            const initialItemLayout = this.layoutManager.getLayout(initialScrollIndex);
            const initialItemOffset = this.propsRef.horizontal
                ? initialItemLayout.x
                : initialItemLayout.y;
            this.engagedIndicesTracker.scrollOffset = initialItemOffset;
        }
        else {
            const initialItemLayout = this.layoutManager.getLayout(0);
            const initialItemOffset = this.propsRef.horizontal
                ? initialItemLayout.x
                : initialItemLayout.y;
            this.engagedIndicesTracker.scrollOffset =
                initialItemOffset - this.firstItemOffset;
        }
    }
    renderProgressively() {
        this.progressiveRenderCount++;
        const layoutManager = this.layoutManager;
        if (layoutManager) {
            this.applyInitialScrollAdjustment();
            let visibleIndices = this.computeVisibleIndices();
            if (visibleIndices.length > 0 &&
                this.propsRef.maintainVisibleContentPosition?.startRenderingFromBottom) {
                const endIndex = Math.min(visibleIndices.endIndex, this.getDataLength() - 1);
                const startIndex = Math.max(0, endIndex - this.initialDrawBatchSize + 1);
                visibleIndices = new ConsecutiveNumbers(startIndex, endIndex);
            }
            // console.log("---------> visibleIndices", visibleIndices);
            this.hasRenderedProgressively = visibleIndices.every((index) => layoutManager.getLayout(index).isHeightMeasured &&
                layoutManager.getLayout(index).isWidthMeasured);
            if (this.hasRenderedProgressively) {
                this.isFirstLayoutComplete = true;
            }
            const batchSize = this.numColumns *
                this.initialDrawBatchSize ** Math.ceil(this.progressiveRenderCount / 5);
            // If everything is measured then render stack will be in sync. The buffer items will get rendered in the next update
            // triggered by the useOnLoad hook.
            !this.hasRenderedProgressively &&
                this.updateRenderStack(
                // pick first n indices from visible ones based on batch size
                visibleIndices.slice(0, Math.min(visibleIndices.length, this.getRenderStack().size + batchSize)));
        }
    }
    getItemType(index) {
        var _a, _b, _c;
        return ((_c = (_b = (_a = this.propsRef).getItemType) === null || _b === void 0 ? void 0 : _b.call(_a, this.propsRef.data[index], index)) !== null && _c !== void 0 ? _c : "default").toString();
    }
    overrideItemLayout(index, layout) {
        var _a, _b;
        (_b = (_a = this.propsRef) === null || _a === void 0 ? void 0 : _a.overrideItemLayout) === null || _b === void 0 ? void 0 : _b.call(_a, layout, this.propsRef.data[index], index, this.numColumns, this.propsRef.extraData);
    }
    checkPropsAndWarn() {
        if (this.propsRef.onStartReached && !this.propsRef.keyExtractor) {
            console.warn(WarningMessages.keyExtractorNotDefinedForMVCP);
        }
    }
}
//# sourceMappingURL=RecyclerViewManager.js.map