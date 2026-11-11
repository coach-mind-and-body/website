"use client";

import { useState } from "react";

export type LibraryPage = {
  id: number;
  fileName: string;
  fileUrl: string;
  mimeType?: string | null;
};

function isImage(page: LibraryPage): boolean {
  const mime = (page.mimeType || "").toLowerCase();
  if (mime.startsWith("image/")) return true;
  return /\.(png|jpe?g|webp|gif)$/i.test(page.fileName);
}

export function LibraryPager({ pages, title }: { pages: LibraryPage[]; title?: string }) {
  const [index, setIndex] = useState(0);
  if (pages.length === 0) return null;
  const page = pages[Math.min(index, pages.length - 1)];

  return (
    <div className="space-y-3">
      {title ? (
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-xl font-bold" style={{ fontFamily: "'Cormorant Garamond', serif", color: "#2d3b2d" }}>
            {title}
          </h2>
          <p className="text-sm font-semibold" style={{ color: "#8a9a8a" }}>
            Page {index + 1} of {pages.length}
          </p>
        </div>
      ) : null}
      <div className="overflow-x-auto snap-x snap-mandatory rounded-2xl bg-white" style={{ border: "1px solid #f0e8e4" }}>
        <div className="flex">
          {pages.map((item, itemIndex) => (
            <div key={item.id} className="min-w-full snap-center p-3">
              {isImage(item) ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={item.fileUrl} alt={item.fileName} className="w-full rounded-xl bg-[#faf5f5]" />
              ) : (
                <iframe title={item.fileName} src={item.fileUrl} className="h-[70vh] w-full rounded-xl bg-white" />
              )}
              <button type="button" className="sr-only" onClick={() => setIndex(itemIndex)}>
                Show {item.fileName}
              </button>
            </div>
          ))}
        </div>
      </div>
      {pages.length > 1 ? (
        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            className="min-h-12 rounded-full px-4 text-sm font-bold"
            style={{ background: "#fbeee9", color: "#2d3b2d" }}
            onClick={() => setIndex((current) => Math.max(0, current - 1))}
            disabled={index === 0}
          >
            Previous page
          </button>
          <p className="text-xs" style={{ color: "#8a9a8a" }}>
            Swipe sideways for the next page
          </p>
          <button
            type="button"
            className="min-h-12 rounded-full px-4 text-sm font-bold"
            style={{ background: "#2d3b2d", color: "white" }}
            onClick={() => setIndex((current) => Math.min(pages.length - 1, current + 1))}
            disabled={index >= pages.length - 1}
          >
            Next page
          </button>
        </div>
      ) : null}
    </div>
  );
}
