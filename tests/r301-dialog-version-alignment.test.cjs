"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const root = path.resolve(__dirname, "..");
const pkg = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));
const pluginJson = JSON.parse(fs.readFileSync(path.join(root, "plugin.json"), "utf8"));
const constantsSource = fs.readFileSync(path.join(root, "src", "constants.ts"), "utf8");

test("PLUGIN_VERSION and PLUGIN_DISPLAY_VERSION in src/constants.ts match package.json exactly", () => {
    const versionMatch = constantsSource.match(/export const PLUGIN_VERSION = ["']([^"']+)["']/);
    assert.ok(versionMatch, "constants.ts must export PLUGIN_VERSION");
    const extractedVersion = versionMatch[1];
    assert.equal(extractedVersion, pkg.version, `constants.ts version (${extractedVersion}) must match package.json (${pkg.version})`);

    const displayMatch = constantsSource.match(/export const PLUGIN_DISPLAY_VERSION = [`"']([^`"']+)["'`]/);
    assert.ok(displayMatch, "constants.ts must export PLUGIN_DISPLAY_VERSION");
    assert.equal(pluginJson.version, pkg.version, `plugin.json version (${pluginJson.version}) must match package.json (${pkg.version})`);
});

test("No obsolete hardcoded dialog badge versions exist across src/ui files", () => {
    const uiDir = path.join(root, "src", "ui");
    const files = fs.readdirSync(uiDir).filter((f) => f.endsWith(".ts"));
    const obsoleteVersions = ["v0.7.7", "v0.7.6", "v0.7.5", "v0.7.4", "v0.7.0", "v0.4.2"];

    for (const file of files) {
        const content = fs.readFileSync(path.join(uiDir, file), "utf8");
        for (const badVer of obsoleteVersions) {
            const hasObsolete = content.includes(`"${badVer}"`) || content.includes(`'${badVer}'`);
            assert.equal(
                hasObsolete,
                false,
                `Found obsolete hardcoded version "${badVer}" in src/ui/${file}. All dialogs must use PLUGIN_DISPLAY_VERSION.`
            );
        }
    }
});
