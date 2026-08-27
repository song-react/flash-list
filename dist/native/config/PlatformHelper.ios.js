import { isRN083OrAbove } from "./versionCheck";
const PlatformConfig = {
    defaultDrawDistance: 250,
    supportsOffsetCorrection: true,
    trackAverageRenderTimeForOffsetProjection: false,
    isRN083OrAbove: isRN083OrAbove(),
    invertedTransformStyle: { transform: [{ scaleY: -1 }] },
    invertedTransformStyleHorizontal: { transform: [{ scaleX: -1 }] },
};
export { PlatformConfig };
//# sourceMappingURL=PlatformHelper.ios.js.map