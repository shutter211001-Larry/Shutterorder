# Kitchenasty Project Rules

## 1. i18n Sync Requirement
**Trigger**: When adding or modifying translation keys (e.g., in `zh-TW.json`).
**Rule**: This project supports 13 languages. Whenever you add or update translation keys for any feature, you MUST ensure that all corresponding keys are added to ALL 13 language files (`en.json`, `es.json`, `fr.json`, `de.json`, `it.json`, `ja.json`, `ko.json`, `pt.json`, `th.json`, `tl.json`, `vi.json`, `id.json`, `zh-TW.json`) to keep the i18n system fully synced.

## 2. Prisma Migration Requirement
**Trigger**: When making any changes to the Prisma schema (`schema.prisma` or `shutter-erp.prisma`).
**Rule**: Because this project is deployed remotely (e.g., on Railway) and relies on `npx prisma migrate deploy` during startup, you MUST generate a Prisma migration file whenever you modify the database schema. 
- Do NOT just run `npx prisma db push` without generating a migration file. 
- If you are operating in a non-interactive environment where `npx prisma migrate dev` fails, you must manually create a timestamped folder under `prisma/migrations` containing a `migration.sql` script with the exact SQL DDL statements for your changes, and mark it as resolved locally if necessary.
- CRITICAL: When writing manual `migration.sql` scripts, you MUST write idempotent SQL (e.g., `ALTER TABLE "table" ADD COLUMN IF NOT EXISTS "column" TEXT;`). This prevents `502 Bad Gateway` deployment crash loops on Railway if the remote database already contains the schema changes.

## 3. open-location-code Typings Workaround
**Trigger**: When using or implementing the \open-location-code\ library in TypeScript.
**Rule**: The \@types/open-location-code\ package incorrectly defines methods such as \isValid\, \isFull\, and \decode\ as \static\ methods. However, at runtime, these are instance methods on the prototype. To avoid TypeScript compilation errors (e.g., \Property 'isValid' does not exist on type 'OpenLocationCode'\), you MUST instantiate the class and cast it to \ ny\ before calling these methods.
- Correct usage: \const olc: any = new OpenLocationCode(); olc.isValid(code);\
- Incorrect usage: \OpenLocationCode.isValid(code);\ (Fails at runtime)
- Incorrect usage: \const olc = new OpenLocationCode(); olc.isValid(code);\ (Fails TS compilation)

## 4. Prisma Client Generation Requirement
**Trigger**: When modifying the Prisma schema.
**Rule**: In addition to generating a migration file, ALWAYS run `npx prisma generate` locally so the TypeScript compiler and IDE language server can recognize the new Prisma types (like new models or fields).

## 5. Zod Schema Sync Requirement
**Trigger**: When adding new fields to Prisma models that are updated via API endpoints (like `Location`).
**Rule**: You MUST also update the corresponding Zod validation schemas (e.g. `createLocationSchema`) in the relevant controller. If you forget to update the Zod schema, the new fields will be silently stripped from the request body by `.safeParse()`.

## 6. Express Route Mounting Requirement
**Trigger**: When creating a new API route file (e.g., `leave.routes.ts`).
**Rule**: You MUST remember to import and mount the new route file in `app.ts` (e.g. `app.use('/api/xxx', xxxRoutes)`). The route will not work until it is explicitly mounted in the Express app.

## 7. AdminFront API Client Generics Requirement
**Trigger**: When making API calls in the frontend (e.g., using `api.get`, `api.post` from `src/lib/api.ts`).
**Rule**: The custom API client in `adminfront` uses generics (e.g., `<T>`) and operates under strict TypeScript rules. If you do not provide a type argument, the response defaults to `unknown`, causing TS18046 build errors. You MUST always explicitly provide the expected generic type argument.
- **Example**: `api.get<{ data: any[] }>('/path').then(res => set(res.data))`
- **Important**: Unlike Axios, this custom client directly returns the JSON payload. Do NOT access `res.data.data` unless the server actually deeply nests the data. If the server sends `{ success: true, data: [...] }`, the generic type should be `<{ success?: boolean, data: T }>` and you access the array via `res.data`.
