#!/usr/bin/env node
// NoahLang Interpreter v2.0.1
// Creator: NoahKahenge
//
// v2.0.1 — list literals.
//
// Fixed:
//   * parsePrimary now handles `[...]` as a list literal. This was
//     missing in v2.0.0, so `for x in ["a", "b"]` failed at the `[`.
//     Now `[...]` works anywhere an expression is valid: in `for`,
//     `let`, function arguments, record fields, nested inside other
//     lists.
//
// Everything from v2.0.0 works identically.

'use strict';

const fs = require('fs');
const path = require('path');
const http = require('http');
const { exec } = require('child_process');

// ---------------------------------------------
// ERRORS
// ---------------------------------------------
class NoahLangError extends Error {
  constructor(message, line, column = null, sourceLine = null) {
    const where = column != null ? `Line ${line}, column ${column}` : `Line ${line}`;
    super(`${where}: ${message}`);
    this.name = 'NoahLangError';
    this.line = line;
    this.column = column;
    this.sourceLine = sourceLine;
    this.rawMessage = message;
  }
}

// ---------------------------------------------
// COMMENT STRIPPING
// ---------------------------------------------
function removeComment(text) {
  let quote = null;
  let escaped = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (escaped) { escaped = false; continue; }
    if (ch === '\\' && quote) { escaped = true; continue; }
    if ((ch === '"' || ch === "'") && (!quote || quote === ch)) { quote = quote ? null : ch; continue; }
    if (!quote && ch === '/' && text[i + 1] === '/') return text.slice(0, i).trimEnd();
  }
  return text.trimEnd();
}

// ---------------------------------------------
// TOKENIZER
// ---------------------------------------------
const STRING_ESCAPES = Object.freeze({
  n: '\n', r: '\r', t: '\t', b: '\b', f: '\f', v: '\v', 0: '\0',
  '{': '{', '}': '}', '\\': '\\', '"': '"', "'": "'"
});
const WORD_OPERATORS = new Set(['and', 'or', 'not']);

function tokenizeExpression(source, line) {
  const tokens = [];
  let i = 0;
  while (i < source.length) {
    const ch = source[i];
    if (/\s/.test(ch)) { i++; continue; }

    if (ch === '"' || ch === "'") {
      const quote = ch;
      const startCol = i + 1;
      i++;
      const parts = [];
      let buffer = '';
      let closed = false;
      while (i < source.length) {
        const c = source[i++];
        if (c === '\\' && i < source.length) {
          const next = source[i++];
          if (next === 'u' && i + 4 <= source.length) {
            const hex = source.slice(i, i + 4);
            if (/^[0-9a-fA-F]{4}$/.test(hex)) {
              buffer += String.fromCharCode(parseInt(hex, 16));
              i += 4;
              continue;
            }
          }
          buffer += Object.prototype.hasOwnProperty.call(STRING_ESCAPES, next) ? STRING_ESCAPES[next] : next;
        } else if (c === quote) { closed = true; break; }
        else if (c === '{') {
          if (buffer.length) { parts.push({ type: 'text', value: buffer }); buffer = ''; }
          let depth = 1;
          let expr = '';
          while (i < source.length) {
            const d = source[i++];
            if (d === '{') depth++;
            else if (d === '}') { depth--; if (depth === 0) break; }
            if (depth > 0) expr += d;
          }
          if (depth !== 0) throw new NoahLangError('unterminated interpolation in string', line, startCol);
          parts.push({ type: 'expr', value: expr });
        } else { buffer += c; }
      }
      if (!closed) throw new NoahLangError('unterminated string literal', line, startCol);
      if (buffer.length || parts.length === 0) parts.push({ type: 'text', value: buffer });
      tokens.push({ type: 'string', parts, column: startCol });
      continue;
    }

    if (ch === '.' && source[i + 1] === '.') {
      tokens.push({ type: 'range', value: '..', column: i + 1 });
      i += 2;
      continue;
    }
    if (ch === '.') {
      tokens.push({ type: 'dot', value: '.', column: i + 1 });
      i++;
      continue;
    }

    const number = source.slice(i).match(/^\d+(?:\.\d+)?/);
    if (number) {
      tokens.push({ type: 'literal', value: Number(number[0]), column: i + 1 });
      i += number[0].length;
      continue;
    }

    const identifier = source.slice(i).match(/^[A-Za-z_][A-Za-z0-9_]*/);
    if (identifier) {
      const word = identifier[0];
      const column = i + 1;
      if (word === 'true' || word === 'false') tokens.push({ type: 'literal', value: word === 'true', column });
      else if (word === 'null') tokens.push({ type: 'literal', value: null, column });
      else if (word === 'then') tokens.push({ type: 'then', value: 'then', column });
      else if (WORD_OPERATORS.has(word)) tokens.push({ type: 'operator', value: word, column });
      else tokens.push({ type: 'identifier', value: word, column });
      i += word.length;
      continue;
    }

    const two = source.slice(i, i + 2);
    if (['==', '!=', '<=', '>='].includes(two)) {
      tokens.push({ type: 'operator', value: two, column: i + 1 });
      i += 2;
      continue;
    }

    if ('+-*/%(),<>[]'.includes(ch)) {
      const punct = '()[],'.includes(ch);
      tokens.push({ type: punct ? ch : 'operator', value: ch, column: i + 1 });
      i++;
      continue;
    }

    throw new NoahLangError(`unsupported character '${ch}' in expression`, line, i + 1);
  }
  return tokens;
}

// ---------------------------------------------
// RUNTIME VALUES
// ---------------------------------------------
class NoahRange {
  constructor(start, end) { this.start = start; this.end = end; }
}
function describeType(value) {
  if (value === null) return 'null';
  if (Array.isArray(value)) return 'array';
  if (value instanceof NoahRange) return 'range';
  if (typeof value === 'object') return 'record';
  return typeof value;
}

