const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const config = withNativeWind(getDefaultConfig(__dirname), { input: './global.css' });

// Ensure icon fonts are treated as assets (required for @expo/vector-icons).
// NativeWind wraps Metro config; enforce this AFTER wrapping so it cannot be overwritten.
config.resolver.assetExts = Array.from(new Set([...(config.resolver.assetExts || []), 'ttf', 'otf']));

module.exports = config;
