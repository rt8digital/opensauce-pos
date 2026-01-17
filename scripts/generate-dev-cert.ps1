# Generate Development Code Signing Certificate
# WARNING: This is for DEVELOPMENT ONLY - not suitable for production distribution

param(
    [Parameter(Mandatory=$false)]
    [string]$Password = "DevelopmentCert123!",
    
    [Parameter(Mandatory=$false)]
    [string]$OutputPath = ".\certs\code-signing-cert.pfx"
)

Write-Host "Generating Development Code Signing Certificate..." -ForegroundColor Green

# Create certs directory if it doesn't exist
if (!(Test-Path ".\certs")) {
    New-Item -ItemType Directory -Path ".\certs" | Out-Null
}

# Generate self-signed certificate
$cert = New-SelfSignedCertificate `
    -Type CodeSigningCert `
    -Subject "CN=OpenSauce POS Development" `
    -KeyUsage DigitalSignature `
    -FriendlyName "OpenSauce POS Development Code Signing" `
    -CertStoreLocation "Cert:\CurrentUser\My" `
    -NotAfter (Get-Date).AddYears(1) `
    -KeyExportPolicy Exportable

Write-Host "Certificate generated with thumbprint: $($cert.Thumbprint)" -ForegroundColor Yellow

# Export to PFX file
$securePassword = ConvertTo-SecureString -String $Password -Force -AsPlainText
Export-PfxCertificate -Cert $cert -FilePath $OutputPath -Password $securePassword | Out-Null

Write-Host "Certificate exported to: $OutputPath" -ForegroundColor Green
Write-Host "Password: $Password" -ForegroundColor Yellow
Write-Host ""
Write-Host "IMPORTANT: Set environment variable for builds:" -ForegroundColor Red
Write-Host "`$env:CODE_SIGNING_PASSWORD = '$Password'" -ForegroundColor Cyan
Write-Host ""
Write-Host "WARNING: This is a DEVELOPMENT certificate only!" -ForegroundColor Red
Write-Host "DO NOT use this for production distribution." -ForegroundColor Red