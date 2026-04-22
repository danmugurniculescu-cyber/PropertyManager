import { useState, useEffect } from "react";

const LS_KEY = "selectedProprietateId";

/**
 * Hook care persistă proprietatea selectată în localStorage.
 * Toate paginile care folosesc acest hook vor partaja aceeași selecție.
 *
 * @param {Array} proprietati - lista de proprietăți încărcată din API
 * @returns [proprietateId, setProprietateId]
 */
export function useProprietate(proprietati) {
  const [proprietateId, setProprietateIdState] = useState(
    () => localStorage.getItem(LS_KEY) || ""
  );

  // Când lista e încărcată, validează că ID-ul salvat există; altfel alege primul
  useEffect(() => {
    if (!proprietati || proprietati.length === 0) return;
    const saved = localStorage.getItem(LS_KEY);
    const exists = proprietati.some((p) => String(p.id) === saved);
    if (!exists) {
      const first = String(proprietati[0].id);
      localStorage.setItem(LS_KEY, first);
      setProprietateIdState(first);
    }
  }, [proprietati]);

  function setProprietateId(id) {
    const s = String(id);
    localStorage.setItem(LS_KEY, s);
    setProprietateIdState(s);
  }

  return [proprietateId, setProprietateId];
}
