import assert from 'assert';

// Setup fake window object for SaveManager before unload listener
if (typeof global.window === 'undefined') {
  global.window = { addEventListener: () => {} };
}

const { SaveManager } = await import('../js/save.js');

console.log('Testing SaveManager password hash privacy in encode()...');

// Test 1: login with a user and check encode output
const loginRes = SaveManager.login('TestUser', 'SecretPass123');
assert.strictEqual(loginRes.ok, true, 'Login should succeed');

const exported = SaveManager.encode();
assert.ok(exported, 'Export code should be non-empty');

// Decode the base64 meta payload manually to check fields
const di = exported.lastIndexOf('.');
assert.ok(di >= 0, 'Export code must contain base64 meta payload after dot');
const metaPayload = exported.slice(di + 1);
const metaJson = decodeURIComponent(atob(metaPayload));
const meta = JSON.parse(metaJson);

assert.strictEqual(meta.account.passHash, undefined, 'meta.account.passHash should be undefined');
assert.strictEqual(JSON.stringify(meta).includes('passHash'), false, 'meta payload must not contain passHash string at all');

// Test 2: decode should still succeed on exported save code
const decoded = SaveManager.decode(exported);
assert.ok(decoded, 'Decode should succeed for exported save code');
assert.strictEqual(decoded.name, 'TestUser', 'Decoded user name should match normalized name');

console.log('All security tests passed!');
