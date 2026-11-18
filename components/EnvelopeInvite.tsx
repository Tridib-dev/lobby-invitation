"use client";

import { useState } from "react";
import { motion , AnimatePresence } from "motion/react";
import type { InvitePayload } from "@/src/types/invite";



export default function EnvelopeInvite({ invite } : { invite : InvitePayload }) {
    const [open,setOpen] = useState(false);
    const [opened, setOpened] = useState(false);

    return (
        <>
            <button 
                onClick = {() => setOpen(true)}
                className="rounded-full px-6 py-3 font-semibold text-black"
                style={{ background : invite.accent }}
            >
                Open your invitation
            </button>

            <AnimatePresence>
                {open && (
                    <motion.div
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
                        initial={{ opacity : 0 }}
                        animate={{ opacity : 1 }}
                        exit={{ opacity : 0 }}
                        onClick={() => {
                            setOpen(false)
                            setOpened(false)
                        }}
                    >
                        <motion.div
                            className="relative w-full max-w-md"
                            initial={{scale : 0.9 , y : 40 }}
                            animate={{scale : 1 , y : 0 }}
                            exit={{scale : 0.9 , y : 40 }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <motion.div
                                className="rounded-2xl bg-white p-8 text-center text-black shadow-22xl"
                                animate= {{ y :  opened ? -40 : 40 , opacity : opened ? 1 : 0.4 }}
                                transition={{ type : "spring" , stiffness : 120 , damping : 14 }}
                            >
                                <p className="text-sm" style={{color : invite.accent}}>
                                    {invite.guest ? `${invite.guest} , you're invited !` : `You're invited !`}
                                </p>
                                <h2 className="my-3 text-3xl font-bold"> {invite.title}</h2>
                                <p>{new Date(invite.date).toLocaleString("en-IN" , {
                                        dateStyle : "full",
                                        timeStyle : "short",
                                        timeZone : "Asia/Kolkata",
                                    })}
                                </p>
                                <p>{invite.location}</p>
                                {invite.note && <p className="mt-3 italic"> {invite.note}</p>}

                            </motion.div>
                            <motion.button
                                onClick={() =>setOpened(true)}
                                className="absolute inset-x-0 bottom-0 h-40 rounded-b-2xl font-semibold text-white"
                                style={{ background : invite.accent }}
                                animate = {{ y : opened ? 200 : 0 , opacity : opened ?0 : 1 }}
                                transition = {{duration : 0.6 }}
                                aria-label = "Open Envelope"
                            >
                                Tap to open
                            </motion.button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    )
}