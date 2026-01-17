# Task Progress: Close All Unused Node Modules / Ports

## Objective
Clean up unused node modules and close unused ports to optimize system resources and reduce clutter.

## Steps
- [ ] 1. Analyze current dependencies and identify unused node modules
- [ ] 2. Check for ports currently in use by the system
- [ ] 3. Remove unused dependencies using npm prune/dead-code analysis
- [ ] 4. Stop any unnecessary running processes and free up ports
- [ ] 5. Clean up package-lock.json and node_modules
- [ ] 6. Verify cleanup was successful and system is still functional

## Commands to Use
- `npm ls --depth=0` - List installed packages
- `npx depcheck` - Check for unused dependencies (if available)
- `netstat -ano | findstr :3000` - Check for ports in use
- `npm prune` - Remove unused packages
- `npm run check` - Verify TypeScript compilation still works

## Recent Fixes

- **Fixed:** Error `ERR_PACKAGE_PATH_NOT_EXPORTED` caused by `drizzle-zod` importing `zod/v4` while `zod` was pinned to v3. Updated `zod` to `^4.0.0` and `zod-validation-error` to `^4.0.0`, then ran `npm install --legacy-peer-deps`. Dev server now starts successfully. Note: TypeScript errors unrelated to this fix were observed and need separate attention.

- **WhatsApp:** Improved the WhatsApp service: added quantity parsing for `order` commands, created textual receipts, emitted `whatsapp_order_placed` socket events, and added tests that cover menu/order/help and order quantity flows. All WhatsApp bot tests now pass.
