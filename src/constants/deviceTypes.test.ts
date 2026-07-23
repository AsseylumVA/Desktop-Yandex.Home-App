import { describe, it, expect } from 'vitest';
import { isSensorDevice, isLightDevice, isCameraDevice, isYandexCameraDevice, isAlwaysOnDevice, isLightGroup } from './deviceTypes';

describe('isSensorDevice', () => {
    it('should return true for devices.types.sensor.temperature', () => {
        expect(isSensorDevice({ type: 'devices.types.sensor.temperature' })).toBe(true);
    });

    it('should return true for devices.types.smart_meter', () => {
        expect(isSensorDevice({ type: 'devices.types.smart_meter' })).toBe(true);
    });

    it('should return true for devices.types.cradle.yandex.blanc (NEW)', () => {
        expect(isSensorDevice({ type: 'devices.types.cradle.yandex.blanc' })).toBe(true);
    });

    it('should return true for devices.types.cradle (NEW)', () => {
        expect(isSensorDevice({ type: 'devices.types.cradle' })).toBe(true);
    });

    it('should return false for devices.types.light', () => {
        expect(isSensorDevice({ type: 'devices.types.light' })).toBe(false);
    });

    it('should return false for devices.types.thermostat.ac', () => {
        expect(isSensorDevice({ type: 'devices.types.thermostat.ac' })).toBe(false);
    });

    it('should return false for devices.types.other', () => {
        expect(isSensorDevice({ type: 'devices.types.other' })).toBe(false);
    });

    it('should return true for devices.types.sensor', () => {
        expect(isSensorDevice({ type: 'devices.types.sensor' })).toBe(true);
    });

    it('should return true for devices.types.cradle.some.other.variant', () => {
        expect(isSensorDevice({ type: 'devices.types.cradle.some.other.variant' })).toBe(true);
    });
});

describe('isLightDevice', () => {
    it('should return true for light devices', () => {
        expect(isLightDevice('devices.types.light')).toBe(true);
        expect(isLightDevice('devices.types.light.ceiling')).toBe(true);
        expect(isLightDevice('devices.types.light.lamp')).toBe(true);
        expect(isLightDevice('devices.types.light.strip')).toBe(true);
    });

    it('should return false for non-light devices', () => {
        expect(isLightDevice('devices.types.sensor')).toBe(false);
        expect(isLightDevice('devices.types.cradle')).toBe(false);
    });
});

describe('isLightGroup', () => {
    it('should return true for a group of only light devices', () => {
        const devices = [
            { type: 'devices.types.light' },
            { type: 'devices.types.light.ceiling' },
        ];
        expect(isLightGroup(devices)).toBe(true);
    });

    it('should return false for a mixed group', () => {
        const devices = [
            { type: 'devices.types.light' },
            { type: 'devices.types.sensor' },
        ];
        expect(isLightGroup(devices)).toBe(false);
    });

    it('should return false for an empty group', () => {
        expect(isLightGroup([])).toBe(false);
    });
});

describe('isCameraDevice', () => {
    it('should return true for camera type devices', () => {
        expect(isCameraDevice({
            type: 'devices.types.camera',
            capabilities: [],
            id: 'test',
            name: 'test',
        } as any)).toBe(true);
    });

    it('should return true for devices with video_stream capability', () => {
        expect(isCameraDevice({
            type: 'devices.types.other',
            capabilities: [{ type: 'devices.capabilities.video_stream' }],
            id: 'test',
            name: 'test',
        } as any)).toBe(true);
    });

    it('should return false for non-camera devices', () => {
        expect(isCameraDevice({
            type: 'devices.types.light',
            capabilities: [],
            id: 'test',
            name: 'test',
        } as any)).toBe(false);
    });
});

describe('isYandexCameraDevice', () => {
    it('should return true for native Yandex camera types', () => {
        expect(isYandexCameraDevice({
            type: 'devices.types.camera',
            capabilities: [],
            id: 'test',
            name: 'test',
        } as any)).toBe(true);
    });

    it('should return false for partner cameras with video_stream on other types', () => {
        expect(isYandexCameraDevice({
            type: 'devices.types.other',
            capabilities: [{ type: 'devices.capabilities.video_stream' }],
            id: 'test',
            name: 'test',
        } as any)).toBe(false);
    });
});

describe('isAlwaysOnDevice', () => {
    it('should return true for smart_speaker devices', () => {
        expect(isAlwaysOnDevice({
            type: 'devices.types.smart_speaker',
            capabilities: [],
            id: 'test',
            name: 'test',
        } as any)).toBe(true);
    });

    it('should return true for hub devices', () => {
        expect(isAlwaysOnDevice({
            type: 'devices.types.hub',
            capabilities: [],
            id: 'test',
            name: 'test',
        } as any)).toBe(true);
    });

    it('should return true for other type devices', () => {
        expect(isAlwaysOnDevice({
            type: 'devices.types.other',
            capabilities: [],
            id: 'test',
            name: 'test',
        } as any)).toBe(true);
    });

    it('should return false for light devices', () => {
        expect(isAlwaysOnDevice({
            type: 'devices.types.light',
            capabilities: [],
            id: 'test',
            name: 'test',
        } as any)).toBe(false);
    });
});
