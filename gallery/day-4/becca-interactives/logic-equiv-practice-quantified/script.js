/* ==========================================================
   Quantificational Logic Equivalence Practice — embeddable widget
   ==========================================================
   Each instance is a <div class="logic-equiv-quantified-widget"> with a
   `data-problem` attribute holding JSON config:

     <div class="logic-equiv-quantified-widget"
          data-problem='{"start": "¬∀x. P(x)", "target": "∃x. ¬P(x)"}'>
     </div>

   Multiple instances can coexist on one page; each mounts independently
   with isolated state. The script is safe to load multiple times.

   Syntax:
     Propositional connectives:
       ¬  !  ~               NOT
       ∧  &  /\              AND
       ∨  |  \/              OR
       →  ->                 IMPLIES
       ( )                   grouping
     Quantifiers:
       ∀x. body   or   forall x. body    universal, max-scope
       ∃x. body   or   exists x. body    existential, max-scope
       The dot is optional. Use parentheses to limit scope: (∀x.P(x)) ∧ Q.
     Predicates (atoms):
       Zero-arg:    P, Q, R        (same as a propositional variable)
       With args:   P(x), L(x,y)
   ========================================================== */

(function () {

  const DEFAULT_PROBLEM = {
    start:  "¬∀x. Glitters(x) → Gold(x)",
    target: "∃x. Glitters(x) ∧ ¬Gold(x)"
  };

  /* ==========================================================
     AST TYPES
     ========================================================== */
  // Node forms:
  //   { type: "pred",   name: "P",  args: [strNames...] }   (zero-arg = proposition)
  //   { type: "not",    arg: Node }
  //   { type: "and",    left: Node, right: Node }
  //   { type: "or",     left: Node, right: Node }
  //   { type: "imp",    left: Node, right: Node }
  //   { type: "forall", var: "x",   body: Node }
  //   { type: "exists", var: "x",   body: Node }

  const BINOPS = { and: "∧", or: "∨", imp: "→" };
  const QSYM   = { forall: "∀", exists: "∃" };

  /* ==========================================================
     PARSER
     ========================================================== */

  function tokenize(src) {
    const tokens = [];
    let i = 0;
    const n = src.length;
    while (i < n) {
      const c = src[i];
      if (/\s/.test(c)) { i++; continue; }
      if (c === "(" || c === ")") { tokens.push({ t: c }); i++; continue; }
      if (c === ",") { tokens.push({ t: "comma" }); i++; continue; }
      if (c === ".") { tokens.push({ t: "dot" }); i++; continue; }
      if (c === "¬" || c === "!" || c === "~") { tokens.push({ t: "not" }); i++; continue; }
      if (c === "∀") { tokens.push({ t: "forall" }); i++; continue; }
      if (c === "∃") { tokens.push({ t: "exists" }); i++; continue; }
      if (c === "∧") { tokens.push({ t: "and" }); i++; continue; }
      if (c === "&") {
        if (src[i+1] === "&") { tokens.push({ t: "and" }); i += 2; }
        else { tokens.push({ t: "and" }); i++; }
        continue;
      }
      if (c === "/" && src[i+1] === "\\") { tokens.push({ t: "and" }); i += 2; continue; }
      if (c === "∨") { tokens.push({ t: "or" }); i++; continue; }
      if (c === "|") {
        if (src[i+1] === "|") { tokens.push({ t: "or" }); i += 2; }
        else { tokens.push({ t: "or" }); i++; }
        continue;
      }
      if (c === "\\") {
        if (src.startsWith("\\forall", i)) { tokens.push({ t: "forall" }); i += 7; continue; }
        if (src.startsWith("\\exists", i)) { tokens.push({ t: "exists" }); i += 7; continue; }
        if (src[i+1] === "/") { tokens.push({ t: "or" }); i += 2; continue; }
        throw new Error(`Unexpected character '\\' at position ${i}`);
      }
      if (c === "→") { tokens.push({ t: "imp" }); i++; continue; }
      if (c === "-" && src[i+1] === ">") { tokens.push({ t: "imp" }); i += 2; continue; }
      if (/[A-Za-z_]/.test(c)) {
        let j = i;
        while (j < n && /[A-Za-z0-9_]/.test(src[j])) j++;
        const word = src.slice(i, j);
        if (word === "forall") { tokens.push({ t: "forall" }); i = j; continue; }
        if (word === "exists") { tokens.push({ t: "exists" }); i = j; continue; }
        tokens.push({ t: "ident", name: word });
        i = j;
        continue;
      }
      throw new Error(`Unexpected character '${c}' at position ${i}`);
    }
    return tokens;
  }

  // Grammar:
  //   formula := imp
  //   imp     := or ('→' imp)?            (right-associative)
  //   or      := and ('∨' and)*           (left-associative)
  //   and     := not ('∧' not)*           (left-associative)
  //   not     := '¬' not | quant | atom
  //   quant   := ('∀'|'∃') IDENT '.'? formula      (max-scope)
  //   atom    := IDENT ('(' (IDENT (',' IDENT)*)? ')')? | '(' formula ')'

  function parse(src) {
    const tokens = tokenize(src);
    let pos = 0;

    function peek(offset = 0) { return tokens[pos + offset]; }
    function eat(t) {
      const tok = tokens[pos];
      if (!tok || tok.t !== t) throw new Error(`expected ${t}`);
      pos++;
      return tok;
    }

    function parseFormula() { return parseImp(); }

    function parseImp() {
      const left = parseOr();
      if (peek() && peek().t === "imp") {
        pos++;
        const right = parseImp();
        return { type: "imp", left, right };
      }
      return left;
    }

    function parseOr() {
      let left = parseAnd();
      while (peek() && peek().t === "or") {
        pos++;
        const right = parseAnd();
        left = { type: "or", left, right };
      }
      return left;
    }

    function parseAnd() {
      let left = parseNot();
      while (peek() && peek().t === "and") {
        pos++;
        const right = parseNot();
        left = { type: "and", left, right };
      }
      return left;
    }

    function parseNot() {
      if (peek() && peek().t === "not") {
        pos++;
        return { type: "not", arg: parseNot() };
      }
      if (peek() && (peek().t === "forall" || peek().t === "exists")) {
        return parseQuant();
      }
      return parseAtom();
    }

    function parseQuant() {
      const qTok = tokens[pos++];
      const qType = qTok.t;
      const ident = peek();
      if (!ident || ident.t !== "ident") throw new Error("expected variable after quantifier");
      pos++;
      if (peek() && peek().t === "dot") pos++;
      const body = parseFormula();
      return { type: qType, var: ident.name, body };
    }

    function parseAtom() {
      const tok = peek();
      if (!tok) throw new Error("unexpected end of input");
      if (tok.t === "ident") {
        pos++;
        const args = [];
        if (peek() && peek().t === "(") {
          pos++;
          if (peek() && peek().t !== ")") {
            const first = eat("ident");
            args.push(first.name);
            while (peek() && peek().t === "comma") {
              pos++;
              const next = eat("ident");
              args.push(next.name);
            }
          }
          eat(")");
        }
        return { type: "pred", name: tok.name, args };
      }
      if (tok.t === "(") {
        pos++;
        const f = parseFormula();
        eat(")");
        return f;
      }
      throw new Error(`unexpected token ${tok.t}`);
    }

    const result = parseFormula();
    if (pos !== tokens.length) throw new Error("trailing tokens");
    return result;
  }

  /* ==========================================================
     AST UTILS
     ========================================================== */

  function clone(node) {
    if (node.type === "pred") return { type: "pred", name: node.name, args: node.args.slice() };
    if (node.type === "not")  return { type: "not", arg: clone(node.arg) };
    if (node.type === "forall" || node.type === "exists") {
      return { type: node.type, var: node.var, body: clone(node.body) };
    }
    return { type: node.type, left: clone(node.left), right: clone(node.right) };
  }

  function freeVars(node) {
    if (node.type === "pred") return new Set(node.args);
    if (node.type === "not") return freeVars(node.arg);
    if (node.type === "forall" || node.type === "exists") {
      const inner = freeVars(node.body);
      inner.delete(node.var);
      return inner;
    }
    const l = freeVars(node.left);
    for (const v of freeVars(node.right)) l.add(v);
    return l;
  }

  // α-equivalence-aware equality.
  function astEqual(a, b) {
    function go(a, b, envA, envB, depth) {
      if (!a || !b) return false;
      if (a.type !== b.type) return false;
      if (a.type === "pred") {
        if (a.name !== b.name) return false;
        if (a.args.length !== b.args.length) return false;
        for (let i = 0; i < a.args.length; i++) {
          const aArg = a.args[i], bArg = b.args[i];
          const aDepth = envA.get(aArg);
          const bDepth = envB.get(bArg);
          if (aDepth !== undefined || bDepth !== undefined) {
            if (aDepth !== bDepth) return false;
          } else {
            if (aArg !== bArg) return false;
          }
        }
        return true;
      }
      if (a.type === "not") return go(a.arg, b.arg, envA, envB, depth);
      if (a.type === "forall" || a.type === "exists") {
        const eA = new Map(envA); eA.set(a.var, depth);
        const eB = new Map(envB); eB.set(b.var, depth);
        return go(a.body, b.body, eA, eB, depth + 1);
      }
      return go(a.left, b.left, envA, envB, depth) &&
             go(a.right, b.right, envA, envB, depth);
    }
    return go(a, b, new Map(), new Map(), 0);
  }

  function alphaRename(node, oldName, newName) {
    if (node.type === "pred") {
      return {
        type: "pred",
        name: node.name,
        args: node.args.map(a => a === oldName ? newName : a)
      };
    }
    if (node.type === "not") {
      return { type: "not", arg: alphaRename(node.arg, oldName, newName) };
    }
    if (node.type === "forall" || node.type === "exists") {
      if (node.var === oldName) return clone(node);
      return {
        type: node.type,
        var: node.var,
        body: alphaRename(node.body, oldName, newName)
      };
    }
    return {
      type: node.type,
      left: alphaRename(node.left, oldName, newName),
      right: alphaRename(node.right, oldName, newName)
    };
  }

  function assignIds(node, counter = { n: 0 }) {
    node.id = counter.n++;
    if (node.type === "pred") return node;
    if (node.type === "not") { assignIds(node.arg, counter); return node; }
    if (node.type === "forall" || node.type === "exists") {
      assignIds(node.body, counter);
      return node;
    }
    assignIds(node.left, counter);
    assignIds(node.right, counter);
    return node;
  }

  function findById(root, id) {
    if (root.id === id) return root;
    if (root.type === "pred") return null;
    if (root.type === "not") return findById(root.arg, id);
    if (root.type === "forall" || root.type === "exists") return findById(root.body, id);
    return findById(root.left, id) || findById(root.right, id);
  }

  function replaceById(root, id, replacement) {
    if (root.id === id) return replacement;
    if (root.type === "pred") return root;
    if (root.type === "not") {
      const arg = replaceById(root.arg, id, replacement);
      return arg === root.arg ? root : { type: "not", arg };
    }
    if (root.type === "forall" || root.type === "exists") {
      const body = replaceById(root.body, id, replacement);
      return body === root.body ? root : { type: root.type, var: root.var, body };
    }
    const left = replaceById(root.left, id, replacement);
    const right = replaceById(root.right, id, replacement);
    if (left === root.left && right === root.right) return root;
    return { type: root.type, left, right };
  }

  /* ==========================================================
     RENDERING — inline clickable AST
     ========================================================== */
  const PREC = { pred: 6, not: 5, and: 4, or: 3, imp: 1, forall: 0, exists: 0 };

  function needsParensIn(node, parentType, fromRight) {
    if (!parentType) return false;
    if (node.type === "forall" || node.type === "exists") {
      if (parentType === "not") return false;
      if (parentType === "forall" || parentType === "exists") return false;
      return fromRight === false;
    }
    const andOr = (t) => t === "and" || t === "or";
    if (andOr(node.type) && andOr(parentType)) {
      if (node.type !== parentType) return true;
      return fromRight === true;
    }
    const np = PREC[node.type] ?? 0;
    const pp = PREC[parentType] ?? 0;
    if (np < pp) return true;
    if (np > pp) return false;
    if (parentType === "imp") {
      return node.type === "imp" && fromRight === false;
    }
    return false;
  }

  function renderNode(node, parentType = null, fromRight = false) {
    const wrapper = document.createElement("span");
    wrapper.className = "expr";
    wrapper.dataset.id = node.id;

    const needsParens = needsParensIn(node, parentType, fromRight);
    if (needsParens) wrapper.append(document.createTextNode("("));

    if (node.type === "pred") {
      const s = document.createElement("span");
      s.textContent = node.args.length === 0
        ? node.name
        : `${node.name}(${node.args.join(", ")})`;
      wrapper.append(s);
    } else if (node.type === "not") {
      const sym = document.createElement("span");
      sym.textContent = "¬";
      wrapper.append(sym);
      wrapper.append(renderNode(node.arg, "not", false));
    } else if (node.type === "forall" || node.type === "exists") {
      const head = document.createElement("span");
      head.textContent = `${QSYM[node.type]}${node.var}. `;
      wrapper.append(head);
      wrapper.append(renderNode(node.body, node.type, false));
    } else {
      const sym = BINOPS[node.type];
      const leftRender = renderNode(node.left, node.type, false);
      const rightRender = renderNode(node.right, node.type, true);
      wrapper.append(leftRender);
      const op = document.createElement("span");
      op.className = "op";
      op.textContent = ` ${sym}`;
      wrapper.append(op);
      wrapper.append(document.createTextNode(" "));
      wrapper.append(rightRender);
    }

    if (needsParens) wrapper.append(document.createTextNode(")"));
    return wrapper;
  }

  function renderStatic(node, parentType = null, fromRight = false) {
    const needsParens = needsParensIn(node, parentType, fromRight);
    const open = needsParens ? "(" : "";
    const close = needsParens ? ")" : "";
    if (node.type === "pred") {
      const name = node.args.length === 0 ? node.name : `${node.name}(${node.args.join(", ")})`;
      return open + name + close;
    }
    if (node.type === "not") return open + "¬" + renderStatic(node.arg, "not", false) + close;
    if (node.type === "forall" || node.type === "exists") {
      return open + QSYM[node.type] + node.var + ". " + renderStatic(node.body, node.type, false) + close;
    }
    const sym = BINOPS[node.type];
    const l = renderStatic(node.left, node.type, false);
    const r = renderStatic(node.right, node.type, true);
    return open + l + " " + sym + " " + r + close;
  }

  /* ==========================================================
     EQUIVALENCE RULES
     ========================================================== */

  function mkPullOut(quant, op, fromLeft) {
    const opSym = BINOPS[op];
    const qSym = QSYM[quant];
    const id = `pull-${quant}-${op}-${fromLeft ? "left" : "right"}`;
    if (fromLeft) {
      return {
        id,
        name: "Quantifier movement",
        schema: `(${qSym}x.P) ${opSym} Q  ≡  ${qSym}x.(P ${opSym} Q)`,
        detail: `pull ${qSym} out of ${opSym} (x not free in Q)`,
        match: (n) => n.type === op && n.left.type === quant && !freeVars(n.right).has(n.left.var),
        apply: (n) => ({
          type: quant,
          var: n.left.var,
          body: { type: op, left: clone(n.left.body), right: clone(n.right) }
        })
      };
    }
    return {
      id,
      name: "Quantifier movement",
      schema: `P ${opSym} (${qSym}x.Q)  ≡  ${qSym}x.(P ${opSym} Q)`,
      detail: `pull ${qSym} out of ${opSym} (x not free in P)`,
      match: (n) => n.type === op && n.right.type === quant && !freeVars(n.left).has(n.right.var),
      apply: (n) => ({
        type: quant,
        var: n.right.var,
        body: { type: op, left: clone(n.left), right: clone(n.right.body) }
      })
    };
  }

  function mkPushIn(quant, op, toLeft) {
    const opSym = BINOPS[op];
    const qSym = QSYM[quant];
    const id = `push-${quant}-${op}-${toLeft ? "left" : "right"}`;
    if (toLeft) {
      return {
        id,
        name: "Quantifier movement",
        schema: `${qSym}x.(P ${opSym} Q)  ≡  (${qSym}x.P) ${opSym} Q`,
        detail: `push ${qSym} into left of ${opSym} (x not free in Q)`,
        match: (n) => n.type === quant && n.body.type === op && !freeVars(n.body.right).has(n.var),
        apply: (n) => ({
          type: op,
          left: { type: quant, var: n.var, body: clone(n.body.left) },
          right: clone(n.body.right)
        })
      };
    }
    return {
      id,
      name: "Quantifier movement",
      schema: `${qSym}x.(P ${opSym} Q)  ≡  P ${opSym} (${qSym}x.Q)`,
      detail: `push ${qSym} into right of ${opSym} (x not free in P)`,
      match: (n) => n.type === quant && n.body.type === op && !freeVars(n.body.left).has(n.var),
      apply: (n) => ({
        type: op,
        left: clone(n.body.left),
        right: { type: quant, var: n.var, body: clone(n.body.right) }
      })
    };
  }

  const MOVEMENT_RULES = [];
  for (const q of ["forall", "exists"]) {
    for (const op of ["and", "or"]) {
      MOVEMENT_RULES.push(mkPullOut(q, op, true));
      MOVEMENT_RULES.push(mkPullOut(q, op, false));
      MOVEMENT_RULES.push(mkPushIn(q, op, true));
      MOVEMENT_RULES.push(mkPushIn(q, op, false));
    }
  }

  const RULES = [
    // Double negation
    {
      id: "dn-elim",
      name: "Double negation",
      schema: "¬¬A  ≡  A",
      detail: "remove ¬¬",
      match: (n) => n.type === "not" && n.arg.type === "not",
      apply: (n) => clone(n.arg.arg)
    },
    {
      id: "dn-intro",
      name: "Double negation",
      schema: "A  ≡  ¬¬A",
      detail: "introduce ¬¬",
      match: (n) => true,
      apply: (n) => ({ type: "not", arg: { type: "not", arg: clone(n) } })
    },

    // De Morgan
    {
      id: "demorgan-and",
      name: "De Morgan",
      schema: "¬(A ∧ B)  ≡  ¬A ∨ ¬B",
      detail: "push ¬ across ∧",
      match: (n) => n.type === "not" && n.arg.type === "and",
      apply: (n) => ({
        type: "or",
        left:  { type: "not", arg: clone(n.arg.left) },
        right: { type: "not", arg: clone(n.arg.right) }
      })
    },
    {
      id: "demorgan-or",
      name: "De Morgan",
      schema: "¬(A ∨ B)  ≡  ¬A ∧ ¬B",
      detail: "push ¬ across ∨",
      match: (n) => n.type === "not" && n.arg.type === "or",
      apply: (n) => ({
        type: "and",
        left:  { type: "not", arg: clone(n.arg.left) },
        right: { type: "not", arg: clone(n.arg.right) }
      })
    },
    {
      id: "demorgan-and-rev",
      name: "De Morgan (rev.)",
      schema: "¬A ∨ ¬B  ≡  ¬(A ∧ B)",
      detail: "pull ¬ out of ∨",
      match: (n) => n.type === "or" && n.left.type === "not" && n.right.type === "not",
      apply: (n) => ({
        type: "not",
        arg: { type: "and", left: clone(n.left.arg), right: clone(n.right.arg) }
      })
    },
    {
      id: "demorgan-or-rev",
      name: "De Morgan (rev.)",
      schema: "¬A ∧ ¬B  ≡  ¬(A ∨ B)",
      detail: "pull ¬ out of ∧",
      match: (n) => n.type === "and" && n.left.type === "not" && n.right.type === "not",
      apply: (n) => ({
        type: "not",
        arg: { type: "or", left: clone(n.left.arg), right: clone(n.right.arg) }
      })
    },

    // Implication
    {
      id: "impl-elim",
      name: "Implication",
      schema: "A → B  ≡  ¬A ∨ B",
      detail: "eliminate →",
      match: (n) => n.type === "imp",
      apply: (n) => ({
        type: "or",
        left:  { type: "not", arg: clone(n.left) },
        right: clone(n.right)
      })
    },
    {
      id: "impl-intro",
      name: "Implication (rev.)",
      schema: "¬A ∨ B  ≡  A → B",
      detail: "introduce →",
      match: (n) => n.type === "or" && n.left.type === "not",
      apply: (n) => ({ type: "imp", left: clone(n.left.arg), right: clone(n.right) })
    },

    // Quantifier negation (extended De Morgan)
    {
      id: "neg-forall",
      name: "Quantifier negation",
      schema: "¬∀x.P  ≡  ∃x.¬P",
      detail: "push ¬ across ∀",
      match: (n) => n.type === "not" && n.arg.type === "forall",
      apply: (n) => ({
        type: "exists",
        var: n.arg.var,
        body: { type: "not", arg: clone(n.arg.body) }
      })
    },
    {
      id: "neg-exists",
      name: "Quantifier negation",
      schema: "¬∃x.P  ≡  ∀x.¬P",
      detail: "push ¬ across ∃",
      match: (n) => n.type === "not" && n.arg.type === "exists",
      apply: (n) => ({
        type: "forall",
        var: n.arg.var,
        body: { type: "not", arg: clone(n.arg.body) }
      })
    },
    {
      id: "neg-forall-rev",
      name: "Quantifier negation (rev.)",
      schema: "∃x.¬P  ≡  ¬∀x.P",
      detail: "pull ¬ out of ∃",
      match: (n) => n.type === "exists" && n.body.type === "not",
      apply: (n) => ({
        type: "not",
        arg: { type: "forall", var: n.var, body: clone(n.body.arg) }
      })
    },
    {
      id: "neg-exists-rev",
      name: "Quantifier negation (rev.)",
      schema: "∀x.¬P  ≡  ¬∃x.P",
      detail: "pull ¬ out of ∀",
      match: (n) => n.type === "forall" && n.body.type === "not",
      apply: (n) => ({
        type: "not",
        arg: { type: "exists", var: n.var, body: clone(n.body.arg) }
      })
    },

    // Quantifier movement (for prenex)
    ...MOVEMENT_RULES,

    // Same-type quantifier commutation
    {
      id: "comm-forall",
      name: "Quantifier commutation",
      schema: "∀x.∀y.P  ≡  ∀y.∀x.P",
      detail: "swap adjacent ∀",
      match: (n) => n.type === "forall" && n.body.type === "forall",
      apply: (n) => ({
        type: "forall",
        var: n.body.var,
        body: { type: "forall", var: n.var, body: clone(n.body.body) }
      })
    },
    {
      id: "comm-exists",
      name: "Quantifier commutation",
      schema: "∃x.∃y.P  ≡  ∃y.∃x.P",
      detail: "swap adjacent ∃",
      match: (n) => n.type === "exists" && n.body.type === "exists",
      apply: (n) => ({
        type: "exists",
        var: n.body.var,
        body: { type: "exists", var: n.var, body: clone(n.body.body) }
      })
    },

    // α-rename
    {
      id: "alpha-rename",
      name: "Rename bound variable",
      schema: "∀x.P  ≡  ∀y.P[x←y]  (y not free in P)",
      detail: "rename bound variable",
      requiresInput: true,
      validateInput: (input, n) => {
        if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(input)) return "Must be a legal identifier (letters, digits, underscore; starts with letter or underscore).";
        if (input === n.var) return "Same as current — nothing to do.";
        if (freeVars(n.body).has(input)) return `"${input}" is already free in the body — would be captured.`;
        return null;
      },
      match: (n) => n.type === "forall" || n.type === "exists",
      apply: (n, input) => ({
        type: n.type,
        var: input,
        body: alphaRename(n.body, n.var, input)
      })
    }
  ];

  const RULE_FAMILIES = [
    { title: "Double negation",          ids: ["dn-elim", "dn-intro"] },
    { title: "De Morgan",                ids: ["demorgan-and", "demorgan-or", "demorgan-and-rev", "demorgan-or-rev"] },
    { title: "Implication",              ids: ["impl-elim", "impl-intro"] },
    { title: "Quantifier negation",      ids: ["neg-forall", "neg-exists", "neg-forall-rev", "neg-exists-rev"] },
    { title: "Quantifier movement",      ids: MOVEMENT_RULES.map(r => r.id) },
    { title: "Quantifier commutation",   ids: ["comm-forall", "comm-exists"] },
    { title: "Rename bound variable",    ids: ["alpha-rename"] }
  ];

  /* ==========================================================
     UTIL
     ========================================================== */

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function reasonWhyRuleDoesntApply(rule, node) {
    switch (rule.id) {
      case "demorgan-and":     return "Needs the shape ¬(A ∧ B).";
      case "demorgan-or":      return "Needs the shape ¬(A ∨ B).";
      case "demorgan-and-rev": return "Needs the shape ¬A ∨ ¬B.";
      case "demorgan-or-rev":  return "Needs the shape ¬A ∧ ¬B.";
      case "dn-elim":          return "Needs the shape ¬¬A.";
      case "dn-intro":         return "(Applies to any selected expression.)";
      case "impl-elim":        return "Needs an implication A → B.";
      case "impl-intro":       return "Needs the shape ¬A ∨ B.";
      case "neg-forall":       return "Needs the shape ¬∀x.P.";
      case "neg-exists":       return "Needs the shape ¬∃x.P.";
      case "neg-forall-rev":   return "Needs the shape ∃x.¬P.";
      case "neg-exists-rev":   return "Needs the shape ∀x.¬P.";
      case "comm-forall":      return "Needs two adjacent ∀ quantifiers: ∀x.∀y.P.";
      case "comm-exists":      return "Needs two adjacent ∃ quantifiers: ∃x.∃y.P.";
      case "alpha-rename":     return "Needs a quantifier (∀ or ∃).";
    }
    if (rule.id.startsWith("pull-") || rule.id.startsWith("push-")) {
      return movementRuleReason(rule, node);
    }
    return "This rule doesn't match the selected shape.";
  }

  function movementRuleReason(rule, node) {
    const parts = rule.id.split("-"); // [pull|push, quant, op, left|right]
    const kind = parts[0], quant = parts[1], op = parts[2], side = parts[3];
    const qSym = QSYM[quant];
    const opSym = BINOPS[op];

    if (kind === "pull" && node.type === op) {
      if (side === "left" && node.left.type === quant && freeVars(node.right).has(node.left.var)) {
        return `Would capture "${node.left.var}": it's already free in the right side.`;
      }
      if (side === "right" && node.right.type === quant && freeVars(node.left).has(node.right.var)) {
        return `Would capture "${node.right.var}": it's already free in the left side.`;
      }
    }
    if (kind === "push" && node.type === quant && node.body && node.body.type === op) {
      if (side === "left" && freeVars(node.body.right).has(node.var)) {
        return `Can't push: "${node.var}" appears free in the right operand.`;
      }
      if (side === "right" && freeVars(node.body.left).has(node.var)) {
        return `Can't push: "${node.var}" appears free in the left operand.`;
      }
    }
    const shape = {
      "pull-left":  `(${qSym}x.P) ${opSym} Q`,
      "pull-right": `P ${opSym} (${qSym}x.Q)`,
      "push-left":  `${qSym}x.(P ${opSym} Q) with "x" not free in Q`,
      "push-right": `${qSym}x.(P ${opSym} Q) with "x" not free in P`
    };
    return `Needs the shape ${shape[`${kind}-${side}`] || "…"}.`;
  }

  /* ==========================================================
     PER-INSTANCE MOUNT
     ========================================================== */

  let widgetSeq = 0;

  function mountWidget(container) {
    if (container.dataset.leqwInit === "1") return;
    container.dataset.leqwInit = "1";

    const instanceId = ++widgetSeq;
    const rulesPanelId = `leqw-rules-${instanceId}`;

    let problem;
    try {
      const raw = container.dataset.problem;
      problem = raw ? JSON.parse(raw) : {};
    } catch (e) {
      console.error("logic-equiv-quantified-widget: invalid data-problem JSON on", container, e);
      container.textContent = "Quantified-logic widget: invalid configuration. See browser console.";
      return;
    }
    problem = { ...DEFAULT_PROBLEM, ...problem };

    container.innerHTML = `
      <div class="widget">
        <div class="target-line">
          Transform <span class="target-formula" data-role="target-start"></span>
          into <span class="target-formula target-goal" data-role="target-target"></span>
        </div>
        <div class="widget-main" data-role="widget-main">
          <section class="derivation-area">
            <div class="derivation-header">
              <div class="selection-status" data-role="selection-status">
                <span class="muted">select a subexpression to apply a law</span>
              </div>
              <button class="undo-btn" type="button" data-role="btn-undo" disabled>Undo</button>
            </div>
            <ol class="derivation" data-role="derivation"></ol>
            <div class="solved-indicator" data-role="solved-indicator" hidden>&#10003; Solved</div>
          </section>
          <aside class="rules-area">
            <button class="rules-toggle" type="button" data-role="rules-toggle"
                    aria-expanded="true" aria-controls="${rulesPanelId}">
              <span class="rules-toggle-label">Hide laws</span>
            </button>
            <div class="rules-index" id="${rulesPanelId}" data-role="rules-index"></div>
          </aside>
        </div>
      </div>
    `;

    const els = {
      targetStart:     container.querySelector('[data-role="target-start"]'),
      targetTarget:    container.querySelector('[data-role="target-target"]'),
      btnUndo:         container.querySelector('[data-role="btn-undo"]'),
      derivation:      container.querySelector('[data-role="derivation"]'),
      selectionStatus: container.querySelector('[data-role="selection-status"]'),
      rulesIndex:      container.querySelector('[data-role="rules-index"]'),
      rulesToggle:     container.querySelector('[data-role="rules-toggle"]'),
      widgetMain:      container.querySelector('[data-role="widget-main"]'),
      solvedIndicator: container.querySelector('[data-role="solved-indicator"]')
    };

    const State = {
      startFormula: null,
      targetFormula: null,
      history: [],
      selectedId: null,
      solved: false,
      pendingRename: null
    };

    /* -------------------- RENDER -------------------- */

    function render() {
      renderDerivation();
      renderSelectionStatus();
      renderRulesState();
      els.btnUndo.disabled = State.history.length <= 1;
      els.solvedIndicator.hidden = !State.solved;
    }

    function renderDerivation() {
      els.derivation.innerHTML = "";
      State.history.forEach((step, i) => {
        const isCurrent = (i === State.history.length - 1);
        const li = document.createElement("li");
        li.className = "step" + (isCurrent ? " current" : "");

        const num = document.createElement("div");
        num.className = "step-num";
        num.textContent = `${i + 1}.`;

        const formulaDiv = document.createElement("div");
        formulaDiv.className = "step-formula";
        if (isCurrent) {
          assignIds(step.ast);
          const rendered = renderNode(step.ast);
          rendered.classList.add("root");
          formulaDiv.appendChild(rendered);
          attachExprHandlers(formulaDiv);
        } else {
          formulaDiv.textContent = renderStatic(step.ast);
        }

        const ruleDiv = document.createElement("div");
        ruleDiv.className = "step-rule";
        if (step.ruleName) {
          const detail = step.ruleDetail || "";
          ruleDiv.innerHTML = `
            <span class="tag-name">${escapeHtml(step.ruleName)}</span>${detail ? `<span class="tag-sep">·</span><span class="tag-detail">${escapeHtml(detail)}</span>` : ""}
          `;
        } else {
          ruleDiv.innerHTML = `<span class="tag-name">Given</span>`;
        }

        li.appendChild(num);
        li.appendChild(formulaDiv);
        li.appendChild(ruleDiv);
        els.derivation.appendChild(li);
      });
    }

    function attachExprHandlers(formulaContainer) {
      const exprs = formulaContainer.querySelectorAll(".expr");
      exprs.forEach((el) => {
        el.addEventListener("click", onExprClick);
        el.addEventListener("mouseenter", onExprHover);
        el.addEventListener("mouseleave", onExprHoverOut);
      });

      if (State.selectedId !== null) {
        const target = formulaContainer.querySelector(`.expr[data-id="${State.selectedId}"]`);
        if (target) target.classList.add("selected");
      }
    }

    function onExprClick(e) {
      e.stopPropagation();
      if (State.pendingRename) cancelPendingRename();
      const id = parseInt(this.dataset.id, 10);
      if (State.selectedId === id) {
        State.selectedId = null;
      } else {
        State.selectedId = id;
      }
      render();
    }

    function onExprHover(e) {
      e.stopPropagation();
      let p = this.parentElement;
      while (p) {
        if (p.classList && p.classList.contains("expr")) p.classList.remove("hovering");
        p = p.parentElement;
      }
      this.querySelectorAll(".expr.hovering").forEach((c) => c.classList.remove("hovering"));
      this.classList.add("hovering");
    }
    function onExprHoverOut(e) {
      this.classList.remove("hovering");
      const related = e.relatedTarget;
      if (related && related.classList && related.closest) {
        const parentExpr = related.closest(".expr");
        if (parentExpr && this.parentElement && this.parentElement.closest(".expr") === parentExpr) {
          parentExpr.classList.add("hovering");
        }
      }
    }

    function renderSelectionStatus() {
      if (State.pendingRename) {
        renderRenamePrompt();
        return;
      }
      if (State.solved) {
        els.selectionStatus.innerHTML = `<span class="muted">target reached</span>`;
        return;
      }
      if (State.selectedId === null) {
        els.selectionStatus.innerHTML = `<span class="muted">select a subexpression to apply a law</span>`;
        return;
      }
      const current = State.history[State.history.length - 1].ast;
      const node = findById(current, State.selectedId);
      if (!node) {
        els.selectionStatus.innerHTML = `<span class="muted">select a subexpression to apply a law</span>`;
        return;
      }
      els.selectionStatus.innerHTML = `selected <span class="picked">${escapeHtml(renderStatic(node))}</span>`;
    }

    function renderRenamePrompt() {
      const { node, ruleId } = State.pendingRename;
      const rule = RULES.find(r => r.id === ruleId);
      els.selectionStatus.innerHTML = "";

      const wrap = document.createElement("span");
      wrap.className = "rename-prompt";

      const label = document.createElement("span");
      label.textContent = `Rename ${QSYM[node.type]}${node.var} to: `;
      wrap.appendChild(label);

      const input = document.createElement("input");
      input.type = "text";
      input.className = "rename-input";
      input.placeholder = "new name";
      input.autocomplete = "off";
      input.spellcheck = false;
      wrap.appendChild(input);

      const submit = document.createElement("button");
      submit.type = "button";
      submit.className = "rename-submit";
      submit.textContent = "Rename";
      wrap.appendChild(submit);

      const cancel = document.createElement("button");
      cancel.type = "button";
      cancel.className = "rename-cancel";
      cancel.textContent = "Cancel";
      wrap.appendChild(cancel);

      const err = document.createElement("span");
      err.className = "rename-error";
      wrap.appendChild(err);

      function tryApply() {
        const v = input.value.trim();
        const reason = rule.validateInput(v, node);
        if (reason) {
          err.textContent = reason;
          return;
        }
        State.pendingRename = null;
        applyRule(rule, node, v);
      }

      input.addEventListener("input", () => { err.textContent = ""; });
      input.addEventListener("keydown", (e) => {
        if (e.key === "Enter") { e.preventDefault(); tryApply(); }
        else if (e.key === "Escape") { e.preventDefault(); cancelPendingRename(); }
      });
      submit.addEventListener("click", tryApply);
      cancel.addEventListener("click", cancelPendingRename);

      els.selectionStatus.appendChild(wrap);
      input.focus();
    }

    function cancelPendingRename() {
      State.pendingRename = null;
      render();
    }

    function renderRulesIndex() {
      els.rulesIndex.innerHTML = "";
      RULE_FAMILIES.forEach((fam) => {
        const details = document.createElement("details");
        details.className = "rule-family";

        const summary = document.createElement("summary");
        summary.className = "rule-family-summary";
        summary.innerHTML = `
          <span class="family-name">${escapeHtml(fam.title)}</span>
          <span class="family-indicator" aria-hidden="true"></span>
        `;
        details.appendChild(summary);

        const body = document.createElement("div");
        body.className = "rule-family-body";

        fam.ids.forEach((ruleId) => {
          const rule = RULES.find((r) => r.id === ruleId);
          if (!rule) return;
          const btn = document.createElement("button");
          btn.className = "rule-entry";
          btn.dataset.ruleId = rule.id;
          btn.innerHTML = `
            <span class="rule-schema">${escapeHtml(rule.schema)}</span>
            <span class="rule-dir">${escapeHtml(rule.detail)}</span>
          `;
          btn.addEventListener("click", () => onRuleClick(rule.id));
          body.appendChild(btn);
        });

        details.appendChild(body);
        els.rulesIndex.appendChild(details);
      });
    }

    function renderRulesState() {
      const buttons = els.rulesIndex.querySelectorAll(".rule-entry");
      const current = State.history[State.history.length - 1].ast;
      const sel = State.selectedId !== null ? findById(current, State.selectedId) : null;

      buttons.forEach((btn) => {
        const ruleId = btn.dataset.ruleId;
        const rule = RULES.find((r) => r.id === ruleId);
        if (State.solved) {
          btn.disabled = true;
          btn.dataset.reason = "You've reached the target. Undo to continue experimenting.";
          return;
        }
        if (State.pendingRename) {
          btn.disabled = true;
          btn.dataset.reason = "Enter a new name or cancel.";
          return;
        }
        if (!sel) {
          btn.disabled = true;
          btn.dataset.reason = "First select a subexpression in the current formula.";
          return;
        }
        const applies = rule.match(sel);
        btn.disabled = !applies;
        if (applies) {
          btn.removeAttribute("data-reason");
        } else {
          btn.dataset.reason = reasonWhyRuleDoesntApply(rule, sel);
        }
      });

      const families = els.rulesIndex.querySelectorAll(".rule-family");
      families.forEach((details) => {
        const enabledCount = details.querySelectorAll(".rule-entry:not(:disabled)").length;
        details.classList.toggle("has-applicable", enabledCount > 0);
        details.classList.toggle("dim", enabledCount === 0);
      });
    }

    /* -------------------- ACTIONS -------------------- */

    function onRuleClick(ruleId) {
      const rule = RULES.find((r) => r.id === ruleId);
      if (!rule) return;
      if (State.selectedId === null || State.solved) return;
      const current = State.history[State.history.length - 1].ast;
      const sel = findById(current, State.selectedId);
      if (!sel || !rule.match(sel)) return;

      if (rule.requiresInput) {
        State.pendingRename = { ruleId, node: sel };
        render();
        return;
      }
      applyRule(rule, sel);
    }

    function applyRule(rule, selNode, input) {
      const current = State.history[State.history.length - 1].ast;
      const replacement = rule.apply(selNode, input);
      const newTree = replaceById(current, selNode.id, replacement);
      assignIds(newTree);

      let detail = rule.schema;
      if (rule.id === "alpha-rename") {
        detail = `${selNode.var} → ${input}`;
      }

      State.history.push({
        ast: newTree,
        ruleName: rule.name,
        ruleDetail: detail
      });
      State.selectedId = null;

      if (astEqual(newTree, State.targetFormula)) {
        State.solved = true;
      }
      render();
    }

    function undo() {
      if (State.history.length <= 1) return;
      if (State.solved) State.solved = false;
      State.history.pop();
      State.selectedId = null;
      State.pendingRename = null;
      render();
    }

    function toggleRulesSidebar() {
      const collapsed = els.widgetMain.classList.toggle("rules-collapsed");
      els.rulesToggle.setAttribute("aria-expanded", String(!collapsed));
      const label = els.rulesToggle.querySelector(".rules-toggle-label");
      if (label) label.textContent = collapsed ? "Show laws" : "Hide laws";
    }

    /* -------------------- LOAD -------------------- */

    function loadProblem() {
      let startAst, targetAst;
      try {
        startAst = parse(problem.start);
        targetAst = parse(problem.target);
      } catch (e) {
        console.error("logic-equiv-quantified-widget: problem configuration error on", container, e);
        container.textContent = "Quantified-logic widget: " + e.message;
        return;
      }
      assignIds(startAst);
      State.startFormula = startAst;
      State.targetFormula = targetAst;
      State.history = [{ ast: startAst, ruleName: null, ruleDetail: null }];
      State.selectedId = null;
      State.solved = false;
      State.pendingRename = null;

      els.targetStart.textContent = renderStatic(startAst);
      els.targetTarget.textContent = renderStatic(targetAst);

      render();
    }

    /* -------------------- WIRE UP -------------------- */

    els.btnUndo.addEventListener("click", undo);
    els.rulesToggle.addEventListener("click", toggleRulesSidebar);
    // Note: no document-level keyboard shortcuts (u/Escape). With multiple widgets
    // on one page, global shortcuts would be ambiguous. Per-instance buttons are
    // still available; the rename input still handles Enter/Escape locally.

    renderRulesIndex();
    loadProblem();
  }

  /* ==========================================================
     INIT
     ========================================================== */

  function init() {
    document.querySelectorAll(".logic-equiv-quantified-widget").forEach(mountWidget);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
}());
