import { useState } from "react"

export function useSlider<T>(
  items: T[] = [],
  visibleCount: number,
  itemWidth: number,
) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const maxIndex = Math.max(items.length - visibleCount, 0)
  const slideWidth = itemWidth

  const handlePrev = () => setCurrentIndex((prev) => Math.max(prev - 1, 0))
  const handleNext = () =>
    setCurrentIndex((prev) => Math.min(prev + 1, maxIndex))
  const translateX = currentIndex * slideWidth

  return {
    currentIndex,
    handlePrev,
    handleNext,
    translateX,
    maxIndex,
    isFirst: currentIndex === 0,
    isLast: currentIndex === maxIndex,
  }
}
