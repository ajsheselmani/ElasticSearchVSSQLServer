import { useState, useEffect, useCallback } from "react";

// ----------------------------------------------------------------------

export function useCarouselAutoPlay(mainApi) {
  const [isPlaying, setIsPlaying] = useState(false);

  const onClickAutoplay = useCallback(
    (callback) => {
      const autoplay = mainApi?.plugins()?.autoplay;
      if (!autoplay) return;

      const resetOrStop =
        autoplay.options.stopOnInteraction === false
          ? autoplay.reset
          : autoplay.stop;

      resetOrStop();
      callback();
    },
    [mainApi],
  );

  const onTogglePlay = useCallback(() => {
    const autoplay = mainApi?.plugins()?.autoplay;
    if (!autoplay) return;

    const playOrStop = autoplay.isPlaying() ? autoplay.stop : autoplay.play;
    playOrStop();
  }, [mainApi]);

  useEffect(() => {
    const autoplay = mainApi?.plugins()?.autoplay;
    if (!autoplay) return;

    const id = setTimeout(() => {
      setIsPlaying(autoplay.isPlaying());
    }, 0);

    const playHandler = () => setIsPlaying(true);
    const stopHandler = () => setIsPlaying(false);

    mainApi.on("autoplay:play", playHandler).on("autoplay:stop", stopHandler);

    return () => {
      clearTimeout(id);
      mainApi.off("autoplay:play", playHandler);
      mainApi.off("autoplay:stop", stopHandler);
    };
  }, [mainApi]);

  return { isPlaying, onTogglePlay, onClickAutoplay };
}
