import { useState, useEffect, useCallback } from "react";

// ----------------------------------------------------------------------

export function useCarouselAutoScroll(mainApi) {
  const [isPlaying, setIsPlaying] = useState(false);

  const onClickAutoplay = useCallback(
    (callback) => {
      const autoScroll = mainApi?.plugins()?.autoScroll;
      if (!autoScroll) return;

      const resetOrStop =
        autoScroll.options.stopOnInteraction === false
          ? autoScroll.reset
          : autoScroll.stop;

      resetOrStop();
      callback();
    },
    [mainApi],
  );

  const onTogglePlay = useCallback(() => {
    const autoScroll = mainApi?.plugins()?.autoScroll;
    if (!autoScroll) return;

    const playOrStop = autoScroll.isPlaying()
      ? autoScroll.stop
      : autoScroll.play;
    playOrStop();
  }, [mainApi]);

  useEffect(() => {
    const autoScroll = mainApi?.plugins()?.autoScroll;
    if (!autoScroll) return;

    // Schedule initial state update asynchronously
    const id = setTimeout(() => {
      setIsPlaying(autoScroll.isPlaying());
    }, 0);

    // Event handlers
    const playHandler = () => setIsPlaying(true);
    const stopHandler = () => setIsPlaying(false);
    const reInitHandler = () => setIsPlaying(false);

    mainApi
      .on("autoScroll:play", playHandler)
      .on("autoScroll:stop", stopHandler)
      .on("reInit", reInitHandler);

    // Cleanup
    return () => {
      clearTimeout(id);
      mainApi.off("autoScroll:play", playHandler);
      mainApi.off("autoScroll:stop", stopHandler);
      mainApi.off("reInit", reInitHandler);
    };
  }, [mainApi]);

  return { isPlaying, onTogglePlay, onClickAutoplay };
}
