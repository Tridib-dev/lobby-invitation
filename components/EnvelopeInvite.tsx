"use client";

import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import type { InvitePayload } from "@/src/types/invite";

type Stage = "closed" | "untie" | "flap" | "letter" | "done";

const W = 320;
const H = 220;

export default function EnvelopeInvite({ invite }: { invite: InvitePayload }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [stage, setStage] = useState<Stage>("closed");
  const reduceMotion = useReducedMotion();

  const close = () => {
    setModalOpen(false);
    setStage("closed");
  };

  const start = () => {
    if (stage !== "closed") return;
    setStage(reduceMotion ? "done" : "untie");
  };

  const when = new Date(invite.date).toLocaleString("en-IN", {
    dateStyle: "full",
    timeStyle: "short",
    timeZone: "Asia/Kolkata",
  });

  const untied = stage !== "closed";
  const flapOpen = stage === "flap" || stage === "letter" || stage === "done";

  return (
    <>
      <button
        onClick={() => setModalOpen(true)}
        className="rounded-full px-6 py-3 font-semibold text-black"
        style={{ background: invite.accent }}
      >
        Open your invitation
      </button>

      <AnimatePresence>
        {modalOpen && (
          <motion.div
            className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/80 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={close}
          >
            <div
              className="relative mt-44"
              style={{ width: W, height: H, perspective: 1000 }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* 1. inside back */}
              <div
                className="absolute inset-0 rounded-md shadow-2xl"
                style={{ background: invite.accent, filter: "brightness(0.7)", zIndex: 0 }}
              />

              {/* 2. the letter */}
              <motion.div
                className="absolute overflow-hidden rounded-lg bg-white p-5 text-center text-black shadow-xl"
                style={{ left: 20, top: 12, width: 280, height: 200, zIndex: stage === "done" ? 20 : 5 }}
                animate={{
                  y: stage === "letter" ? -150 : stage === "done" ? -175 : 0,
                  scale: stage === "done" ? 1.08 : 1,
                }}
                transition={{ type: "spring", stiffness: 70, damping: 16 }}
                onAnimationComplete={() => {
                  if (stage === "letter") setStage("done");
                }}
              >
                <p className="text-xs font-semibold" style={{ color: invite.accent }}>
                  {invite.guest ? `${invite.guest}, you're invited!` : "You're invited!"}
                </p>
                <h2 className="my-2 text-2xl font-bold leading-tight">{invite.title}</h2>
                <p className="text-xs">{when}</p>
                {invite.location && <p className="text-xs">{invite.location}</p>}
                {invite.note && <p className="mt-2 line-clamp-2 text-xs italic">{invite.note}</p>}
              </motion.div>

              {/* 3. front pocket */}
              <div
                className="absolute inset-0"
                style={{
                  background: invite.accent,
                  filter: "brightness(0.95)",
                  clipPath: "polygon(0 0, 50% 55%, 100% 0, 100% 100%, 0 100%)",
                  zIndex: 10,
                }}
              />

              {/* 4. the flap */}
              <motion.div
                className="absolute inset-x-0 top-0"
                style={{
                  height: H * 0.55,
                  background: invite.accent,
                  filter: "brightness(1.12)",
                  clipPath: "polygon(0 0, 100% 0, 50% 100%)",
                  transformOrigin: "top",
                }}
                initial={{ rotateX: 0, zIndex: 30 }}
                animate={{ rotateX: flapOpen ? 180 : 0, zIndex: flapOpen ? 2 : 30 }}
                transition={{
                  rotateX: { duration: 0.7, ease: "easeInOut" },
                  zIndex: { delay: 0.3, duration: 0 },
                }}
                onAnimationComplete={() => {
                  if (stage === "flap") setStage("letter");
                }}
              />

              {/* 5. ribbon halves */}
              <motion.div
                className="absolute left-0 h-4 bg-amber-300"
                style={{ top: H / 2 - 8, width: W / 2, zIndex: 40 }}
                animate={{ x: untied ? -W / 2 : 0, opacity: untied ? 0 : 1 }}
                transition={{ delay: 0.5, duration: 0.5 }}
              />
              <motion.div
                className="absolute right-0 h-4 bg-amber-300"
                style={{ top: H / 2 - 8, width: W / 2, zIndex: 40 }}
                animate={{ x: untied ? W / 2 : 0, opacity: untied ? 0 : 1 }}
                transition={{ delay: 0.5, duration: 0.5 }}
              />

              {/* 6. the knot */}
              <motion.button
                aria-label="Untie the ribbon to open the invitation"
                onClick={start}
                className="absolute"
                style={{ left: W / 2 - 22, top: H / 2 - 22, width: 44, height: 44, zIndex: 50 }}
                animate={
                  untied
                    ? {
                        y: [0, 0, 0, 280],
                        rotate: [0, -12, 12, 40],
                        scale: [1, 1.2, 1.2, 0.9],
                        opacity: [1, 1, 1, 0],
                      }
                    : { y: 0, rotate: 0, scale: 1, opacity: 1 }
                }
                transition={{ duration: 1.1, times: [0, 0.3, 0.55, 1], ease: "easeInOut" }}
                onAnimationComplete={() => {
                  if (stage === "untie") setStage("flap");
                }}
              >
                <span className="absolute left-0 top-3 h-5 w-5 -rotate-[25deg] rounded-full bg-amber-400" />
                <span className="absolute right-0 top-3 h-5 w-5 rotate-[25deg] rounded-full bg-amber-400" />
                <span className="absolute left-3 top-3 h-6 w-6 rounded-full bg-amber-500 shadow" />
              </motion.button>
            </div>

            <p className="mt-6 text-sm text-white/70">
              {stage === "closed"
                ? "Tap the knot to open"
                : stage === "done"
                  ? "Tap outside to close"
                  : "\u00A0"}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}