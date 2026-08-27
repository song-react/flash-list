import { ErrorMessages } from "../errors/ErrorMessages";
import { roundToDecimalPlaces } from "./roundToDecimalPlaces";
/**
 * Can be used to monitor JS thread performance
 * Use startTracking() and stopAndGetData() to start and stop tracking
 */
export class JSFPSMonitor {
    constructor() {
        this.startTime = 0;
        this.frameCount = 0;
        this.timeWindow = {
            frameCount: 0,
            startTime: 0,
        };
        this.minFPS = Number.MAX_SAFE_INTEGER;
        this.maxFPS = 0;
        this.averageFPS = 0;
        this.clearAnimationNumber = 0;
        this.updateLoopCompute = () => {
            this.frameCount++;
            const elapsedTime = (Date.now() - this.startTime) / 1000;
            this.averageFPS = elapsedTime > 0 ? this.frameCount / elapsedTime : 0;
            this.timeWindow.frameCount++;
            const timeWindowElapsedTime = (Date.now() - this.timeWindow.startTime) / 1000;
            if (timeWindowElapsedTime >= 1) {
                const timeWindowAverageFPS = this.timeWindow.frameCount / timeWindowElapsedTime;
                this.minFPS = Math.min(this.minFPS, timeWindowAverageFPS);
                this.maxFPS = Math.max(this.maxFPS, timeWindowAverageFPS);
                this.timeWindow.frameCount = 0;
                this.timeWindow.startTime = Date.now();
            }
            this.measureLoop();
        };
    }
    measureLoop() {
        // This looks weird but I'm avoiding a new closure
        this.clearAnimationNumber = requestAnimationFrame(this.updateLoopCompute);
    }
    startTracking() {
        if (this.startTime !== 0) {
            throw new Error(ErrorMessages.fpsMonitorAlreadyRunning);
        }
        this.startTime = Date.now();
        this.timeWindow.startTime = Date.now();
        this.measureLoop();
    }
    stopAndGetData() {
        cancelAnimationFrame(this.clearAnimationNumber);
        if (this.minFPS === Number.MAX_SAFE_INTEGER) {
            this.minFPS = this.averageFPS;
            this.maxFPS = this.averageFPS;
        }
        return {
            minFPS: roundToDecimalPlaces(this.minFPS, 1),
            maxFPS: roundToDecimalPlaces(this.maxFPS, 1),
            averageFPS: roundToDecimalPlaces(this.averageFPS, 1),
        };
    }
}
//# sourceMappingURL=JSFPSMonitor.js.map