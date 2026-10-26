import postcss from 'postcss';
import selectorParser from 'postcss-selector-parser';
import valueParser from 'postcss-value-parser';

const FORBIDDEN_AT_RULES = new Set([
  'color-profile',
  'counter-style',
  'document',
  'font-face',
  'font-palette-values',
  'import',
  'namespace',
  'page',
  'property',
  'viewport',
  '-ms-viewport',
]);

const FORBIDDEN_PSEUDOS = new Set([':host', ':host-context', '::slotted']);
const FORBIDDEN_RESOURCE_FUNCTIONS = new Set(['url', 'image-set', '-webkit-image-set', 'paint']);

function decodeCssEscapes(value: string): string {
  return value.replace(/\\([\da-f]{1,6}\s?|[^\r\n])/gi, (_match, escaped: string) => {
    const hex = escaped.trim();
    if (!/^[\da-f]{1,6}$/i.test(hex)) return escaped;
    const codePoint = Number.parseInt(hex, 16);
    return String.fromCodePoint(codePoint === 0 || codePoint > 0x10ffff ? 0xfffd : codePoint);
  });
}

export function isSafeCssValue(value: string): boolean {
  let safe = true;
  const normalizedValue = decodeCssEscapes(value).replace(/\/\*[\s\S]*?\*\//g, '');

  valueParser(normalizedValue).walk((node) => {
    if (node.type === 'function' && FORBIDDEN_RESOURCE_FUNCTIONS.has(node.value.toLowerCase())) {
      safe = false;
      return false;
    }
    return safe;
  });

  return safe;
}

function assertSafeSelector(selector: string): void {
  selectorParser((selectors) => {
    selectors.walkPseudos((pseudo) => {
      if (FORBIDDEN_PSEUDOS.has(decodeCssEscapes(pseudo.value).toLowerCase())) {
        throw new Error(`Global stylesheet selector is not allowed: ${pseudo.value}`);
      }
    });
  }).processSync(selector);
}

export function sanitizeStyleSheet(cssText: string): string {
  const stylesheet = postcss.parse(cssText);

  stylesheet.walkAtRules((rule) => {
    if (FORBIDDEN_AT_RULES.has(rule.name.toLowerCase())) {
      throw new Error(`Global stylesheet at-rule is not allowed: @${rule.name}`);
    }
    if (rule.name.toLowerCase() === 'scope') assertSafeSelector(rule.params);
  });

  stylesheet.walkRules((rule) => assertSafeSelector(rule.selector));

  stylesheet.walkDecls((declaration) => {
    if (!isSafeCssValue(declaration.value)) {
      throw new Error(`Global stylesheet resource value is not allowed: ${declaration.prop}`);
    }
  });

  return stylesheet.toString();
}
