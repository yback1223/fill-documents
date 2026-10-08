# Changelog

English · [한국어](CHANGELOG.ko.md)

## 0.2.2 — 2026-10-08

- Remove payment-related wording from English and Korean listing descriptions and the plugin listing README.
- Use `yback` as the requested developer display name in the package. OpenAI's directory may override it with the selected verified identity; this change does not establish a new verified identity.
- Add a package check against pricing and promotion wording in listing descriptions. Keep the review-only commerce declaration accurate.
- Document-processing behavior is unchanged from 0.2.1.

## 0.2.1 — 2026-10-08

- Make English the default for listing text, suggested prompts, public README, privacy, terms and support pages.
- Retain the Korean marketplace translation and provide linked Korean documentation.
- Keep document processing and existing format limitations unchanged from 0.2.0.

## 0.2.0 — 2026-10-08

An early release with controlled long-content handling and a whole-document review workflow.

- The skill inventories and fills every applicable writing area in the body, tables, annexes and appendices unless the user narrows the scope. Fictional examples use one consistent scenario and one result per requested format.
- Distinguish CLI field filling from whole-document completion. Check coverage inventories against the prepared-copy hash and do not mark unresolved areas complete.
- Add long-content flow for supported HWP, HWPX, DOCX and PDF structures. HWPX repeated rows and PDF continuation require a layout profile tied to the source template.
- Preserve DOCX tab stops instead of treating tab-stop declarations as text tabs.
- Ship the same runtime, 16 templates and Korean font in the Claude Code plugin, Codex plugin and standalone skill. The tool is free, with no in-product payments.

### Limitations

Automatic discovery of arbitrary blanks, general rewriting of completed documents and general targeted editing are not implemented. Scanned PDFs and normal PDF body editing are unsupported. Reviewed examples made with document-specific preparation do not establish those general capabilities. Native Hancom Office and Microsoft Word display, editing and printing have not been verified.

Passing automated checks provides evidence within the supported scope; it does not prove lossless editing of every document or official marketplace approval.

## 0.1.0 — 2026-10-08

Initial release of explicit-field filling for HWP, HWPX, DOCX and PDF, with 16 templates, local template registration, original-file preservation and local execution.
