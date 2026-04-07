import useEmblaCarousel from "embla-carousel-react";
import { useState, useEffect, useCallback } from "react";

// ----------------------------------------------------------------------

export function useThumbs(mainApi, options) {
  const [thumbsRef, thumbsApi] = useEmblaCarousel({
    containScroll: "keepSnaps",
    dragFree: true,
    ...options,
  });

  const [selectedIndex, setSelectedIndex] = useState(0);

  const onClickThumb = useCallback(
    (index) => {
      if (!mainApi || !thumbsApi) return;
      mainApi.scrollTo(index);
    },
    [mainApi, thumbsApi],
  );

  const onSelect = useCallback(() => {
    if (!mainApi || !thumbsApi) return;
    setSelectedIndex(mainApi.selectedScrollSnap());
    thumbsApi.scrollTo(mainApi.selectedScrollSnap());
  }, [mainApi, thumbsApi, setSelectedIndex]);

  useEffect(() => {
    if (!mainApi) return;

    const id = setTimeout(() => {
      onSelect();
    }, 0);

    mainApi.on("select", onSelect);
    mainApi.on("reInit", onSelect);

    return () => {
      clearTimeout(id);
      mainApi.off("select", onSelect);
      mainApi.off("reInit", onSelect);
    };
  }, [mainApi, onSelect]);

  return {
    onClickThumb,
    thumbsRef,
    thumbsApi,
    selectedIndex,
  };
}
