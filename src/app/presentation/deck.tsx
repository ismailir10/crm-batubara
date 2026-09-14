"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Maximize2,
  Minimize2,
  Printer,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { SLIDES } from "./slides";

/**
 * 16:9 deck with keyboard navigation, fullscreen, and a print mode that emits
 * one slide per page (specification §18).
 *
 * Slides are scaled with a CSS transform from a fixed 1280×720 design size, so
 * the layout is identical on a laptop and on a projector — no reflow surprises
 * halfway through a presentation.
 */

const SLIDE_WIDTH = 1280;
const SLIDE_HEIGHT = 720;

export function Deck() {
  const [index, setIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [scale, setScale] = useState(1);
  const stageRef = useRef<HTMLDivElement>(null);

  const next = useCallback(() => {
    setIndex((current) => Math.min(current + 1, SLIDES.length - 1));
  }, []);
  const previous = useCallback(() => {
    setIndex((current) => Math.max(current - 1, 0));
  }, []);

  // Scale the fixed-size slide to fit whatever viewport it is shown on.
  useEffect(() => {
    function fit() {
      const stage = stageRef.current;
      if (!stage) return;
      const { width, height } = stage.getBoundingClientRect();
      setScale(Math.min(width / SLIDE_WIDTH, height / SLIDE_HEIGHT));
    }
    fit();
    window.addEventListener("resize", fit);
    return () => window.removeEventListener("resize", fit);
  }, []);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      switch (event.key) {
        case "ArrowRight":
        case "ArrowDown":
        case "PageDown":
        case " ":
          event.preventDefault();
          next();
          break;
        case "ArrowLeft":
        case "ArrowUp":
        case "PageUp":
          event.preventDefault();
          previous();
          break;
        case "Home":
          event.preventDefault();
          setIndex(0);
          break;
        case "End":
          event.preventDefault();
          setIndex(SLIDES.length - 1);
          break;
        case "f":
        case "F":
          event.preventDefault();
          void toggleFullscreen();
          break;
        default:
          break;
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [next, previous]);

  useEffect(() => {
    function onFullscreenChange() {
      setIsFullscreen(Boolean(document.fullscreenElement));
    }
    document.addEventListener("fullscreenchange", onFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", onFullscreenChange);
  }, []);

  async function toggleFullscreen() {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else {
        await document.documentElement.requestFullscreen();
      }
    } catch {
      // Fullscreen can be refused by the browser; navigation still works.
    }
  }

  const slide = SLIDES[index];

  return (
    <div className="flex h-screen flex-col bg-ink-100">
      {/* Screen view: one slide at a time, scaled to fit. */}
      <div ref={stageRef} className="no-print relative flex min-h-0 flex-1 items-center justify-center p-4">
        <div
          className="overflow-hidden rounded-lg bg-white shadow-[var(--shadow-raised)]"
          style={{
            width: SLIDE_WIDTH,
            height: SLIDE_HEIGHT,
            transform: `scale(${scale})`,
            transformOrigin: "center",
          }}
        >
          <div className="h-full w-full">{slide.render()}</div>
        </div>
      </div>

      {/* Controls */}
      <div className="no-print flex items-center justify-between gap-4 border-t border-ink-200/70 bg-white px-4 py-2.5">
        <div className="flex min-w-0 items-center gap-3">
          <span className="tnum text-[13px] font-semibold text-ink-900">
            {index + 1} / {SLIDES.length}
          </span>
          <span className="truncate text-[13px] text-ink-500">{slide.title}</span>
        </div>

        <div className="flex items-center gap-1.5">
          {SLIDES.map((item, itemIndex) => (
            <button
              key={item.id}
              type="button"
              aria-label={`Slide ${itemIndex + 1}: ${item.title}`}
              aria-current={itemIndex === index ? "true" : undefined}
              onClick={() => setIndex(itemIndex)}
              className={cn(
                "h-1.5 rounded-full transition-all",
                itemIndex === index ? "w-6 bg-brand-500" : "w-1.5 bg-ink-300 hover:bg-ink-400"
              )}
            />
          ))}
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={previous}
            disabled={index === 0}
            aria-label="Slide sebelumnya"
            className="flex size-8 items-center justify-center rounded-md text-ink-600 hover:bg-ink-100 disabled:opacity-40"
          >
            <ChevronLeft className="size-4" />
          </button>
          <button
            type="button"
            onClick={next}
            disabled={index === SLIDES.length - 1}
            aria-label="Slide berikutnya"
            className="flex size-8 items-center justify-center rounded-md text-ink-600 hover:bg-ink-100 disabled:opacity-40"
          >
            <ChevronRight className="size-4" />
          </button>
          <button
            type="button"
            onClick={() => void toggleFullscreen()}
            aria-label={isFullscreen ? "Keluar layar penuh" : "Layar penuh"}
            title="Layar penuh (F)"
            className="flex size-8 items-center justify-center rounded-md text-ink-600 hover:bg-ink-100"
          >
            {isFullscreen ? <Minimize2 className="size-4" /> : <Maximize2 className="size-4" />}
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            aria-label="Cetak atau simpan sebagai PDF"
            title="Cetak / PDF"
            className="flex size-8 items-center justify-center rounded-md text-ink-600 hover:bg-ink-100"
          >
            <Printer className="size-4" />
          </button>
          <Link
            href="/"
            title="Buka aplikasi"
            className="ml-1 flex h-8 items-center gap-1.5 rounded-md px-2.5 text-[13px] font-medium text-brand-600 hover:bg-brand-50"
          >
            <ExternalLink className="size-3.5" />
            Aplikasi
          </Link>
        </div>
      </div>

      {/*
        Print view: every slide, one per page. Hidden on screen, and hidden from
        assistive technology too — otherwise a screen reader announces all
        eleven slides a second time on top of the live one.
      */}
      <div className="hidden print:block" aria-hidden="true">
        {SLIDES.map((item) => (
          <div
            key={item.id}
            className="print-slide hidden"
            style={{ width: SLIDE_WIDTH, height: SLIDE_HEIGHT }}
          >
            <div className="h-full w-full">{item.render()}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
