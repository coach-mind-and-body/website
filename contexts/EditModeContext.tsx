import { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface EditModeContextType {
  isEditMode: boolean;
  setIsEditMode: (v: boolean) => void;
  page: string;
  // Track pending draft keys so Publish button knows there are changes
  dirtyKeys: Set<string>;
  markDirty: (key: string) => void;
  clearDirty: () => void;
}

const EditModeContext = createContext<EditModeContextType>({
  isEditMode: false,
  setIsEditMode: () => {},
  page: "",
  dirtyKeys: new Set(),
  markDirty: () => {},
  clearDirty: () => {},
});

export function EditModeProvider({ page, children }: { page: string; children: ReactNode }) {
  const [isEditMode, setIsEditMode] = useState(false);
  const [dirtyKeys, setDirtyKeys] = useState<Set<string>>(new Set());

  // Listen for SET_EDIT_MODE messages from the admin iframe parent
  useEffect(() => {
    const handler = (event: MessageEvent<{ type: string; value?: boolean }>) => {
      if (event.data?.type === "SET_EDIT_MODE" && typeof event.data.value === "boolean") {
        setIsEditMode(event.data.value);
      }
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, []);

  const markDirty = (key: string) => {
    setDirtyKeys(prev => new Set(Array.from(prev).concat(key)));
    // Notify the admin iframe parent that there are unsaved changes
    if (window.parent !== window) {
      window.parent.postMessage({ type: "CONTENT_DIRTY" }, "*");
    }
  };

  const clearDirty = () => {
    setDirtyKeys(new Set());
  };

  return (
    <EditModeContext.Provider value={{ isEditMode, setIsEditMode, page, dirtyKeys, markDirty, clearDirty }}>
      {children}
    </EditModeContext.Provider>
  );
}

export function useEditMode() {
  return useContext(EditModeContext);
}
