import { useState, useEffect } from "react";

// TODO
export function useIsOpen(openTimeString = "2025-04-20T11:00:00+09:00") {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const openTime = new Date(openTimeString);
    const now = new Date();
    setIsOpen(now >= openTime);
  }, [openTimeString]);

  return isOpen;
}
