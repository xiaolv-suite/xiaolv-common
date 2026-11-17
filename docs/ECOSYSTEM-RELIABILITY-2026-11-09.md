# 2026-11-09 生态可靠性整改契约

本批处理审计ECO-001～007。八个独立仓库保留相同共用源，测试入口 `pnpm run test:ecosystem:reliability`（直接node:test，不启动宿主、不开网络）。外部总记录：`D:/思源插件配套/整改/2026-11-09`。本文件是本批增量契约，旧历史账本不回写。

## 写入与回执

- `callBridgeOutcome` 统一捕获探测/就绪/能力/执行异常，返回 applied、unavailable、not_ready、unsupported、rejected、unknown。applied表示桥调用完成，业务仍须检验内层回执。
- 业务超时或caller抛出传输异常为unknown，不代表取消或未写入；只有供应者明确拒绝信封才按拒绝处理。供应者必须保留requestId并对账。新写消费不应只用旧boolean `callBridge`推断确定失败。
- `createCardSafely` 只在原子卡回执有真实新块ID且enrolled=true时成功。`sendExtractToCardsSafely`允许kind=extract、真实新摘录ID、enrolled=false（与FSRS隔离）；旧外ok/内失败不成功。二者保留requestId，部分成功/`write-unknown`信封中的createdBlockID/docID也保留供恢复，不转换为确定未创建。
- `pushToGleanReadingSafely`仅在ingestClip确认ok+docId时报告bridge成功，不再发送第二条无回执写事件；超时unknown需先核对。明确不可用或拒绝可以保留可复制草稿。
- 复习总量优先供应端unreviewedCount，只有总量缺失/非法时使用新旧互斥分项，不再重复加总。

## 文档互斥

`withDocLock`在同window共享Map内按docId串行。等待锁超时的任务不会随后偷偷执行；已发送写入超时只结束调用者等待，原任务settle前保持锁。永久挂起需要对账/重启处理，不再“强制释放”。它不是跨设备事务锁，也不保证消除所有宿主锁错误。

## 备份与注册

联合包仍v=1，增加兼容字段expectedPlugins、failed、partial；每个只读备份provider默认10秒有界等待，失败不会静默丢失。恢复保留缺失期望项目的失败清单，校验包版本及payload形状。

罗盘只说“已发起下载”，不声称浏览器文件已经落盘；生成链接/发起导出异常显示错误。联合包是各插件注册切面，不等于完整思源笔记本、媒体及内核历史备份。

备份、检索与自动化注册表由共享window持有，诊断通过hub查询；卸载须验证owner，不能删新实例。罗盘入口保留身份检查。诊断文字不再仅凭注册就宣称“协同正常”。部署本批后应整体重载八插件或重启隔离宿主，避免新旧基础设施混装；本批不声称已完成热替换旧闭包数据的无损迁移。

## UI与验收

共用手机罗盘的次级按钮/搜索输入至少44px；搜索16px，420px桌面头部允许换行。Chrome测布局、焦点、Esc和错误提示；Android/iOS、安全区、软键盘和真实宿主仍单列验收。

新增行为回归直接执行本仓真实生产源。审前源码负向失败记录、修后结果和Chrome证据见外部整改目录；不把源码字符串存在或mock自造结果当作实现完成。
