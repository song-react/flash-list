import ViewabilityHelper from "./ViewabilityHelper";
/**
 * Manager for viewability tracking. It holds multiple viewability callback pairs and keeps them updated.
 */
export default class ViewabilityManager {
    constructor(rvManager) {
        var _a;
        this.viewabilityHelpers = [];
        this.hasInteracted = false;
        this.dispose = () => {
            this.viewabilityHelpers.forEach((viewabilityHelper) => viewabilityHelper.dispose());
        };
        this.onVisibleIndicesChanged = (all) => {
            this.updateViewableItems(all);
        };
        this.recordInteraction = () => {
            if (this.hasInteracted) {
                return;
            }
            this.hasInteracted = true;
            this.viewabilityHelpers.forEach((viewabilityHelper) => {
                viewabilityHelper.hasInteracted = true;
            });
            this.updateViewableItems();
        };
        this.updateViewableItems = (newViewableIndices) => {
            var _a;
            const listSize = this.rvManager.getWindowSize();
            if (listSize === undefined || !this.shouldListenToVisibleIndices) {
                return;
            }
            const scrollOffset = ((_a = this.rvManager.getAbsoluteLastScrollOffset()) !== null && _a !== void 0 ? _a : 0) -
                this.rvManager.firstItemOffset;
            this.viewabilityHelpers.forEach((viewabilityHelper) => {
                var _a;
                viewabilityHelper.updateViewableItems((_a = this.rvManager.props.horizontal) !== null && _a !== void 0 ? _a : false, scrollOffset, listSize, (index) => this.rvManager.getLayout(index), newViewableIndices);
            });
        };
        this.clearLastReportedViewableIndices = () => {
            this.viewabilityHelpers.forEach((viewabilityHelper) => viewabilityHelper.clearLastReportedViewableIndices());
        };
        /**
         * Creates a new `ViewabilityHelper` instance with `onViewableItemsChanged` callback and `ViewabilityConfig`
         * @returns `ViewabilityHelper` instance
         */
        this.createViewabilityHelper = (viewabilityConfig, onViewableItemsChanged) => {
            const mapViewToken = (index, isViewable) => {
                const item = this.rvManager.props.data[index];
                const key = item === undefined || this.rvManager.props.keyExtractor === undefined
                    ? index.toString()
                    : this.rvManager.props.keyExtractor(item, index);
                return {
                    index,
                    isViewable,
                    item,
                    key,
                    timestamp: Date.now(),
                };
            };
            return new ViewabilityHelper(viewabilityConfig, (indices, newlyVisibleIndices, newlyNonvisibleIndices) => {
                onViewableItemsChanged === null || onViewableItemsChanged === void 0 ? void 0 : onViewableItemsChanged({
                    viewableItems: indices.map((index) => mapViewToken(index, true)),
                    changed: [
                        ...newlyVisibleIndices.map((index) => mapViewToken(index, true)),
                        ...newlyNonvisibleIndices.map((index) => mapViewToken(index, false)),
                    ],
                });
            });
        };
        this.rvManager = rvManager;
        if (rvManager.props.onViewableItemsChanged !== null &&
            rvManager.props.onViewableItemsChanged !== undefined) {
            this.viewabilityHelpers.push(this.createViewabilityHelper(rvManager.props.viewabilityConfig, (info) => {
                var _a, _b;
                (_b = (_a = rvManager.props).onViewableItemsChanged) === null || _b === void 0 ? void 0 : _b.call(_a, info);
            }));
        }
        ((_a = rvManager.props.viewabilityConfigCallbackPairs) !== null && _a !== void 0 ? _a : []).forEach((pair, index) => {
            this.viewabilityHelpers.push(this.createViewabilityHelper(pair.viewabilityConfig, (info) => {
                var _a, _b;
                const callback = (_b = (_a = rvManager.props.viewabilityConfigCallbackPairs) === null || _a === void 0 ? void 0 : _a[index]) === null || _b === void 0 ? void 0 : _b.onViewableItemsChanged;
                callback === null || callback === void 0 ? void 0 : callback(info);
            }));
        });
    }
    /**
     * @returns true if the viewability manager has any viewability callback pairs registered.
     */
    get shouldListenToVisibleIndices() {
        return this.viewabilityHelpers.length > 0;
    }
}
//# sourceMappingURL=ViewabilityManager.js.map