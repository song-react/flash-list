/**
 * A simple wrapper for consecutive postive integer arrays
 * Only stores start and end indices for faster computation as numbers are consecutive.
 */
export class ConsecutiveNumbers {
    constructor(startIndex, endIndex) {
        this.startIndex = startIndex;
        this.endIndex = endIndex;
    }
    /**
     * Get the length of the array
     */
    get length() {
        return Math.max(0, this.endIndex - this.startIndex + 1);
    }
    /**
     * Get element at specified index
     */
    at(index) {
        return this.startIndex + index;
    }
    /**
     * Check if two consecutive numbers are equal
     */
    equals(other) {
        return (this.startIndex === other.startIndex && this.endIndex === other.endIndex);
    }
    /**
     * Converts the consecutive range to an actual array
     * @returns An array containing all consecutive numbers
     */
    toArray() {
        if (this.length === 0) {
            return [];
        }
        const array = new Array(this.length);
        for (let i = 0; i < this.length; i++) {
            array[i] = this.startIndex + i;
        }
        return array;
    }
    /**
     * Check if array includes a value
     */
    includes(value) {
        return value >= this.startIndex && value <= this.endIndex;
    }
    /**
     * Get index of a value in the consecutive range
     */
    indexOf(value) {
        return this.includes(value) ? value - this.startIndex : -1;
    }
    findValue(predicate) {
        for (let i = 0; i < this.length; i++) {
            const value = this.startIndex + i;
            if (predicate(value, i, this)) {
                return value;
            }
        }
        return undefined;
    }
    /**
     * Tests whether all elements in the consecutive range pass the provided test function
     * @param predicate A function that tests each element
     * @returns true if all elements pass the test; otherwise, false
     */
    every(predicate) {
        for (let i = 0; i < this.length; i++) {
            const value = this.startIndex + i;
            if (!predicate(value, i, this)) {
                return false;
            }
        }
        return true;
    }
    /**
     * Get a slice of the consecutive array
     */
    slice(start = 0, end = this.length) {
        const newStart = this.startIndex + start;
        const newEnd = this.startIndex + Math.min(end, this.length) - 1;
        return new ConsecutiveNumbers(newStart, Math.max(newStart - 1, newEnd));
    }
    /**
     * Implement iterator to enable for...of
     */
    *[Symbol.iterator]() {
        for (let i = this.startIndex; i <= this.endIndex; i++) {
            yield i;
        }
    }
}
ConsecutiveNumbers.EMPTY = new ConsecutiveNumbers(-1, -2);
//# sourceMappingURL=ConsecutiveNumbers.js.map