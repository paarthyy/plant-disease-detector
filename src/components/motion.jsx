import React from "react";
import { motion } from "framer-motion";

export const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.75, ease: [0.22, 1, 0.36, 1] },
  },
};

export const stagger = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.08,
    },
  },
};

export function Reveal({ children, className = "", amount = 0.2, delay = 0, y = 28 }) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount }}
      transition={{ duration: 0.75, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

export function InteractiveCard({ children, className = "" }) {
  return (
    <motion.div
      className={className}
      whileHover={{ y: -6, rotateX: 1.6, rotateY: -1.8, scale: 1.01 }}
      transition={{ type: "spring", stiffness: 220, damping: 20, mass: 0.8 }}
      style={{ transformStyle: "preserve-3d" }}
    >
      {children}
    </motion.div>
  );
}

export function PremiumButton({ children, className = "", ...props }) {
  return (
    <motion.button
      whileHover={{ scale: 1.035, y: -2 }}
      whileTap={{ scale: 0.985 }}
      transition={{ type: "spring", stiffness: 300, damping: 18 }}
      className={className}
      {...props}
    >
      {children}
    </motion.button>
  );
}
