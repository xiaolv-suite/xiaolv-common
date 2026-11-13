const test = require('node:test');
const assert = require('node:assert/strict');
const {pasteQueue, pasteQueueService} = require('./.build/entry.cjs');
const item = {id:'one',title:'开票资料',content:'正文'};
test('queue output: reject and false preserve head, retry succeeds once', async () => {
    const queue = new pasteQueue.PasteQueue(); queue.setQueue([item]);
    for (const output of [async()=>{throw Error('denied')},async()=>false]) {
        assert.equal((await queue.consume(output)).ok,false);
        assert.equal(queue.peek().id,'one');
    }
    assert.equal((await queue.consume(async()=>true)).ok,true);
    assert.equal(queue.size(),0);
});
test('queue output: delayed concurrent call does not output next head or consume twice', async () => {
    const queue = new pasteQueue.PasteQueue(); queue.setQueue([item,{...item,id:'two'}]);
    let finish; let calls=0;
    const first=queue.consume(async()=>{calls++;return new Promise(r=>finish=r)});
    assert.equal((await queue.consume(async()=>{calls++;return true})).reason,'busy');
    assert.equal(queue.size(),2); finish(true); await first;
    assert.equal(calls,1); assert.equal(queue.peek().id,'two');
});
test('queue output: concurrent clear/replacement never removes replacement head', async () => {
    const queue=new pasteQueue.PasteQueue();queue.setQueue([item]);
    let finish;const first=queue.consume(async()=>new Promise(r=>finish=r));
    queue.setQueue([{...item,id:'replacement'}]);finish(true);
    assert.equal((await first).reason,'queue-changed');assert.equal(queue.peek().id,'replacement');
});
test('shared service: desktop false insert retains queue; mobile uses clipboard', async () => {
    const queue=new pasteQueue.PasteQueue();pasteQueue.setActivePasteQueue(queue);queue.setQueue([item]);
    let copies=0,inserts=0;
    const host={hasActiveEditor:()=>true,isMobile:()=>false,currentDocId:()=> '20261109000000-doc0001',captureInsertTarget:()=>({docId:'20261109000000-doc0001'}),canInsertAtTarget:()=>true,releaseInsertTarget:()=>{},insertMarkdown:async()=>{inserts++;return false},writeClipboard:async()=>{copies++;return true}};
    assert.equal((await pasteQueueService.outputNextPasteQueueItem(host)).ok,false);
    assert.equal(queue.size(),1); host.isMobile=()=>true;
    assert.equal((await pasteQueueService.outputNextPasteQueueItem(host)).ok,true);
    assert.equal(copies,1);assert.equal(inserts,1);
});
test('shared service: changed editor never receives queued content', async()=>{
    const queue=new pasteQueue.PasteQueue();pasteQueue.setActivePasteQueue(queue);queue.setQueue([item]);
    let inserts=0,releases=0;
    const host={hasActiveEditor:()=>true,isMobile:()=>false,captureInsertTarget:()=>({docId:'20261109000000-doc0001'}),canInsertAtTarget:()=>false,releaseInsertTarget:()=>releases++,insertMarkdown:()=>{inserts++;return true}};
    assert.equal((await pasteQueueService.outputNextPasteQueueItem(host)).ok,false);
    assert.equal(queue.size(),1);assert.equal(inserts,0);assert.equal(releases,1);
});
