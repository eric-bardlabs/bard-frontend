import { useState, useMemo, useCallback } from "react";
import type { SplitRow } from "@/components/home/splitsTable";

export const useSplitsState = (initialSplits?: SplitRow[]) => {
  const [splitRows, setSplitRows] = useState<SplitRow[]>(
    initialSplits || [{ id: "", collaboratorName: "", collaboratorEmail: "", songwriting: "", publishing: "", master: "" }]
  );

  // Calculate totals
  const totals = useMemo(() => {
    const total = { songwriting: 0, publishing: 0, master: 0 };
    splitRows.forEach((split) => {
      total.songwriting += parseFloat(split.songwriting?.toString() || "0");
      total.publishing += parseFloat(split.publishing?.toString() || "0");
      total.master += parseFloat(split.master?.toString() || "0");
    });
    return total;
  }, [splitRows]);

  // Handle split row changes
  const handleSplitRowChange = useCallback((index: number, field: string, value: string | number | { id: string; name: string; email: string }) => {
    setSplitRows(prevRows => {
      const updatedRows = [...prevRows];
      if (field === "collaborator" && typeof value === "object") {
        // Handle collaborator selection
        updatedRows[index] = { 
          ...updatedRows[index], 
          id: value.id,
          collaboratorName: value.name,
          collaboratorEmail: value.email
        };
      } else {
        // Handle regular field updates
        updatedRows[index] = { ...updatedRows[index], [field]: value };
      }
      return updatedRows;
    });
  }, []);

  // Add new split row
  const addSplitRow = useCallback(() => {
    setSplitRows(prevRows => [...prevRows, { id: "", collaboratorName: "", collaboratorEmail: "", songwriting: "", publishing: "", master: "" }]);
  }, []);

  // Remove split row
  const removeSplitRow = useCallback((index: number) => {
    setSplitRows(prevRows => {
      const updatedRows = [...prevRows];
      updatedRows.splice(index, 1);
      return updatedRows;
    });
  }, []);

  // Reset splits with new data
  const resetSplits = useCallback((newSplits: SplitRow[]) => {
    setSplitRows(newSplits);
  }, []);

  return {
    splitRows,
    setSplitRows,
    totals,
    handleSplitRowChange,
    addSplitRow,
    removeSplitRow,
    resetSplits,
  };
};