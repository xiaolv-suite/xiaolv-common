// 真内核集成测试入口（R140）：library.ts 全生命周期对真实思源内核跑通。
// 由 scripts/integration-kernel.cjs 打包后在 Node 中执行；传输层直连隔离内核 HTTP API。
// 这填补「桩内核单测 ↔ 裸 API E2E」之间的空档：插件自己的服务代码从未碰过真内核。
import {createKernelClient} from "../../src/kernel/client";
import {LibraryService} from "../../src/service/library";
import {searchEntries} from "../../src/model/search";
import {importBundle} from "../../src/service/importer";
import {parseMarkdownPack} from "../../src/service/import-markdown";
import {PROMPT_PACK_MD, REFORMULATION_PACK_MD, TASK_HORIZON_PACK_MD, CALLOUT_PACK_MD, ACADEMIC_CITATION_PACK_MD} from "../../src/service/prompt-pack";
import {normalizeKramdownIal} from "../../src/model/kramdown";

const ORIGIN = process.env.IT_ORIGIN || "";
const TOKEN = process.env.IT_TOKEN || "";
const DOC = process.env.IT_DOC || "";

const results: Array<{name: string; ok: boolean; detail?: string}> = [];
function check(name: string, ok: boolean, detail = ""): void {
    results.push({name, ok, detail});
    console.log(`${ok ? "✔" : "✖"} ${name}${detail ? ` — ${detail}` : ""}`);
}

