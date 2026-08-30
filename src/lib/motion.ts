/** JS mirror of the motion vocabulary in src/app/globals.css (--ease-* and
 *  --duration-* custom properties). Change both sides together: the CSS vars
 *  drive stylesheet animations, these constants drive motion/react
 *  transitions (which need plain numbers/arrays, not var()). */

/** Matches --ease-out-expo */
export const EASE_OUT_EXPO = [0.23, 1, 0.32, 1] as const;

/** Matches --ease-spring */
export const EASE_SPRING = [0.34, 1.56, 0.64, 1] as const;

/** Seconds — matches --duration-fast / --duration-med / --duration-slow */
export const DURATION_FAST = 0.15;
export const DURATION_MED = 0.25;
export const DURATION_SLOW = 0.4;

/** Shared spring for the mobile bottom sheets (was duplicated in
 *  MobileSidebar and MobileDetailPanel) */
export const SHEET_SPRING = { type: "spring", duration: 0.5, bounce: 0.2 } as const;
