"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");

const {
    variables,
    commands,
    item,
    library,
} = require("./.build/entry.cjs");

test("T-0761 · 光标落点锚点 ({{cursor}} / {{xlc:cursor}} / $|$) 提取与多态标记剥离", () => {
    // 1. 标准 {{cursor}} 提取
    const res1 = variables.extractCursorPosition("你好，{{cursor}}！欢迎光临。");
    assert.equal(res1.text, "你好，！欢迎光临。");
    assert.equal(res1.cursorOffset, 3); // "你好，".length = 3
    assert.equal(variables.hasCursorToken("你好，{{cursor}}！欢迎光临。"), true);

    // 2. Templater 风格 $|$ 提取
    const res2 = variables.extractCursorPosition("致 $|$：\n这是一封正式通知函。");
    assert.equal(res2.text, "致 ：\n这是一封正式通知函。");
    assert.equal(res2.cursorOffset, 2); // "致 ".length = 2
    assert.equal(variables.hasCursorToken("致 $|$："), true);

    // 3. 常用专属 {{xlc:cursor}} 提取
    const res3 = variables.extractCursorPosition("### 会议纪要\n- 参会人：{{xlc:cursor}}");
    assert.equal(res3.text, "### 会议纪要\n- 参会人：");
    assert.equal(res3.cursorOffset, "### 会议纪要\n- 参会人：".length);

    // 4. 大小写自适应与空格容错 ({{Cursor}}, {{CURSOR}}, {{ xlc:cursor }})
    const res4 = variables.extractCursorPosition("Prefix: {{Cursor}} Postfix");
    assert.equal(res4.text, "Prefix:  Postfix");
    assert.equal(res4.cursorOffset, 8);

    const res5 = variables.extractCursorPosition("Prefix: {{ xlc:cursor }} Postfix");
    assert.equal(res5.text, "Prefix:  Postfix");
    assert.equal(res5.cursorOffset, 8);

    // 5. 多个锚点存在时以首个为准，其余锚点安全清除
    const res6 = variables.extractCursorPosition("一{{cursor}}二{{cursor}}三$|$四");
    assert.equal(res6.text, "一二三四");
    assert.equal(res6.cursorOffset, 1);

    // 6. 无锚点时原样返回且 cursorOffset 为 null
    const resNone = variables.extractCursorPosition("纯文本，没有光标标记。");
    assert.equal(resNone.text, "纯文本，没有光标标记。");
    assert.equal(resNone.cursorOffset, null);
    assert.equal(variables.hasCursorToken("纯文本，没有光标标记。"), false);
});

test("T-0762 · setCaretAtOffset 纯 DOM 光标精准投送原语跨节点计算", () => {
    // 模拟轻量 DOM 环境
    const doc = {
        createTextNode(val) {
            return {
                nodeType: 3,
                nodeValue: String(val),
            };
        },
        createRange() {
            return {
                startContainer: null,
                startOffset: 0,
                collapsed: false,
                setStart(node, offset) {
                    this.startContainer = node;
                    this.startOffset = offset;
                },
                collapse(toStart) {
                    this.collapsed = Boolean(toStart);
                },
            };
        },
        createTreeWalker(root) {
            const textNodes = [];
            function collect(n) {
                if (n.nodeType === 3) {
                    textNodes.push(n);
                } else if (n.childNodes) {
                    for (const c of n.childNodes) collect(c);
                }
            }
            collect(root);
            let idx = 0;
            return {
                nextNode() {
                    return idx < textNodes.length ? textNodes[idx++] : null;
                },
            };
        },
    };

    let activeRange = null;
    const win = {
        getSelection() {
            return {
                removeAllRanges() {
                    activeRange = null;
                },
                addRange(r) {
                    activeRange = r;
                },
            };
        },
    };

    const prevDoc = globalThis.document;
    const prevWin = globalThis.window;
    globalThis.document = doc;
    globalThis.window = win;

    try {
        // 1. 单一文本节点投送：在 "Hello World" 中定位到 offset=5
        const singleContainer = {
            nodeType: 1,
            childNodes: [doc.createTextNode("Hello World")],
        };
        const ok1 = commands.setCaretAtOffset(singleContainer, 5);
        assert.equal(ok1, true);
        assert.ok(activeRange);
        assert.equal(activeRange.startContainer.nodeValue, "Hello World");
        assert.equal(activeRange.startOffset, 5);
        assert.equal(activeRange.collapsed, true);

        // 2. 跨多个子文本节点投送：["你好，", "小驴", "常用！"]
        // 目标 offset = 4（应落在第二个节点 "小驴" 的第 1 个字符处：3 + 1 = 4）
        const node1 = doc.createTextNode("你好，"); // len=3
        const node2 = doc.createTextNode("小驴");   // len=2
        const node3 = doc.createTextNode("常用！"); // len=3
        const multiContainer = {
            nodeType: 1,
            childNodes: [
                { nodeType: 1, childNodes: [node1] },
                { nodeType: 1, childNodes: [node2, node3] },
            ],
        };
        const ok2 = commands.setCaretAtOffset(multiContainer, 4);
        assert.equal(ok2, true);
        assert.ok(activeRange);
        assert.equal(activeRange.startContainer, node2);
        assert.equal(activeRange.startOffset, 1);

        // 3. 超限偏移兜底：定位到 offset=999（应落在最后一个节点末尾 offset=3）
        const ok3 = commands.setCaretAtOffset(multiContainer, 999);
        assert.equal(ok3, true);
        assert.ok(activeRange);
        assert.equal(activeRange.startContainer, node3);
        assert.equal(activeRange.startOffset, 3);

        // 4. 非法或负数参数防御
        assert.equal(commands.setCaretAtOffset(multiContainer, -1), false);
        assert.equal(commands.setCaretAtOffset(multiContainer, NaN), false);
    } finally {
        globalThis.document = prevDoc;
        globalThis.window = prevWin;
    }
});

