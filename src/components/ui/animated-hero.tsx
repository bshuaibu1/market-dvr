import { useEffect, useState } from "react";
import { motion } from "framer-motion";

const words = [
  "millisecond.",
  "crash.",
  "pump.",
  "spike.",
  "tick.",
  "moment.",
];

function AnimatedHeroTitle() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = setTimeout(() => {
      setIndex((i) => (i + 1) % words.length);
    }, 2200);
    return () => clearTimeout(id);
  }, [index]);

  return (
    <h1
      style={{
        fontSize: "clamp(32px, 4.2vw, 62px)",
        fontWeight: 300,
        lineHeight: 1.05,
        letterSpacing: "-0.03em",
        marginBottom: "20px",
      }}
      className="text-foreground"
    >
      Record
      <br />
      <span
        className="relative inline-flex overflow-hidden"
        style={{ verticalAlign: "bottom" }}
      >
        {words.map((word, i) => (
          <motion.span
            key={word}
            className="absolute left-0"
            style={{ color: "rgba(255,255,255,0.28)", fontWeight: 200 }}
            initial={{ opacity: 0, y: 40 }}
            animate={
              index === i
                ? { opacity: 1, y: 0 }
                : { opacity: 0, y: index > i ? -40 : 40 }
            }
            transition={{ type: "spring", stiffness: 80, damping: 18 }}
          >
            {word}
          </motion.span>
        ))}
        {/* invisible spacer keeps container width stable */}
        <span style={{ visibility: "hidden", fontWeight: 200 }}>
          millisecond.
        </span>
      </span>
    </h1>
  );
}

export { AnimatedHeroTitle };
