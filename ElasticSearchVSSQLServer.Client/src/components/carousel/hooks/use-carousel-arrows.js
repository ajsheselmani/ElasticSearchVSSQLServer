import { useState, useEffect, useCallback } from "react";

// ----------------------------------------------------------------------

export const useCarouselArrows = (mainApi) => {
  const [disablePrev, setDisabledPrevBtn] = useState(true);

  const [disableNext, setDisabledNextBtn] = useState(true);

  const onClickPrev = useCallback(() => {
    if (!mainApi) return;
    mainApi.scrollPrev();
  }, [mainApi]);

  const onClickNext = useCallback(() => {
    if (!mainApi) return;
    mainApi.scrollNext();
  }, [mainApi]);

  const onSelect = useCallback((_mainApi) => {
    setDisabledPrevBtn(!_mainApi.canScrollPrev());
    setDisabledNextBtn(!_mainApi.canScrollNext());
  }, []);

  useEffect(() => {
    if (!mainApi) return;

    const id = setTimeout(() => {
      onSelect(mainApi);
    }, 0);

    mainApi.on("reInit", onSelect);
    mainApi.on("select", onSelect);

    return () => {
      clearTimeout(id);
      mainApi.off("reInit", onSelect);
      mainApi.off("select", onSelect);
    };
  }, [mainApi, onSelect]);

  return {
    disablePrev,
    disableNext,
    onClickPrev,
    onClickNext,
  };
};
