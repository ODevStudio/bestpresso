import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

test('skin HTML uses LF line endings for Decaid script injection on every build host', () => {
  const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8')
  assert.doesNotMatch(html, /\r/, 'CRLF offsets can make Decaid inject its script inside the stylesheet link')
  const attributes = readFileSync(new URL('../.gitattributes', import.meta.url), 'utf8')
  assert.match(attributes, /^index\.html text eol=lf$/m)
})
