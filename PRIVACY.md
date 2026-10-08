# Fill Documents privacy and file handling

English · [한국어](PRIVACY.ko.md)

Publisher: **yback**. Applies to the Fill Documents local CLI and skill, version 0.2.2.

The CLI reads user-selected documents and JSON values locally and writes a new result to the user-selected path. Registering a template stores a copy, field names and a file hash in the user's local library. The default location is `~/.local/share/fill-documents/templates` and can be changed.

Optional coverage inventories and layout profiles are also read locally. These files and review records may contain document locations or evidence provided by the user. The user manages and deletes them alongside the originals and results. The CLI does not transmit reference strings or open them as remote URLs.

The CLI has no service account, remote server, advertising, analytics telemetry, payment feature or document-upload feature. Document processing does not require internet communication. The publisher does not receive document content through the CLI. JSON results may include file paths, hashes, field names and validation results. Input JSON, output files and the local template library remain on the user's storage until the user deletes them. If temporary-file cleanup fails, the CLI reports the affected path in a warning.

When you chat with or attach a file to a host such as Claude or Codex, that host may process the content under its own privacy policy and account settings. This is separate from the CLI's local processing. GitHub processes requests and public content when you download the repository or post an issue there.

Do not post documents or personal data in public issues. See [Support](SUPPORT.md) for contact instructions. Changes to file handling will be accompanied by an updated notice and version.
