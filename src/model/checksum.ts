// 轻量 CRC32 / Adler32 校验和工具（零依赖）
const CRC32_TABLE = new Uint32Array(256);
for (let i = 0; i < 256; i++) {
    let c = i;
    for (let j = 0; j < 8; j++) {
        c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    }
    CRC32_TABLE[i] = c;
}

function stringToUtf8Bytes(str: string): number[] {
    const bytes: number[] = [];
    for (let i = 0; i < str.length; i++) {
        let code = str.charCodeAt(i);
        if (code >= 0xd800 && code <= 0xdbff) {
            i++;
            const next = str.charCodeAt(i);
            code = ((code - 0xd800) << 10) + (next - 0xdc00) + 0x10000;
        }
        if (code <= 0x7f) {
            bytes.push(code);
        } else if (code <= 0x7ff) {
            bytes.push(0xc0 | (code >> 6));
            bytes.push(0x80 | (code & 0x3f));
        } else if (code <= 0xffff) {
            bytes.push(0xe0 | (code >> 12));
            bytes.push(0x80 | ((code >> 6) & 0x3f));
            bytes.push(0x80 | (code & 0x3f));
        } else {
            bytes.push(0xf0 | (code >> 18));
            bytes.push(0x80 | ((code >> 12) & 0x3f));
            bytes.push(0x80 | ((code >> 6) & 0x3f));
            bytes.push(0x80 | (code & 0x3f));
        }
    }
    return bytes;
}

export function calculateChecksum(text: string, algorithm: "crc32" | "adler32" = "crc32"): string {
    if (!text || typeof text !== "string") return "00000000";
    const bytes = stringToUtf8Bytes(text);
    if (algorithm === "adler32") {
        let a = 1;
        let b = 0;
        const MOD_ADLER = 65521;
        for (let i = 0; i < bytes.length; i++) {
            a = (a + bytes[i]!) % MOD_ADLER;
            b = (b + a) % MOD_ADLER;
        }
        const adler = ((b << 16) | a) >>> 0;
        return adler.toString(16).padStart(8, "0");
    }
    let crc = 0xFFFFFFFF;
    for (let i = 0; i < bytes.length; i++) {
        const byte = bytes[i]!;
        crc = (crc >>> 8) ^ CRC32_TABLE[(crc ^ byte) & 0xFF]!;
    }
    crc = (crc ^ 0xFFFFFFFF) >>> 0;
    return crc.toString(16).padStart(8, "0");
}