// ---------------------------------------------
// EXPRESSION PARSER
// ---------------------------------------------
class ExpressionParser {
  constructor(tokens, interpreter, env, line) {
    this.tokens = tokens; this.interpreter = interpreter;
    this.env = env; this.line = line; this.position = 0;
  }
  peek() { return this.tokens[this.position]; }
  take() { return this.tokens[this.position++]; }
  expect(type, value) {
    const token = this.take();
    if (!token || token.type !== type || (value !== undefined && token.value !== value)) {
      throw new NoahLangError(`expected '${value ?? type}' in expression`, this.line, token ? token.column : null);
    }
    return token;
  }
  parse() {
    const result = this.parsePipeline();
    if (this.peek()) throw new NoahLangError(`unexpected '${this.peek().value}' in expression`, this.line, this.peek().column);
    return result;
  }
  parsePipeline() {
    let left = this.parseOr();
    while (this.peek() && this.peek().type === 'then') {
      this.take();
      const stage = this.take();
      if (!stage) throw new NoahLangError('incomplete pipeline after `then`', this.line);
      if (stage.type !== 'identifier') throw new NoahLangError("`then` expects a function name", this.line, stage.column);
      if (this.peek() && this.peek().type === '(') {
        this.take();
        const extraArgs = [];
        if (!this.peek() || this.peek().type !== ')') {
          while (true) {
            extraArgs.push(this.parseOr());
            if (!this.peek() || this.peek().type !== ',') break;
            this.take();
          }
        }
        this.expect(')', ')');
        left = this.interpreter.callFunction(stage.value, [left, ...extraArgs], this.line, this.env);
      } else {
        left = this.interpreter.callFunction(stage.value, [left], this.line, this.env);
      }
    }
    return left;
  }
  parseOr() {
    let left = this.parseAnd();
    while (this.peek() && this.peek().type === 'operator' && this.peek().value === 'or') {
      this.take();
      if (left) this._skipOperand(); else left = this.parseAnd();
    }
    return left;
  }
  parseAnd() {
    let left = this.parseNot();
    while (this.peek() && this.peek().type === 'operator' && this.peek().value === 'and') {
      this.take();
      if (!left) this._skipOperand(); else left = this.parseNot();
    }
    return left;
  }
  parseNot() {
    if (this.peek() && this.peek().type === 'operator' && this.peek().value === 'not') {
      this.take(); return !this.parseNot();
    }
    return this.parseComparison();
  }
  _skipOperand() {
    const saved = this.interpreter.skipEvaluation;
    this.interpreter.skipEvaluation = true;
    try { this.parseNot(); } finally { this.interpreter.skipEvaluation = saved; }
  }
  parseComparison() {
    let left = this.parseAdditive();
    while (this.peek() && this.peek().type === 'operator' && ['==', '!=', '<', '>', '<=', '>='].includes(this.peek().value)) {
      const op = this.take().value;
      const right = this.parseAdditive();
      switch (op) {
        case '==': left = left === right; break;
        case '!=': left = left !== right; break;
        case '<':  left = left < right; break;
        case '>':  left = left > right; break;
        case '<=': left = left <= right; break;
        case '>=': left = left >= right; break;
      }
    }
    return left;
  }
  parseAdditive() {
    let left = this.parseMultiplicative();
    while (this.peek() && this.peek().type === 'operator' && ['+', '-'].includes(this.peek().value)) {
      const op = this.take().value;
      const right = this.parseMultiplicative();
      if (op === '+') {
        left = (typeof left === 'string' || typeof right === 'string')
          ? String(left ?? '') + String(right ?? '')
          : Number(left) + Number(right);
      } else {
        this.requireNumber(left, '-'); this.requireNumber(right, '-');
        left = Number(left) - Number(right);
      }
    }
    return left;
  }
  parseMultiplicative() {
    let left = this.parseUnary();
    while (this.peek() && this.peek().type === 'operator' && ['*', '/', '%'].includes(this.peek().value)) {
      const op = this.take().value;
      const right = this.parseUnary();
      this.requireNumber(left, op); this.requireNumber(right, op);
      if (op === '*') left = Number(left) * Number(right);
      else if (op === '/') {
        if (Number(right) === 0) throw new NoahLangError('division by zero', this.line);
        left = Number(left) / Number(right);
      } else {
        if (Number(right) === 0) throw new NoahLangError('modulo by zero', this.line);
        left = Number(left) % Number(right);
      }
    }
    return left;
  }
  parseUnary() {
    if (this.peek() && this.peek().type === 'operator' && ['-', '+'].includes(this.peek().value)) {
      const op = this.take().value;
      const value = Number(this.parseUnary());
      return op === '-' ? -value : value;
    }
    return this.parsePostfix();
  }
  parsePostfix() {
    let value = this.parsePrimary();
    while (this.peek() && (this.peek().type === '[' || this.peek().type === 'dot')) {
      if (this.peek().type === 'dot') {
        this.take();
        const field = this.take();
        if (!field || field.type !== 'identifier') throw new NoahLangError('expected field name after .', this.line, field ? field.column : null);
        if (typeof value !== 'object' || value === null) throw new NoahLangError(`cannot read field '${field.value}' on ${describeType(value)}`, this.line);
        value = value[field.value];
        continue;
      }
      this.take();
      const idx = this.parseOr();
      this.expect(']', ']');
      if (Array.isArray(value)) {
        const n = Number(idx);
        if (!Number.isInteger(n) || n < 0 || n >= value.length) throw new NoahLangError(`index ${stringify(idx)} out of range for array of length ${value.length}`, this.line);
        value = value[n];
      } else if (typeof value === 'string') {
        const n = Number(idx);
        if (!Number.isInteger(n) || n < 0 || n >= value.length) throw new NoahLangError(`index ${stringify(idx)} out of range for string of length ${value.length}`, this.line);
        value = value[n];
      } else if (typeof value === 'object' && value !== null) {
        const key = String(idx);
        if (!(key in value)) throw new NoahLangError(`record has no field '${key}'`, this.line);
        value = value[key];
      } else {
        throw new NoahLangError(`cannot index ${describeType(value)}`, this.line);
      }
    }
    return value;
  }
  parsePrimary() {
    const token = this.take();
    if (!token) throw new NoahLangError('incomplete expression', this.line);

    // NEW: list literal
    if (token.type === '[') {
      const items = [];
      if (!this.peek() || this.peek().type !== ']') {
        while (true) {
          items.push(this.parsePipeline());
          if (!this.peek() || this.peek().type !== ',') break;
          this.take();
        }
      }
      this.expect(']', ']');
      return items;
    }

    if (token.type === 'literal' && this.peek() && this.peek().type === 'range') {
      this.take();
      const end = this.parseOr();
      return new NoahRange(Number(token.value), Number(end));
    }
    if (token.type === 'literal') return token.value;
    if (token.type === 'string') {
      let out = '';
      for (const part of token.parts) {
        if (part.type === 'text') out += part.value;
        else { const value = this.interpreter.evaluateExpression(part.value, this.env, this.line); out += stringify(value); }
      }
      return out;
    }
    if (token.type === '(') { const value = this.parsePipeline(); this.expect(')', ')'); return value; }
    if (token.type === 'identifier') {
      const isCall = this.peek() && this.peek().type === '(';
      if (isCall) {
        this.take();
        const args = [];
        if (!this.peek() || this.peek().type !== ')') {
          while (true) {
            args.push(this.parsePipeline());
            if (!this.peek() || this.peek().type !== ',') break;
            this.take();
          }
        }
        this.expect(')', ')');
        const found = this.env.lookup(token.value);
        if (found && found.value && found.value.__noahFunction) {
          return this.interpreter.callFunction(found.value.__noahFunction, args, this.line, this.env);
        }
        return this.interpreter.callFunction(token.value, args, this.line, this.env);
      }
      const found = this.env.lookup(token.value);
      if (!found) throw new NoahLangError(`undefined variable '${token.value}'`, this.line, token.column);
      if (this.peek() && this.peek().type === 'range') {
        this.take();
        const end = this.parseOr();
        return new NoahRange(Number(found.value), Number(end));
      }
      return found.value;
    }
    throw new NoahLangError(`unexpected '${token.value}' in expression`, this.line, token.column);
  }
  requireNumber(value, op) {
    if (typeof value === 'number') return;
    if (typeof value === 'string' && value.trim() !== '' && !Number.isNaN(Number(value))) return;
    throw new NoahLangError(`operator '${op}' requires numbers, got ${describeType(value)}`, this.line);
  }
}

