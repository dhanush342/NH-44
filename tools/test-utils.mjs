import assert from 'node:assert';
import { escapeHtml } from '../js/utils.js';

assert.strictEqual(escapeHtml('Hello World'), 'Hello World');
assert.strictEqual(escapeHtml('<script>alert("xss")</script>'), '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;');
assert.strictEqual(escapeHtml("Tom & Jerry's"), 'Tom &amp; Jerry&#39;s');
assert.strictEqual(escapeHtml(123), '123');

console.log('All utils tests passed successfully!');
