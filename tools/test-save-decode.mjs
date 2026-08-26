import assert from 'node:assert';

// Setup fake window object for SaveManager before unload listener
if (typeof global.window === 'undefined') {
  global.window = { addEventListener: () => {} };
}

const { SaveManager } = await import('../js/save.js');

console.log('Testing SaveManager.decode edge cases and error handling...');

// Helper: check decode returns null
function assertNull(val, description) {
  const res = SaveManager.decode(val);
  assert.strictEqual(res, null, `Expected null for: ${description}`);
}

// 1. Invalid / Empty / Non-string Inputs
assertNull(null, 'null input');
assertNull(undefined, 'undefined input');
assertNull('', 'empty string');
assertNull('   ', 'whitespace string');
assertNull(12345, 'number input');
assertNull({}, 'object input');
assertNull(true, 'boolean input');

// 2. Invalid Strings (Garbage, Short, Long)
assertNull('INVALID', 'short invalid string');
assertNull('A'.repeat(43), '43 character string (too short for v2)');
assertNull('A'.repeat(45), '45 character string (between v2 and v3 length)');
assertNull('A'.repeat(49), '49 character string (too long for v3)');
assertNull('this-is-a-completely-garbage-string-that-should-fail-decoding-1234567890', 'long garbage string');

// 3. Characters outside Base32 alphabet (e.g. 'U')
// 'U' is excluded from Crockford Base32 in B32 constant ('0123456789ABCDEFGHJKMNPQRSTVWXYZ')
const stringWithU = 'U'.repeat(48);
assertNull(stringWithU, 'string containing characters outside B32 alphabet');

// 4. Valid encoded code testing
SaveManager.login('DecodeTester', 'Pass123!');
const validCode = SaveManager.encode();
assert.ok(validCode, 'SaveManager.encode should produce valid code');

const decodedVal = SaveManager.decode(validCode);
assert.ok(decodedVal, 'SaveManager.decode should return object for valid code');
assert.strictEqual(decodedVal.name, 'DecodeTester', 'Decoded name should match');
assert.strictEqual(decodedVal.v, 3, 'Default encoded version should be 3');
assert.strictEqual(typeof decodedVal.gold, 'number', 'gold should be a number');
assert.strictEqual(typeof decodedVal.best, 'number', 'best should be a number');
assert.ok(Array.isArray(decodedVal.upg), 'upg should be an array');
assert.ok(decodedVal.st && typeof decodedVal.st === 'object', 'st should be an object');

// 5. Save code without metadata portion
const di = validCode.lastIndexOf('.');
assert.ok(di >= 0, 'valid code should have dot before meta');
const codeWithoutMeta = validCode.slice(0, di);
const decodedNoMeta = SaveManager.decode(codeWithoutMeta);
assert.ok(decodedNoMeta, 'SaveManager.decode should succeed even without metadata');
assert.strictEqual(decodedNoMeta.name, 'DRIVER', 'Default name should be DRIVER when metadata absent');

// 6. Corrupted checksum test
// Modify one character of raw code to trigger checksum error
const rawPart = validCode.slice(0, di);
const charToFlip = rawPart[0] === '0' ? '1' : '0';
const corruptedRaw = charToFlip + rawPart.slice(1);
assertNull(corruptedRaw, 'Corrupted raw save code should fail checksum');
assertNull(corruptedRaw + validCode.slice(di), 'Corrupted raw save code with meta should fail checksum');

// 7. Malformed metadata payloads
const codeWithBadBase64Meta = rawPart + '.!!!not_base64!!!';
const decodedBadBase64 = SaveManager.decode(codeWithBadBase64Meta);
assert.ok(decodedBadBase64, 'SaveManager.decode should return valid save data even if base64 meta is malformed');
assert.strictEqual(decodedBadBase64.name, 'DRIVER', 'Should fallback to default DRIVER name when meta base64 fails');

const codeWithBadJsonMeta = rawPart + '.' + btoa('{invalid_json');
const decodedBadJson = SaveManager.decode(codeWithBadJsonMeta);
assert.ok(decodedBadJson, 'SaveManager.decode should return valid save data even if JSON meta is malformed');
assert.strictEqual(decodedBadJson.name, 'DRIVER', 'Should fallback to default DRIVER name when meta JSON fails');

// 8. Formatting resilience (lowercase, spaces, hyphens, I/L -> 1, O -> 0)
const formattedCode = rawPart.toLowerCase().replace(/-/g, ' ');
const decodedFormatted = SaveManager.decode(formattedCode);
assert.ok(decodedFormatted, 'SaveManager.decode should handle lowercase, spaces, hyphens');

console.log('All SaveManager.decode tests passed successfully!');
