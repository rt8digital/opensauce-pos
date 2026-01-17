# Code Signing Setup Guide

## Prerequisites

1. **Windows Code Signing Certificate** - You'll need a code signing certificate from a trusted CA
2. **Certificate Password** - Store securely (environment variable recommended)

## Certificate Setup

### Option 1: Purchase from Certificate Authority
- DigiCert, Sectigo, GlobalSign, or similar
- Export as PFX file with private key
- Place in `certs/code-signing-cert.pfx`

### Option 2: Self-Signed Certificate (Development Only)
```powershell
# Generate self-signed certificate (Windows PowerShell)
$cert = New-SelfSignedCertificate -Type CodeSigningCert -Subject "CN=OpenSauce POS" -KeyUsage DigitalSignature -FriendlyName "OpenSauce POS Code Signing" -CertStoreLocation "Cert:\CurrentUser\My"

# Export to PFX file
$password = ConvertTo-SecureString -String "your-password" -Force -AsPlainText
Export-PfxCertificate -Cert $cert -FilePath "certs/code-signing-cert.pfx" -Password $password
```

## Environment Variables

Set the certificate password as an environment variable:
```bash
# Windows CMD
set CODE_SIGNING_PASSWORD=your-certificate-password

# Windows PowerShell
$env:CODE_SIGNING_PASSWORD="your-certificate-password"

# Linux/Mac
export CODE_SIGNING_PASSWORD=your-certificate-password
```

## Build Commands

```bash
# Build with code signing
npm run build:electron:installer

# Build without code signing (for testing)
npm run build:electron:optimized
```

## Security Best Practices

1. **Never commit certificates** to version control
2. **Use strong passwords** for certificate files
3. **Store certificates securely** (encrypted storage recommended)
4. **Rotate certificates** before expiration
5. **Use CI/CD** for production builds to protect certificate access

## Troubleshooting

### Common Issues:
- **Certificate not found**: Check file path and permissions
- **Invalid password**: Verify CODE_SIGNING_PASSWORD environment variable
- **Signing failed**: Ensure certificate is valid and not expired

### Certificate Renewal:
1. Purchase new certificate from CA
2. Replace `certs/code-signing-cert.pfx` 
3. Update environment variables if needed
4. Test build process

## Alternative: Azure SignTool (Cloud-Based Signing)

For enterprise environments, consider using cloud-based signing services that don't require storing certificates locally.