import { PlatformConfig } from "../../native/config/PlatformHelper";
export function getInvertedTransformStyle(horizontal) {
    return horizontal
        ? PlatformConfig.invertedTransformStyleHorizontal
        : PlatformConfig.invertedTransformStyle;
}
//# sourceMappingURL=getInvertedTransformStyle.js.map