// Node test harness for the quantified-logic widget's core logic.
// Loads script.js up to the DOM layer via vm, then exercises parser, rules, and α-equivalence.
// Run: node test-logic.js

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const scriptPath = path.join(__dirname, 'script.js');
const scriptText = fs.readFileSync(scriptPath, 'utf8');

// script.js is now wrapped in an IIFE with a "PER-INSTANCE MOUNT" section
// after all the pure logic. We slice at that boundary and append a return
// statement that closes the existing IIFE — so vm.runInNewContext evaluates
// the original IIFE expression and the return value is the symbol bag.
const cutHeader = 'PER-INSTANCE MOUNT';
const cutIdx = scriptText.indexOf(cutHeader);
if (cutIdx < 0) throw new Error('PER-INSTANCE MOUNT marker not found in script.js');
let sliceEnd = scriptText.lastIndexOf('/* ====', cutIdx);
if (sliceEnd < 0) sliceEnd = cutIdx;
const logicOnly = scriptText.slice(0, sliceEnd);

const wrapped = `${logicOnly}
  return {
    parse, tokenize, renderStatic, renderNode,
    clone, freeVars, alphaRename, astEqual,
    assignIds, findById, replaceById,
    RULES, RULE_FAMILIES, MOVEMENT_RULES, BINOPS, QSYM
  };
}())`;

// renderNode and renderStatic touch document.createElement; stub it for vm.
const sandbox = {
  document: {
    createElement: () => ({
      className: '', dataset: {}, classList: { add() {}, remove() {} },
      append() {}, appendChild() {}, set textContent(v) {}, get textContent() { return ''; }
    }),
    createTextNode: () => ({})
  }
};
const exported = vm.runInNewContext(wrapped, sandbox);

const {
  parse, tokenize, renderStatic, renderNode,
  clone, freeVars, alphaRename, astEqual,
  assignIds, findById, replaceById,
  RULES, RULE_FAMILIES, MOVEMENT_RULES
} = exported;

let passed = 0, failed = 0;
function check(name, cond, extra) {
  if (cond) { passed++; console.log(`  ✓ ${name}`); }
  else { failed++; console.log(`  ✗ ${name}${extra ? ' — ' + extra : ''}`); }
}

function section(title) { console.log(`\n== ${title} ==`); }

// ----- Parser basics -----
section('Parser: propositional core (backward compat)');
check('parses P', astEqual(parse('P'), { type: 'pred', name: 'P', args: [] }));
check('parses ¬P', astEqual(parse('¬P'), { type: 'not', arg: { type: 'pred', name: 'P', args: [] } }));
check('parses P ∧ Q', astEqual(parse('P ∧ Q'), {
  type: 'and',
  left: { type: 'pred', name: 'P', args: [] },
  right: { type: 'pred', name: 'Q', args: [] }
}));
check('parses P → Q ≡ imp(P,Q)', astEqual(parse('P → Q'), {
  type: 'imp',
  left: { type: 'pred', name: 'P', args: [] },
  right: { type: 'pred', name: 'Q', args: [] }
}));

// ----- Parser: predicates -----
section('Parser: predicate application');
check('parses P(x)', astEqual(parse('P(x)'), { type: 'pred', name: 'P', args: ['x'] }));
check('parses L(x, y)', astEqual(parse('L(x, y)'), { type: 'pred', name: 'L', args: ['x', 'y'] }));
check('parses Loves(Bartholomew, x)', astEqual(parse('Loves(Bartholomew, x)'), {
  type: 'pred', name: 'Loves', args: ['Bartholomew', 'x']
}));

