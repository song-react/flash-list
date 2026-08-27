declare const PlatformConfig: {
    defaultDrawDistance: number;
    supportsOffsetCorrection: boolean;
    trackAverageRenderTimeForOffsetProjection: boolean;
    isRN083OrAbove: boolean;
    invertedTransformStyle: {
        readonly transform: readonly [{
            readonly scaleY: -1;
        }];
    };
    invertedTransformStyleHorizontal: {
        readonly transform: readonly [{
            readonly scaleX: -1;
        }];
    };
};
export { PlatformConfig };
//# sourceMappingURL=PlatformHelper.web.d.ts.map