// ---------------------------------------------
// ENVIRONMENT
// ---------------------------------------------
class Environment {
  constructor(parent = null) { this.vars = new Map(); this.parent = parent; }
  hasOwn(name) { return this.vars.has(name); }
  has(name) { let s = this; while (s) { if (s.vars.has(name)) return true; s = s.parent; } return false; }
  lookup(name) {
    let s = this;
    while (s) { if (s.vars.has(name)) return { value: s.vars.get(name), scope: s }; s = s.parent; }
    return null;
  }
  get(name) { const f = this.lookup(name); return f ? f.value : undefined; }
  define(name, value) { this.vars.set(name, value); }
  assign(name, value) {
    const f = this.lookup(name);
    if (!f) return false;
    f.scope.vars.set(name, value);
    return true;
  }
}

const RETURN_SIGNAL = Symbol('return');
const BREAK_SIGNAL = Symbol('break');
const CONTINUE_SIGNAL = Symbol('continue');
const RELOAD_SCRIPT = `<script>(function(){try{var s=new EventSource('/__reload');s.onmessage=function(e){if(e.data==='reload'){location.reload();}};}catch(e){}})();</script>`;
let browserOpenedGlobally = false;

// ---------------------------------------------
// INTERPRETER
// ---------------------------------------------
class Interpreter {
  constructor(options = {}) {
    this.globalEnv = new Environment(null);
    this.functions = new Map();
    this.inputQueue = Array.isArray(options.input) ? [...options.input] : [];
    this.stdin = typeof options.stdin === 'string' ? options.stdin : null;
    this.output = typeof options.output === 'function' ? options.output : (line) => console.log(line);
    this.maxDepth = Number.isInteger(options.maxDepth) && options.maxDepth > 0 ? options.maxDepth : 1000;
    this.callDepth = 0;
    this.baseDir = options.baseDir || process.cwd();
    this.currentDir = this.baseDir;
    this.pulledFiles = new Set();
    this.pullStack = [];
    this.skipEvaluation = false;
    this.eventHandlers = new Map();
    this.httpServer = null;
    this.reloadClients = new Set();
    this.onFileRead = typeof options.onFileRead === 'function' ? options.onFileRead : null;
    this.installBuiltins();
  }

  runEventHandler(id) {
    const registered = [...this.eventHandlers.keys()];
    this.output(`[dispatch] id=${JSON.stringify(id)} registered=[${registered.join(', ')}]`);
    if (typeof id !== 'string') throw new NoahLangError('dispatch: id must be a string', 0);
    const name = this.eventHandlers.get(id);
    if (!name) {
      this.output(`[dispatch] NO HANDLER for id '${id}'`);
      throw new NoahLangError(`dispatch: no handler for id '${id}'`, 0);
    }
    this.output(`[dispatch] calling '${name}'`);
    try {
      const result = this.callFunction(name, [], 0, this.globalEnv);
      this.output(`[dispatch] '${name}' returned ${stringify(result)}`);
      return result;
    } catch (err) {
      this.output(`[dispatch] '${name}' threw: ${err.message}`);
      throw err;
    }
  }