// ----- Parser: quantifiers -----
section('Parser: quantifiers');
check('parses ∀x.P(x)', astEqual(parse('∀x.P(x)'), {
  type: 'forall', var: 'x',
  body: { type: 'pred', name: 'P', args: ['x'] }
}));
check('parses ∀x P(x) (no dot)', astEqual(parse('∀x P(x)'), parse('∀x.P(x)')));
check('parses forall x. P(x) (ASCII)', astEqual(parse('forall x. P(x)'), parse('∀x.P(x)')));
check('parses ∃x.∃y.L(x,y)', astEqual(parse('∃x.∃y.L(x,y)'), {
  type: 'exists', var: 'x',
  body: {
    type: 'exists', var: 'y',
    body: { type: 'pred', name: 'L', args: ['x', 'y'] }
  }
}));
check('max-scope: ∀x.P ∧ Q parses as ∀x.(P ∧ Q)', astEqual(parse('∀x.P(x) ∧ Q(x)'),
  { type: 'forall', var: 'x', body: {
    type: 'and',
    left: { type: 'pred', name: 'P', args: ['x'] },
    right: { type: 'pred', name: 'Q', args: ['x'] }
  }}));
check('parenthesized: (∀x.P) ∧ Q', astEqual(parse('(∀x.P(x)) ∧ Q'), {
  type: 'and',
  left: { type: 'forall', var: 'x', body: { type: 'pred', name: 'P', args: ['x'] } },
  right: { type: 'pred', name: 'Q', args: [] }
}));
check('¬∀x.P parses as ¬(∀x.P)', astEqual(parse('¬∀x.P(x)'), {
  type: 'not', arg: { type: 'forall', var: 'x', body: { type: 'pred', name: 'P', args: ['x'] } }
}));

// ----- Render round-trip -----
section('Render: round-trip through parser');
function roundTripsCleanly(src) {
  const ast = parse(src);
  const rendered = renderStatic(ast);
  const ast2 = parse(rendered);
  return astEqual(ast, ast2);
}
check('∀x.P(x) round-trips', roundTripsCleanly('∀x.P(x)'));
check('(∀x.P) ∧ Q round-trips', roundTripsCleanly('(∀x.P(x)) ∧ Q'));
check('¬∀x.(P → Q) round-trips', roundTripsCleanly('¬∀x.(P(x) → Q(x))'));
check('∀x.∃y.L(x,y) round-trips', roundTripsCleanly('∀x.∃y.L(x,y)'));
check('nested ¬¬∀x.P round-trips', roundTripsCleanly('¬¬∀x.P(x)'));

// ----- freeVars -----
section('freeVars');
check('∀x.P(x) has no free vars', freeVars(parse('∀x.P(x)')).size === 0);
check('∀x.P(x,y) has {y} free', (() => {
  const fv = freeVars(parse('∀x.P(x,y)'));
  return fv.size === 1 && fv.has('y');
})());
check('P(x,y) has {x,y} free', (() => {
  const fv = freeVars(parse('P(x,y)'));
  return fv.size === 2 && fv.has('x') && fv.has('y');
})());
check('∀x.∀y.L(x,y,z) has {z} free', (() => {
  const fv = freeVars(parse('∀x.∀y.L(x,y,z)'));
  return fv.size === 1 && fv.has('z');
})());

// ----- α-equivalence -----
section('astEqual: α-equivalence');
check('∀x.P(x) ≡ ∀y.P(y)', astEqual(parse('∀x.P(x)'), parse('∀y.P(y)')));
check('∀x.∃y.L(x,y) ≡ ∀a.∃b.L(a,b)', astEqual(parse('∀x.∃y.L(x,y)'), parse('∀a.∃b.L(a,b)')));
check('∀x.P(x,z) ≡ ∀y.P(y,z) (shared free z)', astEqual(parse('∀x.P(x,z)'), parse('∀y.P(y,z)')));
check('∀x.P(x,z) ≢ ∀y.P(y,w) (different free vars)', !astEqual(parse('∀x.P(x,z)'), parse('∀y.P(y,w)')));
check('∀x.∀y.L(x,y) ≢ ∀x.∀y.L(y,x) (different structure)',
  !astEqual(parse('∀x.∀y.L(x,y)'), parse('∀x.∀y.L(y,x)')));
check('shadowing: ∀y.∀y.P(y) ≡ ∀a.∀y.P(y)', astEqual(parse('∀y.∀y.P(y)'), parse('∀a.∀y.P(y)')));

