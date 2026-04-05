import { HaproxyParser } from '../../server/src/parser/parser';
import { ValidationProvider } from '../../server/src/validation/validator';
import { VersionRegistry } from '../../server/src/registry/versionRegistry';
import { DiagnosticSeverity } from '../__mocks__/vscode-languageserver';

const parser = new HaproxyParser();
const registry = new VersionRegistry();

function validate(text: string, version = '3.1') {
  const doc = parser.parse(text, 'test://validate');
  const validator = new ValidationProvider(registry, version);
  return validator.validate(doc);
}

describe('ValidationProvider', () => {
  describe('unknown directives', () => {
    it('reports error for completely unknown directive', () => {
      const diags = validate('backend web\n    notadirective foo\n');
      expect(diags).toHaveLength(1);
      expect(diags[0]?.severity).toBe(DiagnosticSeverity.Error);
      expect(diags[0]?.message).toMatch(/unknown directive/i);
    });

    it('passes for known directive in correct section', () => {
      const diags = validate('backend web\n    balance roundrobin\n');
      expect(diags).toHaveLength(0);
    });
  });

  describe('section validation', () => {
    it('reports error for directive used in wrong section', () => {
      // use_backend is valid in frontend, not backend
      const diags = validate('backend web\n    use_backend other\n');
      const sectionErrors = diags.filter((d) => d.message.includes('not valid in'));
      expect(sectionErrors.length).toBeGreaterThan(0);
    });

    it('allows directive in all its valid sections', () => {
      const configs = [
        'defaults\n    balance roundrobin\n',
        'backend web\n    balance roundrobin\n',
        'listen stats\n    balance roundrobin\n',
      ];
      for (const cfg of configs) {
        const diags = validate(cfg);
        const balanceDiags = diags.filter((d) => d.message.includes('balance'));
        expect(balanceDiags).toHaveLength(0);
      }
    });
  });

  describe('HAProxy 2.4 removed directives', () => {
    it('reports error for reqrep in 2.4 (removed)', () => {
      const diags = validate(
        'frontend http-in\n    mode http\n    reqrep ^Host:\\ (.*)\\.test Host:\\ \\1.prod\n',
        '2.4'
      );
      const reqrepErrors = diags.filter((d) => d.message.includes('reqrep'));
      expect(reqrepErrors.length).toBeGreaterThan(0);
      expect(reqrepErrors[0]?.severity).toBe(DiagnosticSeverity.Error);
    });

    it('reports error for rsprep in 2.4 (removed)', () => {
      const diags = validate('backend web\n    mode http\n    rsprep ^X-Powered-By:\\ .* X-Powered-By:\\ HAProxy\n', '2.4');
      const rsprepErrors = diags.filter((d) => d.message.includes('rsprep'));
      expect(rsprepErrors.length).toBeGreaterThan(0);
    });
  });

  describe('mode compatibility', () => {
    it('reports error for http-only directive in tcp mode section', () => {
      const text = [
        'frontend tcp-in',
        '    mode tcp',
        '    http-request set-header X-Test value',
      ].join('\n');
      const diags = validate(text);
      const modeErrors = diags.filter((d) => d.message.includes('HTTP mode'));
      expect(modeErrors.length).toBeGreaterThan(0);
    });

    it('allows http-request in http mode section', () => {
      const text = [
        'frontend http-in',
        '    mode http',
        '    http-request set-header X-Test value',
      ].join('\n');
      const diags = validate(text);
      const modeErrors = diags.filter((d) => d.message.includes('HTTP mode'));
      expect(modeErrors).toHaveLength(0);
    });
  });

  describe('parse errors surface as diagnostics', () => {
    it('surfaces parse error for directive outside section', () => {
      const diags = validate('daemon\n');
      expect(diags).toHaveLength(1);
      expect(diags[0]?.severity).toBe(DiagnosticSeverity.Error);
      expect(diags[0]?.message).toMatch(/outside of any section/);
    });
  });

  describe('max diagnostics cap', () => {
    it('returns at most 100 diagnostics', () => {
      const lines = ['backend web'];
      for (let i = 0; i < 200; i++) {
        lines.push(`    unknowndirective${i} value`);
      }
      const diags = validate(lines.join('\n'));
      expect(diags.length).toBeLessThanOrEqual(100);
    });
  });

  describe('version fallback', () => {
    it('falls back to nearest lower version for unknown version string', () => {
      // 3.5 is unknown — should resolve to 3.1 (nearest lower)
      const diags = validate('backend web\n    balance roundrobin\n', '3.5');
      expect(diags).toHaveLength(0);
    });
  });
});
