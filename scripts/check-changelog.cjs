// CHANGELOG 与版本一致性静态门禁
// 保证 CHANGELOG.md 顶部必须包含对 package.json 当前版本的记录，防止发版漏更日志。
"use strict";

const fs = require("node:fs");
const path = require("node:path");

const ROOT = process.argv[2] ? path.resolve(process.argv[2]) : path.resolve(__dirname, "..");
const pkgPath = path.join(ROOT, "package.json");
if (!fs.existsSync(pkgPath)) {
    console.error("check-changelog 失败：未找到 package.json");
    process.exit(1);
}
const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
const changelogPath = path.join(ROOT, "CHANGELOG.md");

if (!fs.existsSync(changelogPath)) {
    console.error("check-changelog 失败：未找到 CHANGELOG.md");
    process.exit(1);
}

const changelogText = fs.readFileSync(changelogPath, "utf8");
const expectedHeading = `## [${pkg.version}]`;

if (!changelogText.includes(expectedHeading)) {
    console.error(`check-changelog 失败：CHANGELOG.md 缺少对当前版本 v${pkg.version} 的记录条目！`);
    console.error(`请在 CHANGELOG.md 顶部添加 "${expectedHeading} — YYYY-MM-DD" 的发布变更记录。`);
    process.exit(1);
}

console.log(`check-changelog ✓：CHANGELOG.md 已包含当前版本 v${pkg.version} 的更新记录`);
