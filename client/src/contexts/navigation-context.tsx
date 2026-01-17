import { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { useLocation } from 'wouter';
import { UnsavedChangesDialog } from '@/components/dialogs/unsaved-changes-dialog';

interface NavigationContextType {
  hasUnsavedChanges: boolean;
  setHasUnsavedChanges: (value: boolean) => void;
  currentPath: string;
  showUnsavedChangesDialog: boolean;
  setShowUnsavedChangesDialog: (value: boolean) => void;
  handleSaveAndConfirm: () => void;
  handleDiscardAndLeave: () => void;
  registerSaveHandler: (handler: () => Promise<void> | void) => void;
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

export function NavigationProvider({ children }: { children: ReactNode }) {
  const [location, setLocation] = useLocation();
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showUnsavedChangesDialog, setShowUnsavedChangesDialog] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<string | null>(null);

  // Store the previous path to detect navigation
  const [previousPath, setPreviousPath] = useState(location);
  const [currentPath, setCurrentPath] = useState(location);

  const [saveHandler, setSaveHandler] = useState<(() => Promise<void> | void) | null>(null);

  const registerSaveHandler = useCallback((handler: () => Promise<void> | void) => {
    setSaveHandler(() => handler);
  }, []);

  // Handle save and confirm action
  const handleSaveAndConfirm = async () => {
    if (saveHandler) {
      await saveHandler();
    }
    setShowUnsavedChangesDialog(false);
    setHasUnsavedChanges(false);
    if (pendingNavigation) {
      setLocation(pendingNavigation);
      setPendingNavigation(null);
    }
  };

  // Handle discard and leave action
  const handleDiscardAndLeave = () => {
    setShowUnsavedChangesDialog(false);
    setHasUnsavedChanges(false);
    setPendingNavigation(null);
    if (pendingNavigation) {
      setLocation(pendingNavigation);
    }
  };

  // Check for navigation and warn about unsaved changes when leaving settings
  useEffect(() => {
    if (previousPath === '/settings' && location !== '/settings' && hasUnsavedChanges) {
      // Prevent the navigation and show our custom dialog
      setPendingNavigation(location);
      setShowUnsavedChangesDialog(true);

      // Revert to previous location temporarily
      setLocation(previousPath);
    } else {
      setPreviousPath(location);
      setCurrentPath(location);
    }
  }, [location, previousPath, hasUnsavedChanges, setLocation]);

  return (
    <>
      <NavigationContext.Provider value={{
        hasUnsavedChanges,
        setHasUnsavedChanges,
        currentPath,
        showUnsavedChangesDialog,
        setShowUnsavedChangesDialog,
        handleSaveAndConfirm,
        handleDiscardAndLeave,
        registerSaveHandler
      }}>
        {children}
      </NavigationContext.Provider>

      <UnsavedChangesDialog
        open={showUnsavedChangesDialog}
        onOpenChange={setShowUnsavedChangesDialog}
        onSaveAndConfirm={handleSaveAndConfirm}
        onDiscardAndLeave={handleDiscardAndLeave}
      />
    </>
  );
}

export function useNavigation() {
  const context = useContext(NavigationContext);
  if (context === undefined) {
    throw new Error('useNavigation must be used within a NavigationProvider');
  }
  return context;
}