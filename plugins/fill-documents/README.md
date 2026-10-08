# Fill Documents

English · [한국어](README.ko.md)

**Choose a document template and fill it with your information.**

Fill Documents is a free, open-source document filling skill by **yback**. It runs locally in Claude Code and Codex with Node.js 20 or later. Choose a template, provide the requested values, and receive a new document in the same format. The original template and existing output files are preserved.

It includes 16 Korean-language templates for letters, reports, meeting minutes and applications in HWP, HWPX, Word DOCX and PDF. These are original general-purpose templates, not official forms approved by an institution. Fictional example values are included. You can register your own templates with supported explicit fields for reuse.

Try: “Use fill-documents to find a meeting-minutes template and fill it with the details below.” The skill's default workflow inventories and fills all applicable writing areas, including the body, tables, annexes and appendices. It asks for missing facts instead of inventing them. Only explicit user exclusions narrow that scope. When requested, it provides one reviewed fictional example per format and clearly labels the original and example.

A successful CLI operation does not establish whole-document completion. `inspect` finds explicit fields only, and `--coverage` checks an inventory without replacing page-by-page content and visual review. Unresolved coverage is `incomplete`; consistent declarations are `requires-review`. The CLI always reports `fullDocumentComplete: false`. Unsupported areas remain in scope and require safe preparation or authorized document-specific editing. See the [completion workflow](skills/fill-documents/references/full-document-completion.md).

**0.2.1 limitations:** Automatic recognition of arbitrary blanks, general rewriting of completed documents and general targeted editing are not implemented. Unsupported areas require document-specific work and are not reported as complete.

## Supported formats

- HWP 5: unique text fields in supported top-level body paragraphs.
- HWPX: text tags and supported native fields within one paragraph.
- DOCX: text tags, including split runs and repeated fields.
- PDF: AcroForm text fields and checkboxes. Scanned documents and arbitrary PDF body editing are not supported.

The CLI rejects encryption, signed documents, executable actions, unsupported structures and inputs it cannot preserve safely. It does not guarantee lossless editing of every document. Review the result in the intended application. Native Hancom Office and Microsoft Word rendering has not been verified.

## Execution and data

The skill runs its bundled Node.js CLI to read local files and write new results. It includes executable JavaScript, a gzip-compressed HWP WASM engine, a Korean font and binary document templates. WASM is decompressed in memory; the tool does not download an external engine. Normal use needs no npm install, separate server or API key.

The local CLI does not upload documents, contact a service, run a package installer or send telemetry. Input values may contain personal data supplied by the user. Results and registered templates remain on the local filesystem until the user removes them. The host AI application's own data handling and account requirements still apply. There are no in-product payments.

Source code and original third-party licenses and attribution are included. Compressed engines, templates and large code files may require human review in a directory submission.

[Installation and usage](https://github.com/yback1223/fill-documents) · [Support](https://github.com/yback1223/fill-documents/blob/main/SUPPORT.md) · [Privacy and file handling](https://github.com/yback1223/fill-documents/blob/main/PRIVACY.md) · [Terms](https://github.com/yback1223/fill-documents/blob/main/TERMS.md)

Original code and templates are MIT licensed. See the [third-party notices](skills/fill-documents/THIRD_PARTY_NOTICES.md) for bundled components.
