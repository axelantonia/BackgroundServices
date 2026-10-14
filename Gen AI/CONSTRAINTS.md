# Hard Constraints

- Do not change the technology stack unless implementation cannot meet a requirement otherwise; explain the need first.
- Do not add dependencies without a clear, documented reason and no suitable existing alternative.
- Do not use Prisma or another ORM; persist with SQLite and explicit, parameterized SQL through the existing repository layer.
- Keep SQLite access on the Node.js server; never import database modules into client components.
- Do not bypass an existing API or service layer, or put database/persistence logic in UI components.
- Do not duplicate existing components, validation, or data-access behavior.
- Do not expose credentials, tokens, personal data in logs, or internal error traces to users.
- Do not make unrelated refactors or modify unrelated behavior.
- Do not change public APIs, employee field contracts, or existing status semantics without explicit approval.
- Preserve existing architecture, naming, formatting, and folder conventions.
- Keep delete confirmation, input validation, and loading, empty, success, and error handling in the employee workflow.