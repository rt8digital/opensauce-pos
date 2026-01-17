# Packaging & Diagnostic Notes

1. Run dev:
   - npm run start
   - Or: npm run serve and set START_URL to your dev server.

2. For packaging (Desktop):
   - Use your preferred desktop packager and ensure the server folder is included in the packaged application.

3. WhatsApp session:
   - Persist session data in app.getPath('userData') rather than __dirname.
   - When packaged, app.getPath('userData') points to the correct writable dir for the OS.

4. Debugging:
   - If the app doesn't open, check logs in userData (app.getPath('userData')) and console logs.
   - Add a server health endpoint (GET /health) and verify it returns a 200 on start.

5. Diagnostics script:
   - Use scripts/diagnose.js to locate problematic patterns such as __dirname usage in renderer side or in code that must be writable.
   - Run: node scripts/diagnose.js
