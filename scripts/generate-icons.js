/**
 * 生成 Chrome 扩展图标的脚本
 * 使用方式: node scripts/generate-icons.js
 * 
 * 此脚本会创建简单的 Jupiter 风格绿色渐变图标
 * 如需更精美的图标，请从 Jupiter 官方获取或自行设计
 */

const fs = require('fs');
const path = require('path');

// 简单的 PNG 生成函数（纯 JavaScript，无需外部依赖）
function createPNG(width, height, r, g, b) {
  // PNG 文件头
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  
  // IHDR chunk
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8;  // bit depth
  ihdrData[9] = 2;  // color type (RGB)
  ihdrData[10] = 0; // compression
  ihdrData[11] = 0; // filter
  ihdrData[12] = 0; // interlace
  
  const ihdrChunk = createChunk('IHDR', ihdrData);
  
  // IDAT chunk - 图像数据
  const rawData = [];
  for (let y = 0; y < height; y++) {
    rawData.push(0); // filter byte
    for (let x = 0; x < width; x++) {
      // 创建简单的渐变效果
      const factor = 1 - (y / height) * 0.3;
      rawData.push(Math.floor(r * factor));
      rawData.push(Math.floor(g * factor));
      rawData.push(Math.floor(b * factor));
    }
  }
  
  const zlib = require('zlib');
  const compressed = zlib.deflateSync(Buffer.from(rawData));
  const idatChunk = createChunk('IDAT', compressed);
  
  // IEND chunk
  const iendChunk = createChunk('IEND', Buffer.alloc(0));
  
  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

function createChunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);
  
  const typeBuffer = Buffer.from(type, 'ascii');
  const crcData = Buffer.concat([typeBuffer, data]);
  const crc = crc32(crcData);
  
  const crcBuffer = Buffer.alloc(4);
  crcBuffer.writeUInt32BE(crc >>> 0, 0);
  
  return Buffer.concat([length, typeBuffer, data, crcBuffer]);
}

// CRC32 实现
function crc32(data) {
  let crc = 0xFFFFFFFF;
  const table = makeCRCTable();
  
  for (let i = 0; i < data.length; i++) {
    crc = (crc >>> 8) ^ table[(crc ^ data[i]) & 0xFF];
  }
  
  return crc ^ 0xFFFFFFFF;
}

function makeCRCTable() {
  const table = [];
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = ((c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1));
    }
    table[n] = c;
  }
  return table;
}

// Jupiter 品牌色（青绿色）
const JUPITER_GREEN = { r: 31, g: 227, b: 178 };

// 确保 icons 目录存在
const iconsDir = path.join(__dirname, '..', 'icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// 生成不同尺寸的图标
const sizes = [16, 48, 128];

sizes.forEach(size => {
  const png = createPNG(size, size, JUPITER_GREEN.r, JUPITER_GREEN.g, JUPITER_GREEN.b);
  const filename = path.join(iconsDir, `icon${size}.png`);
  fs.writeFileSync(filename, png);
  console.log(`✅ 已生成: icon${size}.png`);
});

console.log('\n🎉 所有图标已生成完成！');
console.log('图标位于 icons/ 目录下');
