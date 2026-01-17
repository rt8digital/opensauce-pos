!macro preInit
    # Force the default installation directory to C:\OpenSauce POS
    StrCpy $INSTDIR "C:\OpenSauce POS"
!macroend

!macro customInstall
    # Ensure the database directory exists and is writable
    CreateDirectory "$INSTDIR\database"
    # Setting permissions if possible (requires AccessControl plugin, which might not be there)
    # Using a standard NSIS way to ensure visibility/access if needed
!macroend
