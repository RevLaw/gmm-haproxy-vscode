/** Minimal mock of vscode-languageserver-textdocument for unit tests. */

export class TextDocument {
  static create(uri: string, languageId: string, version: number, content: string): TextDocument {
    return new TextDocument(uri, languageId, version, content);
  }

  private constructor(
    public readonly uri: string,
    public readonly languageId: string,
    public readonly version: number,
    private readonly content: string
  ) {}

  getText(): string {
    return this.content;
  }

  get lineCount(): number {
    return this.content.split('\n').length;
  }
}