// ----- alphaRename -----
section('alphaRename');
{
  const q = parse('∀x.P(x,y)');
  const renamed = { type: q.type, var: 'z', body: alphaRename(q.body, 'x', 'z') };
  check('∀x.P(x,y) renamed to ∀z.P(z,y)', astEqual(renamed, parse('∀z.P(z,y)')));
}
{
  // Inner shadow: ∀x.∀x.P(x) — renaming outer x to z leaves inner alone
  const q = parse('∀x.∀x.P(x)');
  const renamed = { type: q.type, var: 'z', body: alphaRename(q.body, 'x', 'z') };
  check('∀x.∀x.P(x) outer renamed to z: inner binding preserved',
    astEqual(renamed, parse('∀z.∀x.P(x)')));
}

// ----- Rule matching & apply -----
section('Rules: individual apply + astEqual');

function findRule(id) { return RULES.find(r => r.id === id); }

// Quantifier negation
{
  const n = parse('¬∀x.P(x)');
  const r = findRule('neg-forall');
  check('neg-forall matches ¬∀x.P(x)', r.match(n));
  const out = r.apply(n);
  check('neg-forall yields ∃x.¬P(x)', astEqual(out, parse('∃x.¬P(x)')));
}
{
  const n = parse('¬∃x.P(x)');
  const r = findRule('neg-exists');
  check('neg-exists matches ¬∃x.P(x)', r.match(n));
  check('neg-exists yields ∀x.¬P(x)', astEqual(r.apply(n), parse('∀x.¬P(x)')));
}

// Quantifier movement: pull out (from left)
{
  const n = parse('(∀x.P(x)) ∧ Q');
  const r = findRule('pull-forall-and-left');
  check('pull-forall-and-left matches (∀x.P(x)) ∧ Q', r.match(n));
  check('pull-forall-and-left yields ∀x.(P(x) ∧ Q)',
    astEqual(r.apply(n), parse('∀x.(P(x) ∧ Q)')));
}
// Capture check: should NOT match when x free in Q
{
  const n = parse('(∀x.P(x)) ∧ Q(x)');  // x free in Q(x)
  const r = findRule('pull-forall-and-left');
  check('pull-forall-and-left blocks when x free in Q', !r.match(n));
}
// Pull out from right
{
  const n = parse('Q ∧ (∀x.P(x))');
  const r = findRule('pull-forall-and-right');
  check('pull-forall-and-right matches Q ∧ (∀x.P(x))', r.match(n));
  check('pull-forall-and-right yields ∀x.(Q ∧ P(x))',
    astEqual(r.apply(n), parse('∀x.(Q ∧ P(x))')));
}
// Push in
{
  const n = parse('∀x.(P(x) ∧ Q)'); // Q has no x free
  const r = findRule('push-forall-and-left');
  check('push-forall-and-left matches ∀x.(P(x) ∧ Q)', r.match(n));
  check('push-forall-and-left yields (∀x.P(x)) ∧ Q',
    astEqual(r.apply(n), parse('(∀x.P(x)) ∧ Q')));
}
// Quantifier commutation
{
  const n = parse('∀x.∀y.L(x,y)');
  const r = findRule('comm-forall');
  check('comm-forall matches ∀x.∀y.L(x,y)', r.match(n));
  check('comm-forall yields ∀y.∀x.L(x,y)',
    astEqual(r.apply(n), parse('∀y.∀x.L(x,y)')));
  // α-equivalent to the original: should be true
  check('∀x.∀y.L(x,y) α-equiv ∀y.∀x.L(x,y)? — NO (different structure)',
    !astEqual(parse('∀x.∀y.L(x,y)'), parse('∀y.∀x.L(x,y)')));
}
// α-rename
{
  const n = parse('∀x.P(x,y)');
  const r = findRule('alpha-rename');
  check('alpha-rename matches quantifier', r.match(n));
  check('alpha-rename validates legal ident', r.validateInput('z', n) === null);
  check('alpha-rename rejects capturing ident y',
    r.validateInput('y', n) !== null);
  const out = r.apply(n, 'z');
  check('alpha-rename x→z yields ∀z.P(z,y)',
    astEqual(out, parse('∀z.P(z,y)')));
}

// ----- End-to-end derivations -----
section('End-to-end derivations');

