import { Platform } from "react-native";
let _isNewArch;
export function isNewArch() {
    if (_isNewArch !== undefined) {
        return _isNewArch;
    }
    else {
        try {
            // Check for Fabric UI Manager
            const hasFabricUIManager = Boolean(global === null || global === void 0 ? void 0 : global.nativeFabricUIManager);
            // Check for TurboModule system
            const hasTurboModule = Boolean(global === null || global === void 0 ? void 0 : global.__turboModuleProxy);
            _isNewArch =
                hasFabricUIManager || hasTurboModule || Platform.OS === "web";
        }
        catch (_a) {
            _isNewArch = true;
        }
    }
    return _isNewArch;
}
//# sourceMappingURL=isNewArch.js.map