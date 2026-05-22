/* ==========================================================
   Logic Equivalence Practice — embeddable widget
   ==========================================================
   Each instance is a <div class="logic-equiv-widget"> with a
   `data-problem` attribute holding JSON config:

     <div class="logic-equiv-widget"
          data-problem='{"start": "¬(P ∧ Q)", "target": "¬P ∨ ¬Q"}'>
     </div>

   Multiple instances can coexist on one page; each mounts independently
   with isolated state. The script is safe to load multiple times.

   Formula syntax in start/target strings:
     ¬  !  ~    for NOT
     ∧  &  /\   for AND
     ∨  |  \/   for OR
     ⊕  ^       for XOR
     →  ->      for IMPLIES
     ( )        for grouping
   Atomic propositions: any identifier like P, Q, R, A1, foo.
   ========================================================== */

(function () {

  const DEFAULT_PROBLEM = { start: "¬(P ∧ Q)", target: "¬P ∨ ¬Q" };

  /* ==========================================================
     AST TYPES
     ========================================================== */
  // Node forms:
  //   { type: "atom", name: "P" }
  //   { type: "not",  arg: Node }
  //   { type: "and",  left: Node, right: Node }
  //   { type: "or",   left: Node, right: Node }
  //   { type: "xor",  left: Node, right: Node }
  //   { type: "imp",  left: Node, right: Node }

  const BINOPS = { and: "∧", or: "∨", xor: "⊕", imp: "→" };

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
      if (c === "¬" || c === "!" || c === "~") { tokens.push({ t: "not" }); i++; continue; }
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
      if (c === "\\" && src[i+1] === "/") { tokens.push({ t: "or" }); i += 2; continue; }
      if (c === "⊕" || c === "^") { tokens.push({ t: "xor" }); i++; continue; }
      if (c === "→") { tokens.push({ t: "imp" }); i++; continue; }
      if (c === "-" && src[i+1] === ">") { tokens.push({ t: "imp" }); i += 2; continue; }
      if (/[A-Za-z_]/.test(c)) {
        let j = i;
        while (j < n && /[A-Za-z0-9_]/.test(src[j])) j++;
        tokens.push({ t: "atom", name: src.slice(i, j) });
        i = j;
        continue;
      }
      throw new Error(`Unexpected character '${c}' at position ${i}`);
    }
    return tokens;
  }

  // Grammar:
  //   formula := imp
  //   imp     := xor ('→' xor)*  (right-associative)
  //   xor     := or  ('⊕' or)*   (left-associative)
  //   or      := and ('∨' and)*  (left-associative)
  //   and     := not ('∧' not)*  (left-associative)
  //   not     := '¬' not | atom
  //   atom    := ATOM | '(' formula ')'

  function parse(src) {
    const tokens = tokenize(src);
    let pos = 0;

    function peek() { return tokens[pos]; }
    function eat(t) {
      const tok = tokens[pos];
      if (!tok || tok.t !== t) throw new Error(`expected ${t}`);
      pos++;
      return tok;
    }

    function parseFormula() { return parseImp(); }

    function parseImp() {
      const left = parseXor();
      if (peek() && peek().t === "imp") {
        pos++;
        const right = parseImp(); // right-associative
        return { type: "imp", left, right };
      }
      return left;
    }

    function parseXor() {
      let left = parseOr();
      while (peek() && peek().t === "xor") {
        pos++;
        const right = parseOr();
        left = { type: "xor", left, right };
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
      return parseAtom();
    }

    function parseAtom() {
      const tok = peek();
      if (!tok) throw new Error("unexpected end of input");
      if (tok.t === "atom") { pos++; return { type: "atom", name: tok.name }; }
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
    if (node.type === "atom") return { type: "atom", name: node.name };
    if (node.type === "not")  return { type: "not", arg: clone(node.arg) };
    return { type: node.type, left: clone(node.left), right: clone(node.right) };
  }

  function astEqual(a, b) {
    if (!a || !b) return false;
    if (a.type !== b.type) return false;
    if (a.type === "atom") return a.name === b.name;
    if (a.type === "not")  return astEqual(a.arg, b.arg);
    return astEqual(a.left, b.left) && astEqual(a.right, b.right);
  }

  // Assign stable integer IDs to every node in-place for selection tracking.
  function assignIds(node, counter = { n: 0 }) {
    node.id = counter.n++;
    if (node.type === "not") assignIds(node.arg, counter);
    else if (node.type !== "atom") {
      assignIds(node.left, counter);
      assignIds(node.right, counter);
    }
    return node;
  }

  function findById(root, id) {
    if (root.id === id) return root;
    if (root.type === "not") return findById(root.arg, id);
    if (root.type === "atom") return null;
    return findById(root.left, id) || findById(root.right, id);
  }

  // Replace the subtree with the given id in root with `replacement`.
  // Returns a new tree (pure). `replacement` is used as-is (should be freshly cloned).
  function replaceById(root, id, replacement) {
    if (root.id === id) return replacement;
    if (root.type === "atom") return root;
    if (root.type === "not") {
      const arg = replaceById(root.arg, id, replacement);
      return arg === root.arg ? root : { type: "not", arg };
    }
    const left = replaceById(root.left, id, replacement);
    const right = replaceById(root.right, id, replacement);
    if (left === root.left && right === root.right) return root;
    return { type: root.type, left, right };
  }

  /* ==========================================================
     RENDERING — inline clickable AST
     ========================================================== */
  // Precedence (higher binds tighter):
  //   atom:6, not:5, and:4, or:3, xor:2, imp:1
  const PREC = { atom: 6, not: 5, and: 4, or: 3, xor: 2, imp: 1 };

  function needsParensIn(node, parentType, fromRight) {
    if (!parentType) return false;
    const andOr = (t) => t === "and" || t === "or";
    if (andOr(node.type) && andOr(parentType)) {
      if (node.type !== parentType) return true;
      return fromRight === true;
    }
    const np = PREC[node.type];
    const pp = PREC[parentType] || 0;
    if (np < pp) return true;
    if (np > pp) return false;
    if (parentType === "xor") {
      return node.type === parentType && fromRight === true;
    }
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

    if (node.type === "atom") {
      const s = document.createElement("span");
      s.textContent = node.name;
      wrapper.append(s);
    } else if (node.type === "not") {
      const sym = document.createElement("span");
      sym.textContent = "¬";
      wrapper.append(sym);
      wrapper.append(renderNode(node.arg, "not", false));
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

  // Static render (no ids, no clickable) — used for target line and rule schemas.
  function renderStatic(node, parentType = null, fromRight = false) {
    const needsParens = needsParensIn(node, parentType, fromRight);
    const open = needsParens ? "(" : "";
    const close = needsParens ? ")" : "";
    if (node.type === "atom") return open + node.name + close;
    if (node.type === "not")  return open + "¬" + renderStatic(node.arg, "not", false) + close;
    const sym = BINOPS[node.type];
    const l = renderStatic(node.left, node.type, false);
    const r = renderStatic(node.right, node.type, true);
    return open + l + " " + sym + " " + r + close;
  }

  /* ==========================================================
     EQUIVALENCE RULES
     ========================================================== */

  const RULES = [
    // ---------- De Morgan ----------
    {
      id: "demorgan-and",
      name: "De Morgan",
      schema: "¬(A ∧ B)  ≡  ¬A ∨ ¬B",
      detail: "¬(A ∧ B) → ¬A ∨ ¬B",
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
      detail: "¬(A ∨ B) → ¬A ∧ ¬B",
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
      detail: "¬A ∨ ¬B → ¬(A ∧ B)",
      match: (n) => n.type === "or" &&
                    n.left.type === "not" && n.right.type === "not",
      apply: (n) => ({
        type: "not",
        arg: { type: "and", left: clone(n.left.arg), right: clone(n.right.arg) }
      })
    },
    {
      id: "demorgan-or-rev",
      name: "De Morgan (rev.)",
      schema: "¬A ∧ ¬B  ≡  ¬(A ∨ B)",
      detail: "¬A ∧ ¬B → ¬(A ∨ B)",
      match: (n) => n.type === "and" &&
                    n.left.type === "not" && n.right.type === "not",
      apply: (n) => ({
        type: "not",
        arg: { type: "or", left: clone(n.left.arg), right: clone(n.right.arg) }
      })
    },

    // ---------- Double negation ----------
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

    // ---------- Associative ----------
    {
      id: "assoc-and-right",
      name: "Associative",
      schema: "(A ∧ B) ∧ C  ≡  A ∧ (B ∧ C)",
      detail: "re-group ∧ to the right",
      match: (n) => n.type === "and" && n.left.type === "and",
      apply: (n) => ({
        type: "and",
        left: clone(n.left.left),
        right: { type: "and", left: clone(n.left.right), right: clone(n.right) }
      })
    },
    {
      id: "assoc-and-left",
      name: "Associative",
      schema: "A ∧ (B ∧ C)  ≡  (A ∧ B) ∧ C",
      detail: "re-group ∧ to the left",
      match: (n) => n.type === "and" && n.right.type === "and",
      apply: (n) => ({
        type: "and",
        left: { type: "and", left: clone(n.left), right: clone(n.right.left) },
        right: clone(n.right.right)
      })
    },
    {
      id: "assoc-or-right",
      name: "Associative",
      schema: "(A ∨ B) ∨ C  ≡  A ∨ (B ∨ C)",
      detail: "re-group ∨ to the right",
      match: (n) => n.type === "or" && n.left.type === "or",
      apply: (n) => ({
        type: "or",
        left: clone(n.left.left),
        right: { type: "or", left: clone(n.left.right), right: clone(n.right) }
      })
    },
    {
      id: "assoc-or-left",
      name: "Associative",
      schema: "A ∨ (B ∨ C)  ≡  (A ∨ B) ∨ C",
      detail: "re-group ∨ to the left",
      match: (n) => n.type === "or" && n.right.type === "or",
      apply: (n) => ({
        type: "or",
        left: { type: "or", left: clone(n.left), right: clone(n.right.left) },
        right: clone(n.right.right)
      })
    },

    // ---------- Commutative ----------
    {
      id: "comm-and",
      name: "Commutative",
      schema: "A ∧ B  ≡  B ∧ A",
      detail: "swap ∧",
      match: (n) => n.type === "and",
      apply: (n) => ({ type: "and", left: clone(n.right), right: clone(n.left) })
    },
    {
      id: "comm-or",
      name: "Commutative",
      schema: "A ∨ B  ≡  B ∨ A",
      detail: "swap ∨",
      match: (n) => n.type === "or",
      apply: (n) => ({ type: "or", left: clone(n.right), right: clone(n.left) })
    },

    // ---------- Distributive ----------
    {
      id: "dist-and-over-or",
      name: "Distributive",
      schema: "A ∧ (B ∨ C)  ≡  (A ∧ B) ∨ (A ∧ C)",
      detail: "distribute ∧ over ∨",
      match: (n) => n.type === "and" && n.right.type === "or",
      apply: (n) => ({
        type: "or",
        left:  { type: "and", left: clone(n.left), right: clone(n.right.left)  },
        right: { type: "and", left: clone(n.left), right: clone(n.right.right) }
      })
    },
    {
      id: "dist-and-over-or-left",
      name: "Distributive",
      schema: "(A ∨ B) ∧ C  ≡  (A ∧ C) ∨ (B ∧ C)",
      detail: "distribute ∧ over ∨ (from left)",
      match: (n) => n.type === "and" && n.left.type === "or",
      apply: (n) => ({
        type: "or",
        left:  { type: "and", left: clone(n.left.left),  right: clone(n.right) },
        right: { type: "and", left: clone(n.left.right), right: clone(n.right) }
      })
    },
    {
      id: "dist-or-over-and",
      name: "Distributive",
      schema: "A ∨ (B ∧ C)  ≡  (A ∨ B) ∧ (A ∨ C)",
      detail: "distribute ∨ over ∧",
      match: (n) => n.type === "or" && n.right.type === "and",
      apply: (n) => ({
        type: "and",
        left:  { type: "or", left: clone(n.left), right: clone(n.right.left)  },
        right: { type: "or", left: clone(n.left), right: clone(n.right.right) }
      })
    },
    {
      id: "dist-or-over-and-left",
      name: "Distributive",
      schema: "(A ∧ B) ∨ C  ≡  (A ∨ C) ∧ (B ∨ C)",
      detail: "distribute ∨ over ∧ (from left)",
      match: (n) => n.type === "or" && n.left.type === "and",
      apply: (n) => ({
        type: "and",
        left:  { type: "or", left: clone(n.left.left),  right: clone(n.right) },
        right: { type: "or", left: clone(n.left.right), right: clone(n.right) }
      })
    },
    {
      id: "dist-factor-and",
      name: "Distributive (factor)",
      schema: "(A ∧ B) ∨ (A ∧ C)  ≡  A ∧ (B ∨ C)",
      detail: "factor common ∧",
      match: (n) => n.type === "or" &&
                    n.left.type === "and" && n.right.type === "and" &&
                    astEqual(n.left.left, n.right.left),
      apply: (n) => ({
        type: "and",
        left: clone(n.left.left),
        right: { type: "or", left: clone(n.left.right), right: clone(n.right.right) }
      })
    },
    {
      id: "dist-factor-or",
      name: "Distributive (factor)",
      schema: "(A ∨ B) ∧ (A ∨ C)  ≡  A ∨ (B ∧ C)",
      detail: "factor common ∨",
      match: (n) => n.type === "and" &&
                    n.left.type === "or" && n.right.type === "or" &&
                    astEqual(n.left.left, n.right.left),
      apply: (n) => ({
        type: "or",
        left: clone(n.left.left),
        right: { type: "and", left: clone(n.left.right), right: clone(n.right.right) }
      })
    },

    // ---------- Implication elimination ----------
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

    // ---------- XOR elimination ----------
    {
      id: "xor-elim",
      name: "XOR",
      schema: "A ⊕ B  ≡  (A ∧ ¬B) ∨ (¬A ∧ B)",
      detail: "eliminate ⊕",
      match: (n) => n.type === "xor",
      apply: (n) => ({
        type: "or",
        left: {
          type: "and",
          left:  clone(n.left),
          right: { type: "not", arg: clone(n.right) }
        },
        right: {
          type: "and",
          left:  { type: "not", arg: clone(n.left) },
          right: clone(n.right)
        }
      })
    }
  ];

  const RULE_FAMILIES = [
    { title: "De Morgan",       ids: ["demorgan-and", "demorgan-or", "demorgan-and-rev", "demorgan-or-rev"] },
    { title: "Double negation", ids: ["dn-elim", "dn-intro"] },
    { title: "Associative",     ids: ["assoc-and-right", "assoc-and-left", "assoc-or-right", "assoc-or-left"] },
    { title: "Commutative",     ids: ["comm-and", "comm-or"] },
    { title: "Distributive",    ids: ["dist-and-over-or", "dist-and-over-or-left", "dist-or-over-and", "dist-or-over-and-left", "dist-factor-and", "dist-factor-or"] },
    { title: "Implication",     ids: ["impl-elim", "impl-intro"] },
    { title: "XOR",             ids: ["xor-elim"] }
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

  function reasonWhyRuleDoesntApply(rule) {
    switch (rule.id) {
      case "demorgan-and":         return "Needs the shape ¬(A ∧ B): a negation of a conjunction.";
      case "demorgan-or":          return "Needs the shape ¬(A ∨ B): a negation of a disjunction.";
      case "demorgan-and-rev":     return "Needs the shape ¬A ∨ ¬B: a disjunction of two negations.";
      case "demorgan-or-rev":      return "Needs the shape ¬A ∧ ¬B: a conjunction of two negations.";
      case "dn-elim":              return "Needs the shape ¬¬A: a double-negation.";
      case "dn-intro":             return "(This rule applies to any selected expression.)";
      case "assoc-and-right":      return "Needs the shape (A ∧ B) ∧ C.";
      case "assoc-and-left":       return "Needs the shape A ∧ (B ∧ C).";
      case "assoc-or-right":       return "Needs the shape (A ∨ B) ∨ C.";
      case "assoc-or-left":        return "Needs the shape A ∨ (B ∨ C).";
      case "comm-and":             return "Needs a conjunction A ∧ B.";
      case "comm-or":              return "Needs a disjunction A ∨ B.";
      case "dist-and-over-or":     return "Needs the shape A ∧ (B ∨ C).";
      case "dist-and-over-or-left":return "Needs the shape (A ∨ B) ∧ C.";
      case "dist-or-over-and":     return "Needs the shape A ∨ (B ∧ C).";
      case "dist-or-over-and-left":return "Needs the shape (A ∧ B) ∨ C.";
      case "dist-factor-and":      return "Needs the shape (A ∧ B) ∨ (A ∧ C) with a common left conjunct.";
      case "dist-factor-or":       return "Needs the shape (A ∨ B) ∧ (A ∨ C) with a common left disjunct.";
      case "impl-elim":            return "Needs an implication A → B.";
      case "impl-intro":           return "Needs the shape ¬A ∨ B.";
      default:                     return "This rule doesn't match the selected shape.";
    }
  }

  /* ==========================================================
     PER-INSTANCE MOUNT
     ========================================================== */

  let widgetSeq = 0;

  function mountWidget(container) {
    if (container.dataset.lewInit === "1") return;
    container.dataset.lewInit = "1";

    const instanceId = ++widgetSeq;
    const rulesPanelId = `lew-rules-${instanceId}`;

    // ---- Read & validate problem ----
    let problem;
    try {
      const raw = container.dataset.problem;
      problem = raw ? JSON.parse(raw) : {};
    } catch (e) {
      console.error("logic-equiv-widget: invalid data-problem JSON on", container, e);
      container.textContent = "Logic-equivalence widget: invalid configuration. See browser console.";
      return;
    }
    problem = { ...DEFAULT_PROBLEM, ...problem };

    // ---- Build shell DOM ----
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

    // ---- Per-instance state ----
    const State = {
      startFormula: null,
      targetFormula: null,
      history: [],
      selectedId: null,
      solved: false
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
          btn.dataset.reason = reasonWhyRuleDoesntApply(rule);
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

      applyRule(rule, sel);
    }

    function applyRule(rule, selNode) {
      const current = State.history[State.history.length - 1].ast;
      const replacement = rule.apply(selNode);
      const newTree = replaceById(current, selNode.id, replacement);
      assignIds(newTree);
      State.history.push({
        ast: newTree,
        ruleName: rule.name,
        ruleDetail: rule.schema
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
        console.error("logic-equiv-widget: problem configuration error on", container, e);
        container.textContent = "Logic-equivalence widget: " + e.message;
        return;
      }
      assignIds(startAst);
      State.startFormula = startAst;
      State.targetFormula = targetAst;
      State.history = [{ ast: startAst, ruleName: null, ruleDetail: null }];
      State.selectedId = null;
      State.solved = false;

      els.targetStart.textContent = renderStatic(startAst);
      els.targetTarget.textContent = renderStatic(targetAst);

      render();
    }

    /* -------------------- WIRE UP -------------------- */

    els.btnUndo.addEventListener("click", undo);
    els.rulesToggle.addEventListener("click", toggleRulesSidebar);
    // Note: no document-level keyboard shortcuts. With multiple widgets on one
    // page, global shortcuts (u/Escape) would be ambiguous. Per-instance buttons
    // are still available.

    renderRulesIndex();
    loadProblem();
  }

  /* ==========================================================
     INIT — find every .logic-equiv-widget on the page and mount it.
     Idempotent: dataset.lewInit guards against double-mount.
     ========================================================== */

  function init() {
    document.querySelectorAll(".logic-equiv-widget").forEach(mountWidget);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
}());