  installBuiltins() {
    const def = (name, impl) => this.globalEnv.define(name, impl);
    def('write', (...args) => { if (!this.skipEvaluation) this.output(args.map(stringify).join(' ')); return null; });
    def('print', (...args) => { if (!this.skipEvaluation) this.output(args.map(stringify).join(' ')); return null; });
    def('len', (value) => {
      if (typeof value === 'string' || Array.isArray(value)) return value.length;
      if (value == null) return 0;
      if (typeof value === 'object') return Object.keys(value).length;
      throw new NoahLangError('len() expects a string, array, or record', 0);
    });
    def('str', (value) => stringify(value));
    def('num', (value) => {
      const n = Number(value);
      if (Number.isNaN(n)) throw new NoahLangError(`num() cannot convert '${stringify(value)}'`, 0);
      return n;
    });
    def('bool', (value) => Boolean(value));
    def('append', (arr, value) => {
      if (!Array.isArray(arr)) throw new NoahLangError('append() expects an array', 0);
      return arr.concat([value]);
    });
    def('remove', (arr, index) => {
      if (!Array.isArray(arr)) throw new NoahLangError('remove() expects an array', 0);
      const n = Number(index);
      if (!Number.isInteger(n) || n < 0 || n >= arr.length) throw new NoahLangError(`remove(): index ${stringify(index)} out of range`, 0);
      return arr.slice(0, n).concat(arr.slice(n + 1));
    });
    def('keys', (record) => {
      if (typeof record !== 'object' || record === null || Array.isArray(record)) throw new NoahLangError('keys() expects a record', 0);
      return Object.keys(record);
    });
    def('has', (record, key) => {
      if (typeof record !== 'object' || record === null || Array.isArray(record)) throw new NoahLangError('has() expects a record', 0);
      return String(key) in record;
    });
    def('writeToFile', (filePath, content) => {
      if (typeof filePath !== 'string') throw new NoahLangError('writeToFile: path must be a string', 0);
      fs.writeFileSync(path.resolve(this.currentDir, filePath), String(content ?? ''), 'utf8');
      return null;
    });
    def('readFromFile', (filePath) => {
      if (typeof filePath !== 'string') throw new NoahLangError('readFromFile: path must be a string', 0);
      return fs.readFileSync(path.resolve(this.currentDir, filePath), 'utf8');
    });
    def('openInBrowser', (target) => {
      if (typeof target !== 'string') throw new NoahLangError('openInBrowser: needs a file path or URL', 0);
      const url = /^https?:\/\//.test(target) ? target : 'file://' + path.resolve(this.currentDir, target);
      this._openBrowser(url);
      return null;
    });
    def('bindEvent', (id, fnValue) => {
      if (typeof id !== 'string') throw new NoahLangError('bindEvent: id must be a string', 0);
      if (!fnValue || !fnValue.__noahFunction) throw new NoahLangError('bindEvent: second argument must be a NoahLang function', 0);
      this.eventHandlers.set(id, fnValue.__noahFunction);
      this.output(`[bindEvent] registered id=${JSON.stringify(id)} -> ${fnValue.__noahFunction}`);
      return null;
    });
    def('dispatch', (id) => this.runEventHandler(id));
    def('serve', (port) => {
      const portNumber = Number(port);
      if (!Number.isInteger(portNumber) || portNumber < 1 || portNumber > 65535) throw new NoahLangError('serve: port must be a number between 1 and 65535', 0);
      if (this.httpServer) { this.output(`Already serving at http://localhost:${this.httpServer.address().port}/`); return null; }
      const root = this.currentDir;
      const mime = {
        '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
        '.js': 'application/javascript; charset=utf-8', '.mjs': 'application/javascript; charset=utf-8',
        '.json': 'application/json; charset=utf-8', '.png': 'image/png', '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg', '.gif': 'image/gif', '.svg': 'image/svg+xml',
        '.ico': 'image/x-icon', '.woff': 'font/woff', '.woff2': 'font/woff2', '.ttf': 'font/ttf'
      };
      const server = http.createServer((req, res) => {
        const url = new URL(req.url, 'http://localhost');
        if (url.pathname === '/__reload') {
          res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', 'Connection': 'keep-alive', 'Access-Control-Allow-Origin': '*' });
          this.reloadClients.add(res);
          req.on('close', () => { this.reloadClients.delete(res); });
          return;
        }
        if (url.pathname === '/__event') {
          const id = url.searchParams.get('id') || '';
          try { this.runEventHandler(id); res.writeHead(200, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ ok: true })); }
          catch (err) { res.writeHead(500, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ ok: false, error: err.message })); }
          return;
        }
        let safePath;
        try { safePath = decodeURIComponent(url.pathname); }
        catch { res.writeHead(400); res.end('Bad request'); return; }
        if (safePath === '/') safePath = '/index.html';
        const filePath = path.normalize(path.join(root, safePath));
        if (!filePath.startsWith(root)) { res.writeHead(403); res.end('Forbidden'); return; }
        fs.readFile(filePath, (err, data) => {
          if (err) { res.writeHead(404, { 'Content-Type': 'text/plain' }); res.end('Not found'); return; }
          const ext = path.extname(filePath).toLowerCase();
          let body = data;
          if (ext === '.html') {
            let html = data.toString('utf8');
            if (!html.includes('/__reload')) {
              if (html.includes('</body>')) html = html.replace('</body>', RELOAD_SCRIPT + '</body>');
              else html += RELOAD_SCRIPT;
            }
            body = Buffer.from(html, 'utf8');
          }
          res.writeHead(200, { 'Content-Type': mime[ext] || 'application/octet-stream', 'Cache-Control': 'no-store' });
          res.end(body);
        });
      });
      server.on('error', (err) => {
        if (err.code === 'EADDRINUSE') {
          this.output(`[serve] port ${portNumber} is already in use; trying the next port`);
          const retry = portNumber + 1;
          if (retry <= 65535) { try { server.close(); } catch {} setImmediate(() => this._serveWith(server, retry, root, mime)); }
          else this.output(`[serve] no available port near ${portNumber}`);
        } else this.output(`[serve] error: ${err.message}`);
      });
      server.listen(portNumber, () => {
        this.httpServer = server;
        const url = `http://localhost:${portNumber}/`;
        this.output(`[serve] listening at ${url}  (root: ${root})`);
        this.output('Press Ctrl+C to stop.');
        if (!browserOpenedGlobally) { browserOpenedGlobally = true; this._openBrowser(url); }
      });
      return null;
    });
  }

  _serveWith(server, port, root, mime) {
    server.listen(port, () => {
      this.httpServer = server;
      const url = `http://localhost:${port}/`;
      this.output(`[serve] listening at ${url}  (root: ${root})`);
      this.output('Press Ctrl+C to stop.');
      if (!browserOpenedGlobally) { browserOpenedGlobally = true; this._openBrowser(url); }
    });
  }

  _openBrowser(target) {
    const platform = process.platform;
    let command;
    if (platform === 'win32') command = `start "" "${target}"`;
    else if (platform === 'darwin') command = `open "${target}"`;
    else command = `xdg-open "${target}"`;
    exec(command, (err) => { if (err) console.error(`NoahLang: could not open browser: ${err.message}`); });
  }

  notifyReload() {
    for (const res of this.reloadClients) {
      try { res.write('data: reload\n\n'); } catch { this.reloadClients.delete(res); }
    }
  }

  shutdown() {
    for (const res of this.reloadClients) { try { res.end(); } catch {} }
    this.reloadClients.clear();
    if (this.httpServer) { try { this.httpServer.close(); } catch {} this.httpServer = null; }
  }

  evaluateExpression(expression, env, line) {
    const tokens = tokenizeExpression(expression, line);
    return new ExpressionParser(tokens, this, env, line).parse();
  }

  callFunction(name, args, line, callerEnv = this.globalEnv) {
    if (name === 'receive') {
      if (this.inputQueue.length) {
        const next = this.inputQueue.shift();
        return typeof next === 'string' ? next : String(next ?? '');
      }
      if (this.stdin != null) {
        const idx = this.stdin.indexOf('\n');
        if (idx === -1) { const out = this.stdin; this.stdin = ''; return out.replace(/\r$/, ''); }
        const out = this.stdin.slice(0, idx);
        this.stdin = this.stdin.slice(idx + 1);
        return out.replace(/\r$/, '');
      }
      if (typeof this.readInput === 'function') return this.readInput();
      throw new NoahLangError('receive() needs input; pass `options.stdin`, `options.input`, or set `interpreter.readInput`', line);
    }
    if (name === 'collect') return args.slice();
    if (name === 'fail') throw new NoahLangError(stringify(args[0] ?? 'failed'), line);

    const builtin = this.globalEnv.lookup(name);
    if (builtin && typeof builtin.value === 'function' && !this.functions.has(name)) {
      try { return builtin.value(...args); }
      catch (err) { if (err instanceof NoahLangError) throw err; throw new NoahLangError(err.message, line); }
    }
    const fn = this.functions.get(name);
    if (!fn) throw new NoahLangError(`undefined function '${name}'`, line);
    if (this.callDepth >= this.maxDepth) throw new NoahLangError(`maximum call depth (${this.maxDepth}) exceeded in '${name}'`, line);

    this.callDepth++;
    try {
      for (const clause of fn.clauses) {
        if (clause.params.length !== args.length) continue;
        const localEnv = new Environment(clause.closure);
        let matched = true;
        for (let k = 0; k < clause.params.length; k++) {
          const pattern = clause.patterns[k];
          const value = args[k];
          if (pattern.kind === 'literal') { if (pattern.value !== value) { matched = false; break; } }
          else if (pattern.kind === 'wildcard') { /* bind nothing */ }
          else localEnv.define(pattern.name, value);
        }
        if (!matched) continue;
        const result = this.executeBlock(clause.body, localEnv, clause.baseIndent, { allowNested: true, functionDepth: 1 });
        if (result.signal === RETURN_SIGNAL) return result.value;
        return result.value;
      }
      throw new NoahLangError(`no clause of '${name}' matched ${args.length} argument(s): ` + args.map(stringify).join(', '), line);
    } finally {
      this.callDepth--;
    }
  }

  run(code, options = {}) {
    try {
      const lines = this._parseLines(code);
      this.executeBlock(lines, this.globalEnv, 0, { allowNested: false, functionDepth: 0 });
      return options.safe ? { ok: true, error: null } : undefined;
    } catch (err) {
      if (options.safe) return { ok: false, error: err };
      throw err;
    }
  }

  runString(code, options = {}) { return this.run(code, options); }

  _parseLines(code) {
    return code.split(/\r?\n/).map((raw, index) => {
      const withoutComment = removeComment(raw);
      const text = withoutComment.trim();
      const indentText = raw.match(/^[ \t]*/)[0];
      const indent = indentText.replace(/\t/g, '    ').length;
      return { text, indent, line: index + 1, raw };
    });
  }

  _pull(target, env, line) {
      const os = require('os');
      const noahHome = process.env.NOAHLANG_HOME || path.join(os.homedir(), '.noahlang');
      const candidates = [
          path.resolve(this.currentDir, target),
          path.resolve(noahHome, target),
          path.resolve(noahHome, 'lib', target),
      ];

      let resolved = null;
      for (const c of candidates) {
          if (fs.existsSync(c)) { resolved = c; break; }
      }
      if (!resolved) {
          throw new NoahLangError(
              `cannot pull '${target}': not found in project, ~/.noahlang/, or ~/.noahlang/lib/`,
              line
          );
      }

      if (this.pulledFiles.has(resolved)) return;
      if (this.pullStack.includes(resolved)) {
          throw new NoahLangError(`circular pull of '${target}'`, line);
      }

      this.pullStack.push(resolved);
      this.pulledFiles.add(resolved);
      if (this.onFileRead) { try { this.onFileRead(resolved); } catch {} }

      const previousDir = this.currentDir;
      this.currentDir = path.dirname(resolved);

      try {
          const code = fs.readFileSync(resolved, 'utf8');
          const lines = this._parseLines(code);
          this.executeBlock(lines, env, 0, { allowNested: false, functionDepth: 0 });
      } finally {
          this.currentDir = previousDir;
          this.pullStack.pop();
      }
  }

  _capitalize(name) {
    if (!name) return name;
    return name.charAt(0).toUpperCase() + name.slice(1);
  }

  _callEndFunction(name, line) {
    const candidates = ['end' + this._capitalize(name), name.replace(/Start$/, 'End'), name + 'End'];
    for (const closerName of candidates) {
      const builtin = this.globalEnv.lookup(closerName);
      if (builtin && typeof builtin.value === 'function' && !this.functions.has(closerName)) {
        try { return builtin.value(); }
        catch (err) { if (err instanceof NoahLangError) throw err; throw new NoahLangError(err.message, line); }
      }
      const fn = this.functions.get(closerName);
      if (fn) return this.callFunction(closerName, [], line, this.globalEnv);
    }
    return null;
  }

  _scanBlock(lines, start, baseIndent, closerRegex, description, startLine) {
    let bodyEnd = start + 1;
    while (bodyEnd < lines.length && (!lines[bodyEnd].text || lines[bodyEnd].indent > baseIndent)) bodyEnd++;
    const body = lines.slice(start + 1, bodyEnd).filter(e => e.text);

    let probe = bodyEnd;
    while (probe < lines.length && !lines[probe].text) probe++;
    if (probe >= lines.length) throw new NoahLangError(`${description} (line ${startLine}) was never closed`, startLine);
    const closerItem = lines[probe];
    if (closerItem.indent !== baseIndent) throw new NoahLangError(`${description} (line ${startLine}) must be closed at the same indentation`, closerItem.line, null, closerItem.raw);
    const m = closerItem.text.match(closerRegex);
    if (!m) throw new NoahLangError(`${description} (line ${startLine}) must be followed by a closer, found '${closerItem.text}'`, closerItem.line, null, closerItem.raw);
    if (!body.length) throw new NoahLangError(`${description} (line ${startLine}) must have an indented body`, startLine);
    const bodyIndent = body[0].indent;
    if (body.some(e => e.indent < bodyIndent)) throw new NoahLangError(`invalid indentation in ${description} body`, startLine);
    return { body, bodyIndent, closerIndex: probe, closerMatch: m, closerItem };
  }

  executeBlock(lines, env, baseIndent, ctx) {
    const allowNested = Boolean(ctx && ctx.allowNested);
    const functionDepth = (ctx && ctx.functionDepth) || 0;
    let i = 0;
    let lastValue = null;

    while (i < lines.length) {
      const item = lines[i];
      if (!item.text) { i++; continue; }
      if (item.indent < baseIndent) break;
      if (item.indent > baseIndent && !allowNested) throw new NoahLangError('unexpected indentation', item.line, null, item.raw);
      const statement = item.text;

      if (statement === 'record') {
        const obj = {};
        let j = i + 1;
        while (j < lines.length) {
          const sub = lines[j];
          if (!sub.text) { j++; continue; }
          if (sub.text === 'end record' && sub.indent === item.indent) break;
          const m = sub.text.match(/^([A-Za-z_][A-Za-z0-9_]*)\s*:\s*(.+)$/);
          if (!m) throw new NoahLangError(`invalid record field; expected 'name: value' or 'end record', got '${sub.text}'`, sub.line, null, sub.raw);
          obj[m[1]] = this.evaluateExpression(m[2], env, sub.line);
          j++;
        }
        if (j >= lines.length) throw new NoahLangError('record must be closed with end record', item.line, null, item.raw);
        lastValue = obj;
        i = j + 1;
        continue;
      }

      const forMatch = statement.match(/^for\s+([A-Za-z_][A-Za-z0-9_]*)(?:\s+at\s+([A-Za-z_][A-Za-z0-9_]*))?\s+in\s+(.+)$/);
      if (forMatch) {
        const name = forMatch[1];
        const indexName = forMatch[2] || null;
        const iterExpr = forMatch[3];
        const { body, bodyIndent, closerIndex } = this._scanBlock(lines, i, item.indent, /^end\s+for\s*$/, 'for', item.line);
        const iterable = this.evaluateExpression(iterExpr, env, item.line);
        let items;
        if (Array.isArray(iterable)) items = iterable;
        else if (typeof iterable === 'string') items = iterable.split('');
        else if (iterable instanceof NoahRange) {
          const arr = [];
          for (let n = iterable.start; n < iterable.end; n++) arr.push(n);
          items = arr;
        } else throw new NoahLangError(`for expects a list, string, or range; got ${describeType(iterable)}`, item.line);
        for (let idx = 0; idx < items.length; idx++) {
          const loopEnv = new Environment(env);
          loopEnv.define(name, items[idx]);
          if (indexName) loopEnv.define(indexName, idx);
          const result = this.executeBlock(body, loopEnv, bodyIndent, { allowNested: true, functionDepth });
          if (result.signal === BREAK_SIGNAL) break;
          if (result.signal === CONTINUE_SIGNAL) continue;
          if (result.signal === RETURN_SIGNAL) return { signal: RETURN_SIGNAL, value: result.value };
        }
        i = closerIndex + 1;
        continue;
      }

      if (/^while\s+/.test(statement)) {
        const m = statement.match(/^while\s+(.+)$/);
        if (!m) throw new NoahLangError("invalid while; expected 'while condition'", item.line, null, item.raw);
        const condExpr = m[1];
        const { body, bodyIndent, closerIndex } = this._scanBlock(lines, i, item.indent, /^end\s+while\s*$/, 'while', item.line);
        while (true) {
          const cond = this.evaluateExpression(condExpr, env, item.line);
          if (!cond) break;
          const loopEnv = new Environment(env);
          const result = this.executeBlock(body, loopEnv, bodyIndent, { allowNested: true, functionDepth });
          if (result.signal === BREAK_SIGNAL) break;
          if (result.signal === CONTINUE_SIGNAL) continue;
          if (result.signal === RETURN_SIGNAL) return { signal: RETURN_SIGNAL, value: result.value };
        }
        i = closerIndex + 1;
        continue;
      }

      const repMatch = statement.match(/^repeat\s+(.+?)\s+times(?:\s+as\s+([A-Za-z_][A-Za-z0-9_]*))?$/);
      if (repMatch) {
        const countExpr = repMatch[1];
        const indexName = repMatch[2] || null;
        const { body, bodyIndent, closerIndex } = this._scanBlock(lines, i, item.indent, /^end\s+repeat\s*$/, 'repeat', item.line);
        const count = Number(this.evaluateExpression(countExpr, env, item.line));
        if (!Number.isInteger(count) || count < 0) throw new NoahLangError(`repeat expects a non-negative integer, got ${stringify(countExpr)}`, item.line);
        for (let idx = 0; idx < count; idx++) {
          const loopEnv = new Environment(env);
          if (indexName) loopEnv.define(indexName, idx);
          const result = this.executeBlock(body, loopEnv, bodyIndent, { allowNested: true, functionDepth });
          if (result.signal === BREAK_SIGNAL) break;
          if (result.signal === CONTINUE_SIGNAL) continue;
          if (result.signal === RETURN_SIGNAL) return { signal: RETURN_SIGNAL, value: result.value };
        }
        i = closerIndex + 1;
        continue;
      }

      if (statement === 'attempt') {
        let bodyEnd = i + 1;
        while (bodyEnd < lines.length && (!lines[bodyEnd].text || lines[bodyEnd].indent > item.indent)) bodyEnd++;
        const body = lines.slice(i + 1, bodyEnd).filter(e => e.text);
        if (!body.length) throw new NoahLangError(`attempt must have an indented body`, item.line, null, item.raw);
        const bodyIndent = body[0].indent;
        let probe = bodyEnd;
        while (probe < lines.length && !lines[probe].text) probe++;
        if (probe >= lines.length) throw new NoahLangError(`attempt must be closed with end attempt`, item.line, null, item.raw);
        let recoverVar = null;
        let recoverBody = null;
        let recoverIndent = 0;
        let endProbe = probe;
        const recMatch = lines[probe].text.match(/^recover\s+with\s+([A-Za-z_][A-Za-z0-9_]*)\s*$/);
        if (recMatch) {
          recoverVar = recMatch[1];
          let rEnd = probe + 1;
          while (rEnd < lines.length && (!lines[rEnd].text || lines[rEnd].indent > lines[probe].indent)) rEnd++;
          recoverBody = lines.slice(probe + 1, rEnd).filter(e => e.text);
          if (!recoverBody.length) throw new NoahLangError(`recover with must have an indented body`, lines[probe].line, null, lines[probe].raw);
          recoverIndent = recoverBody[0].indent;
          let p2 = rEnd;
          while (p2 < lines.length && !lines[p2].text) p2++;
          if (p2 >= lines.length || !/^end\s+attempt\s*$/.test(lines[p2].text)) throw new NoahLangError(`attempt must be closed with end attempt`, item.line, null, item.raw);
          endProbe = p2;
        } else if (/^end\s+attempt\s*$/.test(lines[probe].text)) {
          endProbe = probe;
        } else {
          throw new NoahLangError(`attempt must be followed by 'recover with <err>' or 'end attempt'`, lines[probe].line, null, lines[probe].raw);
        }
        try {
          const result = this.executeBlock(body, env, bodyIndent, { allowNested: true, functionDepth });
          if (result.signal === RETURN_SIGNAL) return { signal: RETURN_SIGNAL, value: result.value };
          if (result.signal === BREAK_SIGNAL) return { signal: BREAK_SIGNAL };
          if (result.signal === CONTINUE_SIGNAL) return { signal: CONTINUE_SIGNAL };
        } catch (err) {
          if (!(err instanceof NoahLangError)) throw err;
          if (!recoverBody) throw err;
          const catchEnv = new Environment(env);
          catchEnv.define(recoverVar, err.rawMessage || err.message);
          const result = this.executeBlock(recoverBody, catchEnv, recoverIndent, { allowNested: true, functionDepth });
          if (result.signal === RETURN_SIGNAL) return { signal: RETURN_SIGNAL, value: result.value };
          if (result.signal === BREAK_SIGNAL) return { signal: BREAK_SIGNAL };
          if (result.signal === CONTINUE_SIGNAL) return { signal: CONTINUE_SIGNAL };
        }
        i = endProbe + 1;
        continue;
      }

      const startMatch = statement.match(/^start\s+([A-Za-z_][A-Za-z0-9_]*)\s*(\(.*)$/);
      if (startMatch) {
        const name = startMatch[1];
        const callText = name + startMatch[2];
        const { body, bodyIndent, closerIndex, closerMatch } = this._scanBlock(lines, i, item.indent, /^end\s+([A-Za-z_][A-Za-z0-9_]*)\s*$/, 'start ' + name, item.line);
        if (closerMatch[1] !== name) throw new NoahLangError(`end ${closerMatch[1]} but expected end ${name} (started at line ${item.line})`, lines[closerIndex].line, null, lines[closerIndex].raw);
        this.evaluateExpression(callText, env, item.line);
        const result = this.executeBlock(body, env, bodyIndent, { allowNested: true, functionDepth });
        this._callEndFunction(name, item.line);
        if (result.signal === RETURN_SIGNAL) return { signal: RETURN_SIGNAL, value: result.value };
        if (result.signal === BREAK_SIGNAL) return { signal: BREAK_SIGNAL };
        if (result.signal === CONTINUE_SIGNAL) return { signal: CONTINUE_SIGNAL };
        i = closerIndex + 1;
        continue;
      }

      if (/^if\s+/.test(statement)) {
        const chain = this.parseConditionalChain(lines, i, env, functionDepth);
        i = chain.nextIndex;
        if (chain.signal === RETURN_SIGNAL) return { signal: RETURN_SIGNAL, value: chain.value };
        if (chain.signal === BREAK_SIGNAL) return { signal: BREAK_SIGNAL };
        if (chain.signal === CONTINUE_SIGNAL) return { signal: CONTINUE_SIGNAL };
        if (chain.result !== undefined) lastValue = chain.result;
        continue;
      }
      if (/^else\s*:/.test(statement) || /^else\s+if\s+/.test(statement) || statement === 'else') {
        throw new NoahLangError("'else' must immediately follow an 'if' block", item.line, null, item.raw);
      }

      if (/^define\s+/.test(statement)) {
        const match = statement.match(/^define\s+([A-Za-z_][A-Za-z0-9_]*)\s*\(([^)]*)\)\s*$/);
        if (!match) throw new NoahLangError("invalid function definition; expected 'define name(parameters)'", item.line, null, item.raw);
        const name = match[1];
        const paramSrc = match[2].trim();
        const rawParams = paramSrc ? paramSrc.split(',').map(p => p.trim()) : [];
        const patterns = rawParams.map(p => parsePattern(p, item.line));
        const { body, bodyIndent, closerIndex } = this._scanBlock(lines, i, item.indent, /^end\s+define\s*$/, 'define ' + name, item.line);
        const clause = { params: rawParams, patterns, body, baseIndent: bodyIndent, line: item.line, closure: env };
        if (this.functions.has(name)) {
          const existing = this.functions.get(name);
          const dupKey = patterns.map(p => p.kind === 'literal' ? `lit:${stringify(p.value)}` : p.kind === 'wildcard' ? 'any' : 'var').join('|');
          const existingKeys = new Set(existing.clauses.map(c => c.patterns.map(p => p.kind === 'literal' ? `lit:${stringify(p.value)}` : p.kind === 'wildcard' ? 'any' : 'var').join('|')));
          if (existingKeys.has(dupKey)) throw new NoahLangError(`duplicate clause for '${name}'`, item.line, null, item.raw);
          existing.clauses.push(clause);
        } else {
          this.functions.set(name, { clauses: [clause] });
          env.define(name, { __noahFunction: name });
        }
        i = closerIndex + 1;
        continue;
      }

      if (/^pull\s+/.test(statement)) {
        const match = statement.match(/^pull\s+(["'])(.+?)\1\s*$/);
        if (!match) throw new NoahLangError('invalid pull; expected pull "file.noah"', item.line, null, item.raw);
        this._pull(match[2], env, item.line);
        i++; continue;
      }

      if (statement === 'break') return { signal: BREAK_SIGNAL };
      if (statement === 'continue') return { signal: CONTINUE_SIGNAL };

      if (statement.startsWith('let ')) {
          const match = statement.match(/^let\s+([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.+)$/);
          if (!match) throw new NoahLangError("invalid variable declaration; expected 'let name = expression'", item.line, null, item.raw);
          const name = match[1];
          if (env.hasOwn(name)) throw new NoahLangError(`variable '${name}' is already declared in this scope; use 'set ${name} = ...' to reassign`, item.line, null, item.raw);

          // NEW: RHS is `record` — parse a record block
          if (match[2].trim() === 'record') {
              const obj = {};
              let j = i + 1;
              while (j < lines.length) {
                  const sub = lines[j];
                  if (!sub.text) { j++; continue; }
                  if (sub.text === 'end record' && sub.indent === item.indent) break;
                  const m = sub.text.match(/^([A-Za-z_][A-Za-z0-9_]*)\s*:\s*(.+)$/);
                  if (!m) throw new NoahLangError(`invalid record field; expected 'name: value' or 'end record', got '${sub.text}'`, sub.line, null, sub.raw);
                  obj[m[1]] = this.evaluateExpression(m[2], env, sub.line);
                  j++;
              }
              if (j >= lines.length) throw new NoahLangError('record must be closed with end record', item.line, null, item.raw);
              env.define(name, obj);
              i = j + 1;
              continue;
          }

          env.define(name, this.evaluateExpression(match[2], env, item.line));
          i++; continue;
}
      if (statement.startsWith('set ')) {
        const match = statement.match(/^set\s+([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.+)$/);
        if (!match) throw new NoahLangError("invalid assignment; expected 'set name = expression'", item.line, null, item.raw);
        const name = match[1];
        if (!env.has(name)) throw new NoahLangError(`cannot reassign undefined variable '${name}'; declare it first using 'let ${name} = ...'`, item.line, null, item.raw);
        const value = this.evaluateExpression(match[2], env, item.line);
        env.assign(name, value);
        i++; continue;
      }
      if (/^fail\s+with\s+/.test(statement)) {
        const expr = statement.replace(/^fail\s+with\s+/, '');
        const msg = this.evaluateExpression(expr, env, item.line);
        throw new NoahLangError(stringify(msg), item.line, null, item.raw);
      }
      if (/^write\s+/.test(statement)) {
        const expr = statement.replace(/^write\s+/, '');
        this.output(stringify(this.evaluateExpression(expr, env, item.line)));
        i++; continue;
      }
      if (/^return(?:\s|$)/.test(statement)) {
        if (functionDepth <= 0) throw new NoahLangError("'return' can only be used inside a function", item.line, null, item.raw);
        const expr = statement.replace(/^return\s*/, '');
        const value = expr ? this.evaluateExpression(expr, env, item.line) : null;
        return { signal: RETURN_SIGNAL, value };
      }
      if (/^[A-Za-z_][A-Za-z0-9_]*\s*[\(\[]/.test(statement) ||
          /^[\("'\-+\d]/.test(statement) ||
          /^true\b|^false\b|^null\b/.test(statement) ||
          /^\[/.test(statement)) {
        lastValue = this.evaluateExpression(statement, env, item.line);
        i++; continue;
      }
      throw new NoahLangError(`unrecognized statement '${statement}'`, item.line, null, item.raw);
    }

    return { signal: undefined, value: lastValue };
  }

  parseConditionalChain(lines, start, env, functionDepth) {
    const branches = [];
    const baseIndent = lines[start].indent;
    let i = start;
    let first = true;
    let closerIndex = -1;

    while (i < lines.length) {
      const item = lines[i];
      let kind = null;
      if (first) {
        if (/^if\s+/.test(item.text)) kind = 'if';
        else break;
      } else {
        if (/^else\s+if\s+/.test(item.text)) kind = 'else-if';
        else if (item.text === 'else') kind = 'else';
        else break;
      }
      if (item.indent !== baseIndent) break;
      let conditionExpr = null;
      if (kind === 'if') {
        const m = item.text.match(/^if\s+(.+)$/);
        if (!m) throw new NoahLangError("invalid conditional; expected 'if condition'", item.line, null, item.raw);
        conditionExpr = m[1];
      } else if (kind === 'else-if') {
        const m = item.text.match(/^else\s+if\s+(.+)$/);
        if (!m) throw new NoahLangError("invalid conditional; expected 'else if condition'", item.line, null, item.raw);
        conditionExpr = m[1];
      }
      let bodyEnd = i + 1;
      while (bodyEnd < lines.length && (!lines[bodyEnd].text || lines[bodyEnd].indent > item.indent)) bodyEnd++;
      const body = lines.slice(i + 1, bodyEnd).filter(e => e.text);
      if (!body.length) throw new NoahLangError(`'${kind === 'else' ? 'else' : 'if'}' must have an indented body`, item.line, null, item.raw);
      const bodyIndent = body[0].indent;
      if (body.some(e => e.indent < bodyIndent)) throw new NoahLangError('invalid conditional indentation', item.line, null, item.raw);
      branches.push({ kind, conditionExpr, body, bodyIndent, line: item.line });
      i = bodyEnd;
      first = false;

      let probe = i;
      while (probe < lines.length && !lines[probe].text) probe++;
      if (probe >= lines.length) { i = probe; break; }
      const nextItem = lines[probe];
      if (nextItem.indent !== baseIndent) { i = probe; break; }
      if (/^else\s+if\s+/.test(nextItem.text) || nextItem.text === 'else') { i = probe; continue; }
      if (/^end\s+if\s*$/.test(nextItem.text)) { closerIndex = probe; i = probe + 1; break; }
      i = probe; break;
    }

    if (closerIndex === -1) throw new NoahLangError(`if (line ${start + 1}) must be closed with end if`, start + 1);

    for (const branch of branches) {
      let chosen = (branch.kind === 'else');
      if (!chosen) {
        const cond = this.evaluateExpression(branch.conditionExpr, env, branch.line);
        chosen = Boolean(cond);
      }
      if (chosen) {
        const branchEnv = new Environment(env);
        const result = this.executeBlock(branch.body, branchEnv, branch.bodyIndent, { allowNested: true, functionDepth });
        if (result.signal === RETURN_SIGNAL) return { nextIndex: closerIndex + 1, signal: RETURN_SIGNAL, value: result.value };
        if (result.signal === BREAK_SIGNAL || result.signal === CONTINUE_SIGNAL) return { nextIndex: closerIndex + 1, signal: result.signal };
        return { nextIndex: closerIndex + 1, result: result.value };
      }
    }
    return { nextIndex: closerIndex + 1, result: undefined };
  }
}

// ---------------------------------------------
// PATTERN PARSING / HELPERS
// ---------------------------------------------
function parsePattern(src, line) {
  if (src === '_') return { kind: 'wildcard' };
  if (/^[A-Za-z_][A-Za-z0-9_]*$/.test(src)) return { kind: 'var', name: src };
  if (/^-?\d+(?:\.\d+)?$/.test(src)) return { kind: 'literal', value: Number(src) };
  if (/^"(?:[^"\\]|\\.)*"$/.test(src) || /^'(?:[^'\\]|\\.)*'$/.test(src)) {
    const toks = tokenizeExpression(src, line);
    if (toks.length === 1 && toks[0].type === 'string') {
      const parts = toks[0].parts;
      if (parts.length === 1 && parts[0].type === 'text') return { kind: 'literal', value: parts[0].value };
    }
    throw new NoahLangError('patterns cannot use string interpolation', line);
  }
  if (src === 'true') return { kind: 'literal', value: true };
  if (src === 'false') return { kind: 'literal', value: false };
  if (src === 'null') return { kind: 'literal', value: null };
  throw new NoahLangError(`invalid parameter pattern '${src}'`, line);
}

function stringify(value) {
  if (value === null || value === undefined) return 'null';
  if (Array.isArray(value)) return '[' + value.map(stringify).join(', ') + ']';
  if (value instanceof NoahRange) return value.start + '..' + value.end;
  if (typeof value === 'object') {
    const parts = Object.keys(value).map(k => k + ': ' + stringify(value[k]));
    return '{' + parts.join(', ') + '}';
  }
  return String(value);
}

// ---------------------------------------------
// CLI
// ---------------------------------------------
if (require.main === module) {
  const args = process.argv.slice(2);
  if (args.includes('--version') || args.includes('-v')) { console.log('NoahLang 2.0.2'); process.exit(0); }
  if (args.includes('--help') || args.includes('-h')) {
    console.log('NoahLang 2.0.1');
    console.log('Usage: noah [--watch] <file.noah>');
    console.log('');
    console.log('Statements:');
    console.log('  for x in list ... end for');
    console.log('  for x at i in list ... end for');
    console.log('  for i in 0..10 ... end for');
    console.log('  while cond ... end while');
    console.log('  repeat N times ... end repeat');
    console.log('  repeat N times as i ... end repeat');
    console.log('  if cond ... else if cond ... else ... end if');
    console.log('  define name(args) ... end define');
    console.log('  attempt ... recover with err ... end attempt');
    console.log('  fail with "message"');
    console.log('  record ... field: value ... end record');
    console.log('  start name(...) ... end name');
    console.log('');
    console.log('Lists: [1, 2, 3], ["a", "b"], []');
    console.log('Ranges: 0..10 (exclusive end)');
    console.log('Access: record.field, record["field"], list[i]');
    console.log('');
    console.log('  --watch   Re-run on file changes (with browser auto-reload)');
    process.exit(0);
  }

  const watch = args.includes('--watch');
  let file = null;
  let endOfFlags = false;
  for (const arg of args) {
    if (!endOfFlags && arg === '--') { endOfFlags = true; continue; }
    if (!endOfFlags && arg.startsWith('-')) continue;
    file = arg; break;
  }
  if (!file) { console.log('NoahLang 2.0.1'); console.log('Usage: noah [--watch] <file.noah>'); process.exit(1); }
  if (!fs.existsSync(file)) { console.error(`NoahLang error: file not found: ${file}`); process.exit(1); }

  const filePath = path.resolve(file);
  const baseDir = path.dirname(filePath);
  const state = { interpreter: null, watched: new Set(), dirWatchers: new Map(), reloadTimer: null };

  let stdinText = null;
  if (!process.stdin.isTTY) { try { stdinText = fs.readFileSync(0, 'utf8'); } catch { stdinText = null; } }

  function makeReadInput() {
    return () => {
      const buf = Buffer.alloc(1);
      let line = '';
      while (true) {
        let n;
        try { n = fs.readSync(0, buf, 0, 1, null); }
        catch (err) {
          if (err.code === 'EAGAIN') throw new NoahLangError('receive() could not read input (try piping input)', 0);
          throw err;
        }
        if (n === 0) break;
        const ch = buf.toString('utf8');
        if (ch === '\n') break;
        if (ch === '\r') continue;
        line += ch;
      }
      return line;
    };
  }

  function watchFile(p) {
    if (state.watched.has(p)) return;
    state.watched.add(p);
    const dir = path.dirname(p);
    if (state.dirWatchers.has(dir)) return;
    try {
      const w = fs.watch(dir, { persistent: true }, (eventType, filename) => {
        if (!filename) return;
        const full = path.join(dir, filename);
        if (!state.watched.has(full)) return;
        scheduleReload(full);
      });
      state.dirWatchers.set(dir, w);
    } catch (err) { console.error(`[watch] could not watch directory ${dir}: ${err.message}`); }
  }

  function scheduleReload(changedPath) {
    if (state.reloadTimer) clearTimeout(state.reloadTimer);
    state.reloadTimer = setTimeout(() => {
      console.log(`[watch] ${path.basename(changedPath)} changed — reloading`);
      doReload();
    }, 120);
  }

  function closeAllWatchers() {
    for (const w of state.dirWatchers.values()) { try { w.close(); } catch {} }
    state.dirWatchers.clear();
    state.watched.clear();
  }

  function doReload() {
    const old = state.interpreter;
    if (old) { try { old.notifyReload(); } catch {} }
    setTimeout(() => { runOnce(true); }, 150);
  }

  function runOnce(isReload) {
    if (state.interpreter) state.interpreter.shutdown();
    if (isReload) closeAllWatchers();

    const interpreter = new Interpreter({
      stdin: stdinText,
      baseDir,
      onFileRead: (p) => { if (watch) watchFile(p); }
    });
    if (!stdinText) interpreter.readInput = makeReadInput();
    state.interpreter = interpreter;
    if (watch) watchFile(filePath);

    try {
      const code = fs.readFileSync(filePath, 'utf8');
      interpreter.run(code);
    } catch (error) {
      if (error instanceof NoahLangError) {
        console.error(`NoahLang error: ${error.message}`);
        if (error.sourceLine) {
          const line = error.sourceLine;
          console.error(`  > ${line.trim()}`);
          if (error.column != null) {
            const pad = ' '.repeat(Math.max(0, error.column - 1 + (line.length - line.trimStart().length)));
            console.error(`    ${pad}^`);
          }
        }
      } else console.error(`NoahLang error: ${error.message}`);
      if (!watch) process.exitCode = 1;
    }
  }

  runOnce(false);
  if (watch) console.log(`[watch] watching ${file} (Ctrl+C to stop)`);
}

module.exports = {
  Interpreter,
  NoahLangError,
  Environment,
  removeComment,
  tokenizeExpression,
  stringify
};