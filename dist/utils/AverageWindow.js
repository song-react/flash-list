/**
 * Helper class to calculate running average of the most recent n values
 */
export class AverageWindow {
    constructor(size, startValue) {
        this.nextIndex = 0;
        this.inputValues = new Array(Math.max(1, size));
        this.currentAverage = startValue !== null && startValue !== void 0 ? startValue : 0;
        this.currentCount = startValue === undefined ? 0 : 1;
        this.nextIndex = this.currentCount;
        this.inputValues[0] = startValue;
    }
    /**
     * Can be used to get the current average value
     */
    get currentValue() {
        return this.currentAverage;
    }
    /**
     *
     * @param value Add new value to the average window and updated current average
     */
    addValue(value) {
        const target = this.getNextIndex();
        const oldValue = this.inputValues[target];
        const newCount = oldValue === undefined ? this.currentCount + 1 : this.currentCount;
        this.inputValues[target] = value;
        this.currentAverage = Math.max(0, this.currentAverage * (this.currentCount / newCount) +
            (value - (oldValue !== null && oldValue !== void 0 ? oldValue : 0)) / newCount);
        this.currentCount = newCount;
    }
    getNextIndex() {
        // starts from 0 once we reach end of the array
        const newTarget = this.nextIndex;
        this.nextIndex = (this.nextIndex + 1) % this.inputValues.length;
        return newTarget;
    }
}
export class MultiTypeAverageWindow {
    /**
     * @param windowSize Size of the average window
     * @param defaultValue Default value to return if no value is available
     */
    constructor(windowSize, defaultValue) {
        this.averageWindows = new Map();
        this.windowSize = windowSize;
        this.defaultValue = defaultValue;
    }
    addValue(value, type) {
        let averageWindow = this.averageWindows.get(type);
        if (!averageWindow) {
            averageWindow = new AverageWindow(this.windowSize);
            this.averageWindows.set(type, averageWindow);
        }
        averageWindow.addValue(value);
    }
    getCurrentValue(type) {
        var _a, _b;
        const averageWindow = this.averageWindows.get(type);
        return (_b = (_a = averageWindow === null || averageWindow === void 0 ? void 0 : averageWindow.currentValue) !== null && _a !== void 0 ? _a : this.defaultValue) !== null && _b !== void 0 ? _b : 0;
    }
    reset() {
        this.averageWindows.clear();
    }
}
//# sourceMappingURL=AverageWindow.js.map