# Code Signing Certificate

This directory should contain your code signing certificate file.

## Required File:
- `code-signing-cert.pfx` - Your Windows code signing certificate

## Setup Instructions:
1. Obtain a code signing certificate from a trusted CA (DigiCert, Sectigo, etc.)
2. Export the certificate as PFX format with private key
3. Place the file here as `code-signing-cert.pfx`
4. Set environment variable: `CODE_SIGNING_PASSWORD` with your certificate password

## For Development (Self-Signed):
If you need a temporary certificate for development, run:
```powershell
# From project root in PowerShell
.\scripts\generate-dev-cert.ps1
```

## Security Notice:
- Never commit certificate files to version control
- Keep certificate password secure
- Use proper certificate management for production