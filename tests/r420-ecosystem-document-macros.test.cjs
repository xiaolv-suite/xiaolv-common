"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");

const { placeholders } = require("./.build/entry.cjs");
const { applyPlaceholders, formatLocalDate } = placeholders;

test("小驴常用 · 全家桶思源文档原生宏体系 (Ecosystem Document Macros) 专项测试", async (t) => {
    const fixedNow = new Date("2026-11-08T12:00:00");
    const todayStr = formatLocalDate(fixedNow);

    await t.test("1. {{xlc:achievement}} 自动展开为打卡三阶里程碑 Bento Callout 原生卡片", () => {
        const tpl = "## 每日打卡\n{{xlc:achievement}}";
        const res = applyPlaceholders(tpl, fixedNow, true);

        assert.ok(res.includes(`> 🌅 **今日自律成就卡 · ${todayStr}**`));
        assert.ok(res.includes("> - [ ] **晨间阅读 30 分钟** `⚪ 保底` ⚡+2"));
        assert.ok(res.includes("> - [ ] **核心技能刻意练习** `🟢 达标` ⚡+3"));
        assert.ok(res.includes("> - [ ] **晚间复盘总结** `🔥 突破` ⚡+5"));
        assert.ok(res.includes('{: custom-type="daily-achievement" custom-checkin-card="true" }'));
    });

    await t.test("2. {{xlc:home_board}} 自动展开为管家到期预警与资产 Bento Callout 原生看板", () => {
        const tpl = "## 晨间管家概览\n{{xlc:home_board}}";
        const res = applyPlaceholders(tpl, fixedNow, true);

        assert.ok(res.includes(`> 🏠 **今日家庭生活备忘与到期预警 · ${todayStr}**`));
        assert.ok(res.includes("待处理: **0** 项"));
        assert.ok(res.includes("今日家庭资产与证件状态安全，无临期到期事项"));
        assert.ok(res.includes('{: custom-type="home-alert-board" custom-home-summary="true" }'));
    });

    await t.test("3. {{xlc:review_card}} 自动展开为闪卡复习战报 Bento Callout 原生卡片", () => {
        const tpl = "## 晚间学习总结\n{{xlc:review_card}}";
        const res = applyPlaceholders(tpl, fixedNow, true);

        assert.ok(res.includes(`> 🗂️ **今日闪卡复习战报 · ${todayStr}**`));
        assert.ok(res.includes("掌握率: **100%**"));
        assert.ok(res.includes('{: custom-type="flashcard-review-summary" custom-cards-reviewed="0" custom-retention="100" }'));
    });

    await t.test("4. {{xlc:exam_scorecard|试卷名}} 自动展开为考试成绩单与考场节奏 Bento Callout 原生卡片", () => {
        const tpl = "## 测评战报\n{{xlc:exam_scorecard|2026年架构师摸底考试}}";
        const res = applyPlaceholders(tpl, fixedNow, true);

        assert.ok(res.includes("> 📝 **今日测评战报 · 2026年架构师摸底考试**"));
        assert.ok(res.includes("成绩: **100/100** (100%) · 🟢 通过 · 订正待办: **0** 项"));
        assert.ok(res.includes("🌊 认知心流平稳"));
        assert.ok(res.includes('{: custom-type="exam-scorecard" custom-score="100" custom-pass="true" }'));
    });

    await t.test("5. {{xlc:meeting_brief|联系人}} 自动展开为会前 30 秒破冰速览 Bento Callout 原生卡片", () => {
        const tpl = "## 会前准备\n{{xlc:meeting_brief|王总}}";
        const res = applyPlaceholders(tpl, fixedNow, true);

        assert.ok(res.includes("> 🤝 **与 王总 的会前 30 秒破冰速览**"));
        assert.ok(res.includes("圈层: **核心圈** · 关系温度: **🟢 密切**"));
        assert.ok(res.includes("上次聊了什么"));
        assert.ok(res.includes('{: custom-type="meeting-brief" custom-person="王总" }'));
    });

    await t.test("6. {{xlc:reading_digest}} 自动展开为拾遗阅读轨迹 Bento Callout 原生卡片", () => {
        const tpl = "## 阅读轨迹\n{{xlc:reading_digest}}";
        const res = applyPlaceholders(tpl, fixedNow, true);

        assert.ok(res.includes(`> 📖 **今日阅读拾遗轨迹 · ${todayStr}**`));
        assert.ok(res.includes("今日完成阅读: **0** 篇"));
        assert.ok(res.includes('{: custom-type="glean-reading-digest" custom-reading-count="0" }'));
    });

    await t.test("7. 自然别名与管道参数兼容性：{{xlc:checkin}} / {{xlc:home}} / {{xlc:cards}} / {{xlc:exam}} / {{xlc:contacts}}", () => {
        assert.ok(applyPlaceholders("{{xlc:checkin}}", fixedNow, true).includes("custom-type=\"daily-achievement\""));
        assert.ok(applyPlaceholders("{{xlc:checkin|card}}", fixedNow, true).includes("custom-type=\"daily-achievement\""));
        assert.ok(applyPlaceholders("{{xlc:home}}", fixedNow, true).includes("custom-type=\"home-alert-board\""));
        assert.ok(applyPlaceholders("{{xlc:cards}}", fixedNow, true).includes("custom-type=\"flashcard-review-summary\""));
        assert.ok(applyPlaceholders("{{xlc:exam|英语}}", fixedNow, true).includes("custom-type=\"exam-scorecard\""));
        assert.ok(applyPlaceholders("{{xlc:contacts|李四}}", fixedNow, true).includes("custom-type=\"meeting-brief\""));
        assert.ok(applyPlaceholders("{{xlc:glean}}", fixedNow, true).includes("custom-type=\"glean-reading-digest\""));
    });
});
