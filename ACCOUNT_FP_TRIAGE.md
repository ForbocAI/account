# Account FP/RTK Conformance Triage

The following files were flagged during the initial run of `check-fp-conformance.sh` and `check-rtk-conformance.sh`. This file serves as the inventory for follow-up cleanup PRs.

## RTK Conformance Violations

- **Source files over 300 lines:**
  - `src/generated/prisma/index.d.ts` (5838 lines)
  - `src/generated/prisma/runtime/client.d.ts` (3330 lines)
  *(Note: these are generated Prisma client files and should likely be ignored by the script).*

## FP Conformance Violations (Warnings / Fails)

- `src/app/api/auth/login/route.ts`
  - [warn] raw if statements found: 3
- `src/app/api/auth/me/route.ts`
  - [warn] raw if statements found: 2
- `src/app/api/auth/signup/route.ts`
  - [warn] raw if statements found: 4
- `src/app/api/billing/portal/route.ts`
  - [warn] raw if statements found: 3
- `src/app/api/billing/route.ts`
  - [warn] raw if statements found: 8
- `src/app/api/keys/[id]/route.ts`
  - [warn] raw if statements found: 3
- `src/app/api/keys/route.ts`
  - [warn] raw if statements found: 3
- `src/app/api/webhooks/stripe/route.ts`
  - [fail] switch statements found: 1
  - [warn] raw if statements found: 4
- `src/generated/prisma/index.d.ts`
  - [fail] Class-based state/behavior found: 4
- `src/generated/prisma/runtime/client.d.ts`
  - [fail] Class-based state/behavior found: 5
- `src/lib/auth.ts`
  - [warn] raw if statements found: 4
- `src/lib/db.ts`
  - [warn] raw if statements found: 2
- `src/lib/stripe.ts`
  - [warn] raw if statements found: 1
- `src/middleware.ts`
  - [warn] raw if statements found: 3
- `src/store/index.ts`
  - [warn] raw if statements found: 1
- `src/app/billing/page.tsx`
  - [warn] raw if statements found: 3
- `src/app/keys/page.tsx`
  - [warn] raw if statements found: 3
- `src/app/page.tsx`
  - [warn] array push() accumulation found: 1
- `src/app/signup/page.tsx`
  - [warn] raw if statements found: 2
  - [warn] array push() accumulation found: 1
- `src/components/vengeance/Header.tsx`
  - [warn] array push() accumulation found: 1

*Note: There are also widespread warnings about missing FP-core imports and primitive usage across most files, which should be addressed as part of the broader functional programming migration.*
