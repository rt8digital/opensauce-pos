!include "MUI2.nsh"

;--------------------------------
; General

!define APPNAME "OpenSauce POS"
!define COMPANYNAME "OpenSauce"
!define DESCRIPTION "Point of Sale System"

; Define installer name
Name "${APPNAME}"
OutFile "OpenSauce-POS-Setup.exe"

; Set compression
SetCompressor lzma

; Request application privileges for Windows Vista
RequestExecutionLevel admin

;--------------------------------
; Variables

Var StartMenuFolder

;--------------------------------
; Interface Settings

!define MUI_ABORTWARNING

;--------------------------------
; Pages

!insertmacro MUI_PAGE_WELCOME
;!insertmacro MUI_PAGE_LICENSE "..\LICENSE"
!insertmacro MUI_PAGE_DIRECTORY
!insertmacro MUI_PAGE_INSTFILES
!insertmacro MUI_PAGE_FINISH

!insertmacro MUI_UNPAGE_CONFIRM
!insertmacro MUI_UNPAGE_INSTFILES

;--------------------------------
; Languages

!insertmacro MUI_LANGUAGE "English"

;--------------------------------
; Installer Sections

Section "OpenSauce POS" SEC01
    SetOutPath "$INSTDIR"
    
    ; Add files
    File /r "win-unpacked\*"
    
    ; Store installation folder
    WriteRegStr HKCU "Software\${COMPANYNAME}\${APPNAME}" "" $INSTDIR
    
    ; Create uninstaller
    WriteUninstaller "$INSTDIR\Uninstall.exe"
    
    ; Create shortcuts
    CreateDirectory "$SMPROGRAMS\${APPNAME}"
    CreateShortCut "$SMPROGRAMS\${APPNAME}\${APPNAME}.lnk" "$INSTDIR\electron.exe"
    CreateShortCut "$SMPROGRAMS\${APPNAME}\Uninstall.lnk" "$INSTDIR\Uninstall.exe"
    
    ; Associate .pos files
    WriteRegStr HKCR ".pos" "" "${APPNAME}"
    WriteRegStr HKCR "${APPNAME}" "" "POS Document"
    WriteRegStr HKCR "${APPNAME}\DefaultIcon" "" "$INSTDIR\electron.exe,0"
    WriteRegStr HKCR "${APPNAME}\shell\open\command" "" '"$INSTDIR\electron.exe" "%1"'
SectionEnd

;--------------------------------
; Uninstaller Section

Section "Uninstall"
    ; Remove files
    RMDir /r "$INSTDIR"
    
    ; Remove shortcuts
    Delete "$SMPROGRAMS\${APPNAME}\${APPNAME}.lnk"
    Delete "$SMPROGRAMS\${APPNAME}\Uninstall.lnk"
    RMDir "$SMPROGRAMS\${APPNAME}"
    
    ; Remove registry keys
    DeleteRegKey HKCU "Software\${COMPANYNAME}\${APPNAME}"
    DeleteRegKey HKCR ".pos"
    DeleteRegKey HKCR "${APPNAME}"
SectionEnd