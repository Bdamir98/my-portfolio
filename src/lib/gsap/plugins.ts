import gsap from "gsap";
import { ScrollTrigger, Flip, TextPlugin } from "gsap/all";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger, Flip, TextPlugin);
}

export { gsap, ScrollTrigger, Flip, TextPlugin };
export default gsap;