test("T-0763 · ActionExecutor 执行插入时正确透传并计算光标落点偏移", async () => {
    let capturedMarkdown = null;
    let capturedOffset = undefined;

    const DOC = "20261108100000-bbbbbbb";
    const BLOCK = "20261108100000-aaaaaaa";

    const mockHost = {
        hasActiveEditor: () => true,
        canInsertAtTarget: () => true,
        releaseInsertTarget: () => {},
        currentDocId: () => DOC,
        isMobile: () => false,
        writeClipboard: async () => true,
        openDoc: () => true,
        openAsset: () => true,
        openExternal: () => true,
        captureInsertTarget: () => ({ editor: null, handle: null, docId: DOC }),
        insertMarkdown: (md, _target, offset) => {
            capturedMarkdown = md;
            capturedOffset = offset;
            return true;
        },
    };

    const mockKernel = {
        request(endpoint, payload = {}) {
            switch (endpoint) {
                case "getChildBlocks":
                    return Promise.resolve([{ id: BLOCK, type: "p" }]);
                case "getBlockKramdown":
                    return Promise.resolve({ id: payload.id, kramdown: "【待办项】{{cursor}}（请于今日前完成）" });
                case "checkBlocksExist":
                    return Promise.resolve({ [DOC]: true, [BLOCK]: true });
                default:
                    return Promise.resolve(null);
            }
        },
    };

    const lib = new library.LibraryService(mockKernel);
    lib.setConfig({ mode: "doc", notebookIds: [], containerDocIds: [DOC], createdDocIds: [], configuredAt: 1 });

    const mockItem = {
        id: "xlc-cursor001",
        blockId: BLOCK,
        libraryDocId: DOC,
        itemType: "text",
        title: "带光标测试模板",
        alias: "",
        tags: [],
        category: "",
        summary: "",
        source: { sourceDocId: DOC, sourceBlockId: "", sourceType: "manual" },
        url: "",
        targetBlockId: "",
        createdAt: 0,
        updatedAt: 0,
        droppedFields: [],
    };

    const executor = new commands.ActionExecutor(
        lib,
        mockHost,
        () => {},
        () => {},
        {
            enabled: () => true,
            now: () => new Date(),
            currentDoc: async () => null,
        }
    );

    const receipt = await executor.run(mockItem, "insert");
    assert.equal(receipt.ok, true);
    assert.equal(receipt.message, "inserted");
    assert.equal(capturedMarkdown, "【待办项】（请于今日前完成）");
    assert.equal(capturedOffset, 5); // "【待办项】".length = 5
    assert.equal(receipt.cursorOffset, 5);
});
