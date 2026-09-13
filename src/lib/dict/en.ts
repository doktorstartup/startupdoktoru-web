import type { Dict } from "./tr";

export const en: Dict = {
  meta: {
    title: "Startup Doktoru — Free Startup Training and Fundraising Guide",
    description:
      "Startup training built on a real pitch deck that raised. Start with the free 12-minute training, then continue with the ebook and video courses. 10 years in the field.",
    ogLocale: "en_US",
  },

  pageMeta: {
    ebook: {
      title: "Startup Ebook: 13 Chapters from MVP to Valuation | Startup Doktoru",
      description:
        "Innovation, MVP, product-market fit, team building, cash flow, company valuation and investor negotiation — a 13-chapter startup ebook for $6.",
    },
    egitimler: {
      title: "Startup Video Courses — 3 Courses, One Bundle | Startup Doktoru",
      description:
        "Pitch deck preparation, the startup founding guide and company valuation. $70 each, or all three together in a single $99 bundle.",
    },
    freeTraining: {
      title: "Free Startup Training — 12-Minute Video | Startup Doktoru",
      description:
        "The fundamentals of building a startup in 12 minutes: real innovation, MVP, and the first signals investors look for. Free video training, just sign up.",
    },
    investorTraining: {
      title: "How to Pitch Investors? Video Course | Startup Doktoru",
      description:
        "Slide-by-slide pitch deck training built on a real deck that raised. 5 modules, 134 minutes. The 12 critical mistakes that make investors say no on the spot.",
    },
    degerleme: {
      title: "How to Value a Startup? Berkus & DCF | Startup Doktoru",
      description:
        "Company valuation with the Berkus, scorecard, risk factor and DCF methods — and how to walk into an investor negotiation from a position of strength.",
    },
    startupGiris: {
      title: "How to Start a Startup? Founding Guide Course | Startup Doktoru",
      description:
        "Real innovation, escaping over-engineering, brand positioning, MVP development, team building and competitor analysis — the whole setup in one course.",
    },
    blog: {
      title: "Startup Blog — Entrepreneurship and Fundraising | Startup Doktoru",
      description:
        "Actionable writing on entrepreneurship, fundraising, company valuation and growth. News and field notes from the startup world.",
    },
  },

  nav: {
    problem: "The Problem",
    solution: "Our Solution",
    ebook: "Ebook",
    training: "Courses",
    about: "About",
  },

  header: {
    homeAria: "Startup Doktoru home",
    aiMentor: "AI Mentor",
    myPanel: "My Dashboard",
    login: "Log in",
    memberLogin: "Member Login",
    buyEbook: "Get the Ebook",
    openMenu: "Open menu",
    closeMenu: "Close menu",
    logout: "Log out",
    switchLanguage: "Change language",
  },

  footer: {
    rights: "© 2026 Startup Doktoru. All rights reserved. \u201CA caravan isn\u2019t sorted out on the road — it\u2019s sorted out with strategy.\u201D",
    copyright: "© 2026 Startup Doktoru. All rights reserved.",
    trainings: "Courses",
    freeTraining: "Free Training",
    blog: "Blog",
    privacy: "Privacy Policy",
    distanceSales: "Distance Sales Agreement",
    terms: "Terms of Use",
  },

  home: {
    hero: {
      badge: "10 Years in Startups and Venture Funding",
      titleLead: "The target:",
      titleHighlight: "A Million Dollars",
      subtitle:
        "Ten years of hard-won experience, distilled into a step-by-step path for building a million-dollar startup.",
      ctaFree: "Start the Free Training",
      riskReducer: "No credit card · access in 2 minutes",
      ebookLink: "or take a look at the ebook ·",
      stats: [
        { value: "100+", label: "Founders Mentored" },
        { value: "3", label: "Companies Founded" },
        { value: "10+ Years", label: "In the Field" },
      ],
    },

    problem: {
      eyebrow: "The Core Problems",
      title: "Why Do Founders Fail?",
      lead: "Four operational truths behind months of work going to waste:",
      items: [
        {
          title: "Chasing the Wrong Metrics",
          desc: "Tracking likes and vanity growth numbers instead of real revenue and real users.",
        },
        {
          title: "A Weak Pitch Deck",
          desc: "Building a 50-slide deck that never answers the five questions actually on an investor's mind.",
        },
        {
          title: "Over-Engineering",
          desc: "Spending months coding features the market never validated, and delaying launch again and again.",
        },
        {
          title: "Growth Without a System",
          desc: "Running the business into chaos with no KPIs, no task ownership and no real delegation.",
        },
      ],
    },

    ladder: {
      eyebrow: "A Journey Built on Trust",
      title: "The Startup Value Ladder",
      lead: "We do not sell high-ticket offers up front. We earn your trust one step at a time:",
      popular: "Most Popular",
      discountBadge: "50% off",
      steps: [
        {
          step: "Step 01",
          title: "Free Training",
          desc: "Shows you the most costly mistakes founders make in front of investors — and delivers value immediately.",
          price: "Free",
          oldPrice: "",
          btnText: "Sign Up",
        },
        {
          step: "Step 02",
          title: "Ebook",
          desc: "The practical handbook for building a million-dollar startup in 13 critical steps.",
          price: "$6",
          oldPrice: "$12",
          btnText: "Get It for $6",
        },
        {
          step: "Step 03",
          title: "Video Courses",
          desc: "Pitch deck preparation, the startup founding guide and company valuation. 50% off each if you own the ebook.",
          price: "$70 / bundle $99",
          oldPrice: "",
          btnText: "See the Courses",
        },
      ],
    },

    ebookSection: {
      eyebrow: "The Digital Transformation Handbook",
      title: "A Million-Dollar Startup in 13 Steps",
      body: "This book distills ten years of innovation, fundraising and growth experience. Step by step, with real examples, it shows you how to build the backbone of your company.",
      chapters: [
        "01. Innovation & a Useful Idea",
        "02. Over-Engineering (the Engineer's Disease)",
        "03. Going to Market with an MVP",
        "04. Problem Validation & Product-Market Fit",
        "05. Brand Positioning & Competitor Analysis",
        "06. Building a Team (CEO, COO, CFO)",
        "07. Cash Flow Management",
        "08. Company Valuation (Berkus, Scorecard, DCF)",
        "09. Angel Investors & Negotiation",
        "10. The Investor Pitch",
      ],
      cta: "Download the Ebook ($6)",
      cardTag: "The System Book",
      cardTitleTop: "A Million-Dollar",
      cardTitleMid: "Startup",
      cardTitleBottom: "in 13 Steps",
      cardNote: "the growth roadmap that puts an end to figuring it out on the way.",
    },

    trainingSection: {
      eyebrow: "Video Course · Most Requested",
      title: "How Do You Pitch Investors?",
      bodyBefore: "Not theory — we work ",
      bodyStrong: "through a real deck that actually raised",
      bodyAfter: ". I open the slides one by one and show you what convinces an investor. The one-minute preview is free.",
      videoTitle: "Pitch Deck Course — Preview",
      videoLabel: "Watch the one-minute preview",
      posterBadge: "Free Preview",
      posterTitle: "How Do You Pitch Investors?",
      posterSubtitle: "Built on a real deck that raised",
      modules: [
        "Problem & Solution Narrative",
        "Market Size & Competitor Analysis",
        "Building a Team & Investor Confidence",
        "Business Model & Revenue Logic",
        "Teardown of a Deck That Raised",
      ],
      cta: "Watch the Preview & Get Access",
      note: "Preview is free · Full course $70 ($35 if you own the ebook)",
    },

    about: {
      eyebrow: "About Startup Doktoru",
      name: "Eser Memişoğlu",
      p1: "For the past ten years I have worked across startups, technology, innovation and investor relations. I have founded three technology companies and walked alongside dozens of founders and scale-up brands as they built their operating systems.",
      p2: "I am against running a business on improvisation. With Startup Doktoru I have turned my hardest-won lessons into products, so you can turn your business model into an autonomous system that is fundable and scales profitably.",
      stats: [
        { value: "10+", label: "Years of Experience" },
        { value: "3", label: "Companies Founded" },
        { value: "100+", label: "Founders Mentored" },
      ],
      portraitAlt: "Eser Memişoğlu — Founder & Startup Advisor",
      role: "Founder & Startup Advisor",
      roleNote: "Working on innovation, financing, investor relations and growth systems.",
      quote: "A caravan isn't sorted out on the road — it's sorted out with strategy.",
      quoteCaption: "Eser Memişoğlu's principle",
    },

    faqSection: {
      eyebrow: "Common Questions",
      title: "Frequently Asked Questions",
      items: [
        {
          q: "What exactly is Startup Doktoru?",
          a: "Startup Doktoru is a training, mentoring and growth platform that turns the founder's journey — from idea to funding — into a system. The goal is not theory: it is helping you build business models and growth funnels you can actually run.",
        },
        {
          q: "How do I get the ebook after buying it?",
          a: "The moment your purchase goes through, the PDF download link appears on screen. An access link to the student portal is also sent automatically to the email address you signed up with.",
        },
        {
          q: "What will the pitch deck course do for me?",
          a: "The course breaks down the five things investors look for in a deck: metrics, team, problem-solution, market size and the financial roadmap. By the end you will have built a deck professional enough to convince investors.",
        },
        {
          q: "How can I get one-on-one advisory?",
          a: "Our advisory model follows the value ladder. Once you have taken the free training or picked up the ebook, you can request a Startup Check-Up or Growth Advisory directly from your dashboard or the contact form.",
        },
      ],
    },

    finalCta: {
      badge: "The Automated Growth Machine",
      title: "Ready to turn your startup into a fundable, profitable system?",
      body: "Don't stop at theory. Take your business up a level today with Startup Doktoru's practical handbooks, video course modules and automated growth playbooks.",
      primary: "Start the Free Training",
      secondary: "Get the Ebook ($6)",
    },

    stickyBar: {
      title: "A Million-Dollar Startup in 13 Steps",
      meta: "Ebook ·",
      cta: "Get It · $6",
    },
  },

  prices: {
    ebookOld: "$12",
    ebookNew: "$6",
  },

  testimonials: {
    eyebrow: "Student Results",
    title: "What Do Graduates Say?",
    lead: "From real founders, in their own words.",
    watch: "Watch",
    videoTitleSuffix: "testimonial",
  },

  vcNetwork: {
    eyebrow: "A Credible Source",
  },

  discountPopup: {
    normalPrice: "Regular price",
    todayForYou: "Today, for you",
    discountBadge: "50% off · Grab it now",
    close: "Close",
    title: "Wait — before you go!",
    bodyStrong: "A Million-Dollar Startup in 13 Steps",
    bodyRest: " — get the ebook at half price on your first order.",
    emailPlaceholder: "your email address",
    cta: "Get It for $6",
    noSpam: "No spam. Unsubscribe whenever you like.",
    doneTitle: "Your discount is ready 🎉",
    doneBody: "You can download the ebook at half price right now.",
    doneCta: "Get It for $6",
  },

  ebookPage: {
    backHome: "Home",
    badge: "The Million-Dollar Startup Guide",
    title: "A Million-Dollar Startup in 13 Steps",
    intro:
      "Ten years of founding startups, innovation work and investment management, distilled into a single book. Turn your company from a pile of chaos into a profitable growth machine that runs itself.",
    features: [
      "Innovation and over-engineering: avoid the mistakes that sink startups",
      "Company valuation: the Berkus, Scorecard and DCF methods",
      "Finding angel investors and negotiating with them",
      "What actually works in a pitch deck that raised",
    ],
    discountBadge: "50% off",
    cta: "Get It Now for $6",
    cardTag: "PDF Edition",
    cardTitleTop: "A Million-Dollar",
    cardTitleMid: "Startup",
    cardTitleBottom: "in 13 Steps",
    cardNote: "The digital handbook that ends figuring it out as you go.",
    chaptersEyebrow: "Contents",
    chaptersTitle: "Chapters and Curriculum",
    chaptersLead: "The 13 chapters we go through in depth — and that you apply in your own company:",
    chapters: [
      { t: "What Is Innovation? The Formula for Getting It Right", d: "Not a 'new idea' but a 'useful idea': what innovation really means, and the formula that strengthens a startup idea." },
      { t: "Over-Engineering: The Engineer's Disease", d: "How shipping features nobody asked for sinks a startup — and how to break the habit." },
      { t: "What Is an MVP? Launching With the Least", d: "Getting to market with the fastest, cheapest MVP without falling into the perfectionism trap." },
      { t: "Problem Validation & Product-Market Fit", d: "Finding the problem customers actually pay to solve, and reaching product-market fit." },
      { t: "Brand Positioning & Competitor Analysis", d: "Deciding how people see you, and claiming the right position through competitor analysis." },
      { t: "Building a Startup Team: CEO, COO, CFO", d: "C-level roles, filling the gaps with the right people, and hiring at the right time." },
      { t: "Cash Flow Management: The Mistake That Kills", d: "'Cash flow kills' — where startups go under most often, and how to keep the financial model standing." },
      { t: "What Is Company Valuation? Which Method, When", d: "Know your own value before you walk into an investor meeting: valuation is context, not fantasy." },
      { t: "Valuation With the Berkus Method", d: "Angel investor Dave Berkus's valuation method for pre-revenue startups." },
      { t: "The Scorecard Valuation Method", d: "Weighing quantitative and qualitative criteria together with the scorecard method." },
      { t: "Valuation With DCF and Risk Factors", d: "A realistic valuation using discounted cash flow and risk-factor adjustment." },
      { t: "Angel Investors & Negotiating the Deal", d: "Who angel investors are, how rounds work, and the tactics that keep you strong at the table." },
      { t: "The Investor Pitch: A Million Dollars in 4 Minutes", d: "What convinces an investor, walked through a real deck that raised." },
    ],
    checkoutNote: "Instant PDF download access",
  },

  checkout: {
    title: "Secure Checkout",
    close: "Close",
    preparing: "Getting your details ready…",
    nameLabel: "Full Name",
    namePlaceholder: "Jane Doe",
    emailLabel: "Email Address",
    emailPlaceholder: "jane@startup.com",
    phoneLabel: "Phone Number",
    phoneOptional: "(optional)",
    phonePlaceholder: "+1 555 000 0000",
    preparingBtn: "Preparing...",
    toPayment: "Continue to Payment",
    ssl: "Secure payment with 256-bit SSL encryption (Stripe).",
    verifying: "Verifying payment...",
    complete: "Complete Payment",
    errorPayment: "The payment could not be completed. Please try again.",
    errorStart: "The payment could not be started.",
    errorConnection: "Connection error. Please try again.",
  },
};
