"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

export interface SavedProposal {
  id: string;
  title: string;
  ownerEntity: string;
  text: string;
  savedAt: string;
}

interface ProposalsStoreValue {
  proposals: SavedProposal[];
  addProposal: (data: Omit<SavedProposal, "id" | "savedAt">) => void;
  deleteProposal: (id: string) => void;
}

const STORAGE_KEY = "mudrik_proposals_archive_v1";

const ProposalsStoreContext = createContext<ProposalsStoreValue>({
  proposals: [],
  addProposal: () => {},
  deleteProposal: () => {},
});

export function ProposalsStoreProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [proposals, setProposals] = useState<SavedProposal[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setProposals(JSON.parse(raw) as SavedProposal[]);
    } catch {
      // localStorage unavailable or parse error — start empty
    }
    setHydrated(true);
  }, []);

  const addProposal = useCallback(
    (data: Omit<SavedProposal, "id" | "savedAt">) => {
      const entry: SavedProposal = {
        ...data,
        id: crypto.randomUUID(),
        savedAt: new Date().toISOString(),
      };
      setProposals((prev) => {
        const next = [entry, ...prev];
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        } catch {}
        return next;
      });
    },
    [],
  );

  const deleteProposal = useCallback((id: string) => {
    setProposals((prev) => {
      const next = prev.filter((p) => p.id !== id);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });
  }, []);

  // Avoid hydration mismatch — render children only once localStorage is read
  if (!hydrated) return <>{children}</>;

  return (
    <ProposalsStoreContext.Provider
      value={{ proposals, addProposal, deleteProposal }}
    >
      {children}
    </ProposalsStoreContext.Provider>
  );
}

export function useProposalsStore(): ProposalsStoreValue {
  return useContext(ProposalsStoreContext);
}