function deriveAndCheck(label, start, target, steps) {
  // steps is an array of { ruleId, path?, input? } — each step applies at the top if path omitted
  let ast = parse(start);
  assignIds(ast);
  for (const step of steps) {
    const sel = step.path ? findAtPath(ast, step.path) : ast;
    const r = findRule(step.ruleId);
    if (!r) { check(`${label}: rule ${step.ruleId} not found`, false); return; }
    if (!r.match(sel)) { check(`${label}: step ${step.ruleId} does not match`, false); return; }
    const replacement = r.apply(sel, step.input);
    ast = replaceById(ast, sel.id, replacement);
    assignIds(ast);
  }
  const reached = astEqual(ast, parse(target));
  check(`${label}: reaches target`, reached,
    reached ? undefined : `got ${renderStatic(ast)}, want ${target}`);
}

// Walk the tree along a path of child-names.
function findAtPath(node, path) {
  let cur = node;
  for (const step of path) cur = cur[step];
  return cur;
}

// Shakespeare: ¬∀x.(Glitters(x) → Gold(x)) → ∃x.(Glitters(x) ∧ ¬Gold(x))
deriveAndCheck(
  'Shakespeare: ¬∀(→) → ∃(∧¬)',
  '¬∀x.(Glitters(x) → Gold(x))',
  '∃x.(Glitters(x) ∧ ¬Gold(x))',
  [
    // 1. ¬∀x.(...) → ∃x.¬(...) at root (neg-forall)
    { ruleId: 'neg-forall' },
    // After: ∃x.¬(Glitters(x) → Gold(x))
    // 2. eliminate implication inside: select ¬(... → ...)'s inner imp
    // Actually need to eliminate → first to get ¬(¬G ∨ Gold). Let's look at structure.
    // Current: exists(x, not(imp(Glitters(x), Gold(x))))
    // Apply impl-elim on the imp node at path body.arg
    { ruleId: 'impl-elim', path: ['body', 'arg'] },
    // After: exists(x, not(or(not(Glitters(x)), Gold(x))))
    // 3. De Morgan on the ¬(A ∨ B): path body
    { ruleId: 'demorgan-or', path: ['body'] },
    // After: exists(x, and(not(not(Glitters(x))), not(Gold(x))))
    // 4. Double-negation elim on left conjunct: path body.left
    { ruleId: 'dn-elim', path: ['body', 'left'] },
    // After: exists(x, and(Glitters(x), not(Gold(x)))) — target!
  ]
);

// Simple prenex: (∀x.P(x)) ∧ Q → ∀x.(P(x) ∧ Q)
deriveAndCheck(
  'pull ∀ out of ∧ (x not free in Q)',
  '(∀x.P(x)) ∧ Q',
  '∀x.(P(x) ∧ Q)',
  [{ ruleId: 'pull-forall-and-left' }]
);

// α-rename + commute then back
deriveAndCheck(
  'α-rename to avoid shadow and commute',
  '∀x.∀y.L(x,y)',
  '∀y.∀x.L(x,y)',
  [{ ruleId: 'comm-forall' }]
);

// Larger: negate & prenex
// ¬(∀x.P(x)) ∧ (∃y.Q(y))   →   ∃x.∃y.(¬P(x) ∧ Q(y))
deriveAndCheck(
  'negate ∀ + move ∃ out of ∧ + nest',
  '(¬∀x.P(x)) ∧ (∃y.Q(y))',
  '∃x.∃y.(¬P(x) ∧ Q(y))',
  [
    // 1. neg-forall at left conjunct: (¬∀x.P(x)) → (∃x.¬P(x))
    { ruleId: 'neg-forall', path: ['left'] },
    // Now: (∃x.¬P(x)) ∧ (∃y.Q(y))
    // 2. pull ∃x out of ∧ from left → ∃x.(¬P(x) ∧ (∃y.Q(y)))
    { ruleId: 'pull-exists-and-left' },
    // 3. pull ∃y out of ∧ from right, on the inner: body is ¬P(x) ∧ ∃y.Q(y)
    { ruleId: 'pull-exists-and-right', path: ['body'] },
    // → ∃x.∃y.(¬P(x) ∧ Q(y))
  ]
);

// ----- Summary -----
console.log(`\nPassed ${passed}, failed ${failed}`);
process.exit(failed === 0 ? 0 : 1);
