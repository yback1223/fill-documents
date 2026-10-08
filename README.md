# Fill Documents

English · [한국어](README.ko.md)

**Choose a document template and fill it with your information.**

Fill Documents is a free, open-source tool by **yback**. The same skill works with Claude and Codex and includes HWP, HWPX, Word DOCX and PDF templates. You can also register supported templates for reuse. The local CLI needs no account, API key or separate server. Original code and templates are MIT licensed.

The skill's default workflow covers all applicable writing areas in the body, tables, annexes and appendices. Only the user's explicit exclusions narrow that scope. It asks for missing facts in real documents and uses a coherent, clearly fictional scenario when an example is requested. It delivers one reviewed example per requested format, clearly distinguished from the original.

> **Scope of the 0.2.2 early release:** The CLI fills explicit input fields. Automatic discovery of arbitrary blanks, general rewriting of completed documents and general targeted editing are not implemented. Areas outside supported fields need document-specific preparation, editing and review. Whole-document instructions do not guarantee automatic completion of every attachment.

[Download the skill or plugin ZIP](https://github.com/yback1223/fill-documents/releases) · [Release notes](CHANGELOG.md)

## Included templates

Letters, reports, meeting minutes and applications are available in all four formats: 16 templates in total. These are original general-purpose forms, not official forms approved by an institution. Each folder contains a blank template, field definitions and fictional example values.

| Document | Template ID prefix |
| --- | --- |
| Official letter | `official-letter` |
| Report | `report` |
| Meeting minutes | `meeting-minutes` |
| Application | `application` |

Append `-hwp`, `-hwpx`, `-docx` or `-pdf`, for example `report-hwpx`. The bundled templates and sample document content are in Korean.

[Blank templates](plugins/fill-documents/skills/fill-documents/assets/templates/) · [Skill](plugins/fill-documents/skills/fill-documents/SKILL.md) · [Support](SUPPORT.md)

## Installation

**Node.js 20 or later** is required. The repository and release ZIPs include the runtime, WASM engine and Korean font, so normal use does not require an npm install. Claude and Codex have their own account requirements and terms.

### Claude Code plugin

Run these commands in Claude Code:

```text
/plugin marketplace add yback1223/fill-documents
/plugin install fill-documents@fill-documents
```

Then ask, for example: “Use fill-documents to find a meeting-minutes template and fill it with the details below.” This installs from the project's own marketplace. It does not imply approval by Anthropic's official directory.

### Codex plugin

Run these commands in your terminal, then refresh plugins in Codex:

```sh
codex plugin marketplace add yback1223/fill-documents
codex plugin add fill-documents@fill-documents
```

Example: “Use `$fill-documents` to choose an official letter template and fill it with my information.” You can also make requests in Korean; English is the default listing language, not a restriction on document language.

### Standalone skill

Copy the entire [skill folder](plugins/fill-documents/skills/fill-documents/). Copying only `SKILL.md` omits the runtime and templates.

- Claude Code: `~/.claude/skills/fill-documents/`
- Codex: `~/.agents/skills/fill-documents/`

Install either the plugin or the standalone skill. `npm run build` creates both ZIPs in `dist/`.

## Use the CLI directly

Run from the repository root. Quote paths that contain spaces.

```sh
node plugins/fill-documents/skills/fill-documents/bin/fill-documents.mjs doctor
node plugins/fill-documents/skills/fill-documents/bin/fill-documents.mjs templates list
node plugins/fill-documents/skills/fill-documents/bin/fill-documents.mjs templates show report-docx
```

Check field names and types, then prepare a UTF-8 JSON file. All discovered fields are required; do not invent missing facts. This example uses the bundled **fictional values**:

```sh
node plugins/fill-documents/skills/fill-documents/bin/fill-documents.mjs fill report-docx --data plugins/fill-documents/skills/fill-documents/assets/templates/report-docx/example-data.json --output report-example.docx
```

Inspect your own supported template or register it in the local library:

```sh
node plugins/fill-documents/skills/fill-documents/bin/fill-documents.mjs inspect my-template.hwpx
node plugins/fill-documents/skills/fill-documents/bin/fill-documents.mjs templates register my-template.hwpx --id my-report --title "My report"
node plugins/fill-documents/skills/fill-documents/bin/fill-documents.mjs fill my-report --data values.json --output completed.hwpx
```

The CLI preserves the original and refuses to overwrite an existing output. Create the output directory first. Its JSON result includes paths, hashes, applied fields, structural checks, layout handling and warnings, but does not log input body text. `--dry-run` builds and validates the candidate in memory without writing the output. It does not guarantee viewer layout or a later successful file write.

`ok: true` with `operation: "field-fill"` means field filling succeeded. The `inspect` field list is not a whole-document inventory, and `validate` checks structure only. Passing `--coverage coverage.json` to `inspect` or `fill` checks a prepared-copy-bound inventory against discovered fields. Missing or unresolved coverage yields `completion.status: "incomplete"`; consistent declarations yield `"requires-review"`. The CLI always reports `fullDocumentComplete: false` because it does not inspect or visually review every page. The skill must continue remaining writing and final review. See the [completion and review workflow](plugins/fill-documents/skills/fill-documents/references/full-document-completion.md).

For content that needs to extend a document, use `--overflow flow`:

```sh
node plugins/fill-documents/skills/fill-documents/bin/fill-documents.mjs fill my-template.hwpx --data values.json --output long-report.hwpx --overflow flow
```

DOCX turns input line breaks into paragraphs. Supported HWP body paragraphs retain their item formatting when reflowed. HWPX repeated records use an explicit row profile and an array of values. PDF fills the original field first, then continues on copies of the original form using an explicit profile. HWPX repeated rows and PDF continuation require `--layout-profile profile.json`. The CLI does not shrink text or put overflow into unrelated business rows. The default `preserve` policy retains the existing layout policy. If safe extension cannot be established, the CLI returns an error without creating the output. See [format boundaries](plugins/fill-documents/skills/fill-documents/references/formats.md).

## Supported formats

| Format | Input mechanism | Main limits |
| --- | --- | --- |
| HWP 5.x | Unique `{{field_name}}` in top-level body paragraphs | Flow preserves a mixed-style fixed prefix; the placeholder and following text must use one character style. Fields in tables or objects and repeated fields are rejected. |
| HWPX | `{{field_name}}` and supported native fields within one paragraph | Non-target ZIP content is retained. Line-layout caches are removed from changed paragraphs. Existing previews are not refreshed. |
| DOCX | `{{field_name}}`, including split runs and repeated fields | Text fields in the body, headers, footers, footnotes and endnotes. Expressions, loops, raw XML and macros are excluded. |
| PDF | AcroForm text fields and checkboxes | Overflow requires an explicit continuation profile. Empty signature fields are retained. Signed documents, scanned or normal body editing, XFA, encryption, executable actions and complex fields are excluded. |

Legacy Word `.doc`, spreadsheets, slides and OCR are outside this release. Automated structural checks do not establish native Hancom Office or Microsoft Word layout fidelity or compatibility with every OS. Open the result in the intended application. See the [format guide](plugins/fill-documents/skills/fill-documents/references/formats.md) for preparation and recovery.

## Development and validation

```sh
npm run setup
npm test
npm run build
npm run validate
```

The runtime bundle is a tracked distribution artifact. Rebuild it after source changes. After changing a template generator, run the relevant `scripts/generate-*-templates.mjs` from the skill folder and verify template hashes and examples. Never commit user documents or user value files.

[Requirements](docs/development/brief.md) · [Architecture](docs/development/architecture.md) · [Verification](docs/development/verification.md) · [Long-content checks](docs/development/long-content-verification.md) · [Layout checks](docs/development/layout-repair-verification.md) · [Directory submission status](docs/distribution.md)

## License and data

Original code and templates use the [MIT license](LICENSE). Third-party engines and fonts retain their [original licenses and attribution](plugins/fill-documents/skills/fill-documents/THIRD_PARTY_NOTICES.md); they are not presented as yback's work.

[Privacy and file handling](PRIVACY.md) · [Terms](TERMS.md) · [Support](SUPPORT.md)
