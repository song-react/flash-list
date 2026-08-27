export function roundToDecimalPlaces(value, decimalPlaces) {
    const multiplier = 10 ** decimalPlaces;
    return Math.round(value * multiplier) / multiplier;
}
//# sourceMappingURL=roundToDecimalPlaces.js.map