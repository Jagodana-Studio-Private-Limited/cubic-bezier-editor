export const siteConfig = {
  // ====== CUSTOMIZE THESE FOR EACH TOOL ======
  name: "Cubic Bezier Editor",
  title: "Cubic Bezier Editor - Visual CSS Easing Function Creator",
  description:
    "Create and preview CSS cubic-bezier() timing functions visually. Drag control points, compare curves, pick presets, and copy CSS instantly.",
  url: "https://cubic-bezier-editor.tools.jagodana.com",
  ogImage: "/opengraph-image",

  // Header
  headerIcon: "Spline", // lucide-react icon name
  // Brand gradient colors for Tailwind are in globals.css (--brand / --brand-accent)
  brandAccentColor: "#6366f1", // hex accent for OG image gradient (must match --brand-accent in globals.css)

  // SEO
  keywords: [
    "cubic bezier editor",
    "css easing function",
    "animation timing",
    "cubic-bezier generator",
    "css transition timing",
    "bezier curve editor",
    "css animation curve",
    "easing curve tool",
  ],
  applicationCategory: "DeveloperApplication",

  // Theme
  themeColor: "#3b82f6",

  // Branding
  creator: "Jagodana",
  creatorUrl: "https://jagodana.com",
  twitterHandle: "@jagodana",

  // Social Profiles (for Organization schema sameAs)
  socialProfiles: [
    "https://twitter.com/jagodana",
  ],

  // Links
  links: {
    github: "https://github.com/Jagodana-Studio-Private-Limited/cubic-bezier-editor",
    website: "https://jagodana.com",
  },

  // Footer
  footer: {
    about:
      "Cubic Bezier Editor is a free, browser-based visual tool for crafting CSS cubic-bezier() timing functions. Drag control points, preview animations in real time, and copy CSS instantly — no signup required.",
    featuresTitle: "Features",
    features: [
      "Visual drag-and-drop control points",
      "Real-time animation preview",
      "20+ built-in easing presets",
      "Curve comparison mode",
    ],
  },

  // Hero Section
  hero: {
    badge: "Free CSS Animation Tool",
    titleLine1: "Craft Perfect",
    titleGradient: "CSS Easing Curves",
    subtitle:
      "Drag control points on the interactive canvas to shape your cubic-bezier() timing function. Preview animations live, choose from presets, and copy the CSS in one click.",
  },

  // Feature Cards (shown on homepage)
  featureCards: [
    {
      icon: "🖱️",
      title: "Drag & Drop Editor",
      description:
        "Visually drag P1 and P2 control points on the SVG canvas to sculpt any bezier curve imaginable.",
    },
    {
      icon: "▶️",
      title: "Live Preview",
      description:
        "Watch an animated ball traverse the curve with your exact timing function before you copy the CSS.",
    },
    {
      icon: "📋",
      title: "Instant CSS Copy",
      description:
        "One click copies the complete cubic-bezier() CSS snippet, ready to paste into your stylesheet.",
    },
  ],

  // Related Tools (cross-linking to sibling Jagodana tools for internal SEO)
  relatedTools: [
    {
      name: "Favicon Generator",
      url: "https://favicon-generator.jagodana.com",
      icon: "🎨",
      description: "Generate all favicon sizes + manifest from any image.",
    },
    {
      name: "Sitemap Checker",
      url: "https://sitemap-checker.jagodana.com",
      icon: "🔍",
      description: "Discover and validate sitemaps on any website.",
    },
    {
      name: "Regex Playground",
      url: "https://regex-playground.jagodana.com",
      icon: "🧪",
      description: "Build, test & debug regular expressions in real-time.",
    },
    {
      name: "Screenshot Beautifier",
      url: "https://screenshot-beautifier.jagodana.com",
      icon: "📸",
      description: "Transform screenshots into beautiful images.",
    },
    {
      name: "Color Palette Explorer",
      url: "https://color-palette-explorer.jagodana.com",
      icon: "🎭",
      description: "Extract color palettes from any image.",
    },
    {
      name: "Logo Maker",
      url: "https://logo-maker.jagodana.com",
      icon: "✏️",
      description: "Create a professional logo in 60 seconds.",
    },
  ],

  // HowTo Steps (drives HowTo JSON-LD schema for rich results)
  howToSteps: [
    {
      name: "Drag control points",
      text: "Click and drag the P1 (blue) or P2 (indigo) handle on the SVG canvas to reshape the bezier curve.",
      url: "",
    },
    {
      name: "Preview the animation",
      text: "Click the Play button to watch an animated ball move along your easing curve at the selected duration.",
      url: "",
    },
    {
      name: "Copy the CSS",
      text: "Click the Copy button next to the CSS output field to copy the cubic-bezier() value to your clipboard.",
      url: "",
    },
  ],
  howToTotalTime: "PT1M",

  // FAQ (drives both the FAQ UI section and FAQPage JSON-LD schema)
  faq: [
    {
      question: "What is a cubic-bezier() function in CSS?",
      answer:
        "A CSS cubic-bezier() function defines a custom timing curve for transitions and animations using four numbers: x1, y1, x2, y2. These control the two 'handles' of a cubic Bézier curve between the points (0,0) and (1,1), letting you create any easing effect from linear to bouncy.",
    },
    {
      question: "How do I use this Cubic Bezier Editor?",
      answer:
        "Drag the blue (P1) and indigo (P2) handles on the canvas to reshape the curve, or type values directly in the number inputs. Hit Play to preview the animation at your chosen duration, pick a preset from the buttons, then click Copy to grab the CSS snippet.",
    },
    {
      question: "Can the Y values go outside 0–1?",
      answer:
        "Yes! The X values (x1 and x2) must stay between 0 and 1, but the Y values (y1 and y2) can exceed this range to create overshoot/undershoot effects — useful for spring-like animations. The editor allows Y values from -0.5 to 1.5.",
    },
    {
      question: "What presets are available?",
      answer:
        "The editor includes CSS standard presets (linear, ease, ease-in, ease-out, ease-in-out) plus extras like ease-in-cubic, ease-out-cubic, ease-in-expo, ease-out-expo, ease-in-back, ease-out-back, and a snappy spring-like curve.",
    },
    {
      question: "Is this tool free and private?",
      answer:
        "Completely free and 100% client-side. All computation happens in your browser — nothing is sent to any server.",
    },
  ],

  // ====== PAGES (for sitemap + per-page SEO) ======
  pages: {
    "/": {
      title: "Cubic Bezier Editor - Visual CSS Easing Function Creator",
      description:
        "Create and preview CSS cubic-bezier() timing functions visually. Drag control points, compare curves, pick presets, and copy CSS instantly.",
      changeFrequency: "weekly" as const,
      priority: 1,
    },
  },
} as const;

export type SiteConfig = typeof siteConfig;