(async () => {
    const syncPost = async (url: string, data: unknown) => {
        const resp = await fetch(ORIGIN + url, {
            method: "POST",
            headers: {"Content-Type": "application/json", Authorization: `Token ${TOKEN}`},
            body: JSON.stringify(data ?? {}),
        });
        const body = (await resp.json()) as {code?: number; msg?: string; data?: unknown};
        return {code: body.code, msg: body.msg, data: body.data};
    };
    const kernel = createKernelClient({syncPost});
    const lib = new LibraryService(kernel, {});
    lib.setConfig({configVersion: 1, mode: "doc", notebookIds: [], containerDocIds: [DOC], createdDocIds: [], configuredAt: Date.now()});

    // 1. 空索引
    const idx0 = await lib.ensureIndex();
    check("空库索引构建", idx0.entries.length === 0 && idx0.errors.length === 0, `${idx0.entries.length} 条 / errors=${idx0.errors.length}`);

    // 2. 三类型 createItem（text/code/url）
    const r1 = await lib.createItem({itemType: "text", markdown: "集成测试条目甲：正文内容", title: "条目甲"});
    check("createItem text", r1.ok, r1.ok ? r1.data.item.id : r1.message);
    const r2 = await lib.createItem({itemType: "code", markdown: "```sql\nSELECT 1;\n```", title: "条目乙"});
    check("createItem code", r2.ok, r2.ok ? r2.data.item.id : r2.message);
    const r3 = await lib.createItem({itemType: "url", markdown: "https://example.com/it", title: "条目丙", url: "https://example.com/it"});
    check("createItem url", r3.ok, r3.ok ? r3.data.item.id : r3.message);
    if (!r1.ok || !r2.ok || !r3.ok) return finish();

    // 3. 索引发现三条（含 R139 的 skip 非条目块路径：文档内还有标题块等）
    const idx1 = await lib.ensureIndex(0); // 强制重建
    const ids = [r1.data.item.id, r2.data.item.id, r3.data.item.id];
    check("重建索引发现全部条目", ids.every((id) => idx1.items.has(id)), `${idx1.entries.length} 条`);

    // 4. 搜索命中
    const hits = searchEntries(idx1.entries, {text: "集成测试条目甲"}, {favorites: new Set(), recents: new Map(), usage: new Map(), now: Date.now()});
    check("搜索命中新条目", hits.length >= 1 && hits[0].entry.id === r1.data.item.id, `${hits.length} 条`);

    // 5. kramdown 往返（经插件路径）
    const kd = await lib.getItemKramdown(r2.data.item);
    check("getItemKramdown 围栏保留", kd.ok && (kd.data ?? "").includes("SELECT 1;"));

    // 6. 来源健康（真实块存在）
    const health = await lib.checkSourceHealth(r1.data.item);
    check("checkSourceHealth 健康", health.ok && !health.data.blockMissing && !health.data.docMissing && !health.data.assetMissing,
        health.ok ? JSON.stringify(health.data) : health.message);

    // 7. 更新（标题走属性写）后重建可见
    const up = await lib.updateItem(r1.data.item.id, {title: "条目甲·改"});
    check("updateItem", up.ok, up.ok ? "" : up.message);
    const idx2 = await lib.ensureIndex(0);
    const updatedEntry = idx2.items.get(r1.data.item.id);
    check("更新后索引可见新标题", Boolean(updatedEntry && updatedEntry.title === "条目甲·改"), updatedEntry?.title ?? "missing");
    // R150 锁定：空 markdown 不写内容也不触发假更新（updated 属性变化但正文不变属预期）
    const upEmpty = await lib.updateItem(r1.data.item.id, {title: "条目甲·改2", markdown: ""});
    const kdAfterEmpty = await lib.getItemKramdown(r1.data.item);
    check("updateItem 空 markdown 不清空正文", upEmpty.ok && (kdAfterEmpty.data ?? "").includes("集成测试条目甲") === true,
        upEmpty.ok ? "" : upEmpty.message);

    // 8. 删除后索引收敛
    const rm = await lib.removeItem(r2.data.item.id);
    check("removeItem", rm.ok, rm.ok ? "" : rm.message);
    const idx3 = await lib.ensureIndex(0);
    check("删除后索引收敛", !idx3.items.has(r2.data.item.id) && idx3.items.size === 2, `${idx3.entries.length} 条`);

    // 9. 片段引用展开（无引用 → 原样）
    const expanded = await lib.expandSnippetRefs("纯文本 {{xlc:ask:字段}} 片段");
    check("expandSnippetRefs 无引用原样", expanded.includes("{{xlc:ask:字段}}"));

    // 10. 单行条目改正文（编辑正文的真实宿主路径）
    const bodyEdit = await lib.updateItem(r1.data.item.id, {markdown: "集成测试条目甲：正文已改"});
    const kdEdited = await lib.getItemKramdown(r1.data.item);
    check("updateItem 改单行正文并回读", bodyEdit.ok && kdEdited.ok && kdEdited.data === "集成测试条目甲：正文已改",
        bodyEdit.ok ? JSON.stringify(kdEdited.ok ? kdEdited.data : kdEdited.message) : bodyEdit.message);

    // 11. 多段正文：超级块容器写入、回读、更新、删除（T-0752）
    const multi = "尊敬的 {{xlc:ask:客户名称}}：\n\n关于本期交付延期，我们深表歉意。\n\n1. 服务费减免\n2. 专属值守\n\n> 提示：可修改\n\n```js\nconsole.log(1)\n```";
    const rm4 = await lib.createItem({itemType: "markdown", markdown: multi, title: "多段道歉"});
    check("createItem 多段正文", rm4.ok, rm4.ok ? rm4.data.item.blockId : rm4.message);
    if (rm4.ok) {
        const kdMulti = await lib.getItemKramdown(rm4.data.item);
        const text = kdMulti.ok ? kdMulti.data : "";
        check("多段正文回读不含容器与块 ID",
            kdMulti.ok && text.includes("关于本期交付延期") && text.includes("console.log(1)") && text.includes("专属值守")
            && !text.includes("{{{") && !text.includes("}}}") && !/\{:\s*id=/.test(text), JSON.stringify(text.slice(0, 120)));
        const idx4 = await lib.ensureIndex(0);
        const indexed = idx4.items.get(rm4.data.item.id);
        check("多段条目进入索引且变量计数正确", Boolean(indexed && indexed.varCount === 1 && indexed.title === "多段道歉"),
            indexed ? `vars=${indexed.varCount} type=${indexed.itemType}` : "missing");
        const multi2 = "第二版第一段\n\n第二版第二段\n\n- 列表A\n- 列表B";
        const up4 = await lib.updateItem(rm4.data.item.id, {markdown: multi2, title: "多段道歉·改"});
        const kd4 = await lib.getItemKramdown(rm4.data.item);
        const idx5 = await lib.ensureIndex(0);
        const after = idx5.items.get(rm4.data.item.id);
        check("updateItem 多段正文后属性与块 ID 保持", up4.ok && Boolean(after && after.blockId === rm4.data.item.blockId && after.title === "多段道歉·改"),
            up4.ok ? (after ? `${after.blockId} ${after.title}` : "missing after update") : up4.message);
        check("多段更新回读为新正文", kd4.ok && kd4.data.includes("第二版第二段") && !kd4.data.includes("深表歉意"), kd4.ok ? JSON.stringify(kd4.data.slice(0, 80)) : kd4.message);
        const up5 = await lib.updateItem(rm4.data.item.id, {markdown: "收敛为一段"});
        const kd5 = await lib.getItemKramdown(rm4.data.item);
        check("多段条目改回单段", up5.ok && kd5.ok && kd5.data === "收敛为一段", kd5.ok ? JSON.stringify(kd5.data) : (up5.ok ? kd5.message : up5.message));
        const rm5 = await lib.removeItem(rm4.data.item.id);
        const idx6 = await lib.ensureIndex(0);
        check("删除多段条目且无残留子块", rm5.ok && !idx6.items.has(rm4.data.item.id) && idx6.items.size === 2,
            rm5.ok ? `${idx6.items.size} 条` : rm5.message);
    }

    // 12. 单段条目改成多段正文（段落 → 超级块原位升级）
    const up6 = await lib.updateItem(r3.data.item.id, {markdown: "https://example.com/it\n\n附注：第二段"});
    const kd6 = await lib.getItemKramdown(r3.data.item);
    const idx7 = await lib.ensureIndex(0);
    check("单段条目改为多段正文", up6.ok && kd6.ok && kd6.data.includes("附注：第二段") && idx7.items.get(r3.data.item.id)?.title === "条目丙",
        up6.ok ? JSON.stringify(kd6.ok ? kd6.data : kd6.message) : up6.message);

    // 13. 内置示例包全部写入并逐条回读一致（T-0752：多段模板不再被拒）
    const packs: Array<[string, string]> = [["常用内容示例", PROMPT_PACK_MD], ["渐进反思", REFORMULATION_PACK_MD],
        ["Task Horizon", TASK_HORIZON_PACK_MD], ["Callout", CALLOUT_PACK_MD], ["学术引文", ACADEMIC_CITATION_PACK_MD]];
    for (const [name, md] of packs) {
        const parsed = parseMarkdownPack(md);
        const receipt = await importBundle(lib, {schemaVersion: 1, items: parsed.items, unknownTopFields: []}, "skip");
        for (const line of receipt.lines.filter((l) => !l.ok)) {
            // 回执只有布尔结果；失败时用同一输入直接 createItem 拿到内核原因，便于定位。
            const incoming = parsed.items.find((it) => it.id === line.id);
            if (incoming && process.env.IT_VERBOSE) {
                const retry = await lib.createItem({itemType: incoming.itemType, markdown: incoming.kramdown, title: incoming.title, logicalId: incoming.id});
                console.log(`[retry] ${incoming.title}: ${retry.ok ? "ok on retry" : retry.message}`);
            }
        }
        const idxPack = await lib.ensureIndex(0);
        let same = 0;
        const mismatched: string[] = [];
        for (const incoming of parsed.items) {
            const stored = idxPack.items.get(incoming.id);
            const body = stored ? await lib.getItemKramdown(stored) : null;
            if (body?.ok && canonicalMarkdown(body.data) === canonicalMarkdown(incoming.kramdown) && stored && await countEmbeds(stored.blockId) === 0) same++;
            else {
                mismatched.push(incoming.title);
                if (process.env.IT_VERBOSE) console.log(`--- ${incoming.title}
[in ] ${JSON.stringify(incoming.kramdown)}
[out] ${JSON.stringify(body?.ok ? body.data : body)}`);
            }
        }
        check(`示例包「${name}」全部写入`, receipt.created === parsed.items.length && receipt.failed === 0,
            `${receipt.created}/${parsed.items.length}${receipt.failed ? ` 失败：${receipt.lines.filter((l) => !l.ok).map((l) => `${l.title}(${l.error})`).slice(0, 3).join("; ")}` : ""}`);
        check(`示例包「${name}」逐条回读与原文一致`, same === parsed.items.length, `${same}/${parsed.items.length}${mismatched.length ? ` 不一致：${mismatched.slice(0, 3).join("、")}` : ""}`);
    }

    finish();
})().catch((err) => {
    console.error(`集成测试异常：${err?.message ?? err}`);
    process.exit(1);
});

/**
 * 内核会规范化 Markdown（补段间空行、`__强调__` → `**强调**`、列表懒续行缩进、行尾空格），
 * 这些不改变渲染结果；比较时抹平它们，其余任何文字差异都算不一致。
 */
function canonicalMarkdown(markdown: string): string {
    return normalizeKramdownIal(markdown)
        .replace(/__([^_\n]+?)__/g, "**$1**")
        .split("\n").map((line) => line.trim().replace(/\s+/g, " ")).filter(Boolean).join("\n");
}

/** 条目块内被内核解析成嵌入查询块的数量（`{{...}}` 行首误判，必须为 0）。 */
async function countEmbeds(blockId: string): Promise<number> {
    const resp = await fetch(ORIGIN + "/api/block/getChildBlocks", {
        method: "POST", headers: {"Content-Type": "application/json", Authorization: `Token ${TOKEN}`}, body: JSON.stringify({id: blockId}),
    });
    const children = ((await resp.json()) as {data?: Array<{id: string; type: string}>}).data ?? [];
    let count = 0;
    for (const child of children) {
        if (child.type === "query_embed") count++;
        else if (["s", "l", "i", "b"].includes(child.type)) count += await countEmbeds(child.id);
    }
    return count;
}

function finish(): void {
    const pass = results.filter((r) => r.ok).length;
    const fail = results.length - pass;
    console.log(`\n集成测试汇总：${pass}/${results.length} 通过${fail ? "，存在失败" : " —— library.ts 全生命周期真内核验收通过"}`);
    process.exit(fail ? 1 : 0);
}
