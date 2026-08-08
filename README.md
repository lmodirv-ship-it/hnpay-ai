# Pay Hub

Act as a Principal UI/UX Architect and Core Frontend Engineer. Build the absolute visual masterpiece for "HN-Pay Hub" – a centralized, premium, high-fidelity Cloud Payment & Subscription Portal designed to serve as an embedded or standalone payment microservice gateway for 149 distributed applications (e.g., HN-BUILD, FILMFORGE, HN-LAVAGE).

### 1. Visual & Aesthetic Identity (Premium Cosmic Cybercore)

- **Background:** Implement a rich, deep cosmic gradient using absolute dark space tones: `from-[#04050a] via-[#080914] to-[#020205]`.

- **Cosmic Neon Glows & Orbs:** Infuse high-contrast, glowing radial ambient lighting directly into the canvas. Place a massive Electric Cyan (`#06b6d4/10`) glowing light blur in the bottom-right and a celestial Cosmic Amber/Gold (`#f59e0b/10`) light blur in the top-left using `absolute blur-[160px] rounded-full pointer-events-none`.

- **Component Styling (Glassmorphism Matrix):** Every container, card, and table must utilize a highly refined glassmorphism theme (`backdrop-blur-xl bg-[#0d0f1d]/40 border border-white/5 shadow-[0_0_30px_rgba(6,182,212,0.03)]`). Add ultra-fine glowing borders that softly illuminate when interacted with.

### 2. Microservice Dynamic Parameter Framework

The portal must natively simulate reading reactive URL search queries: `?appId=HN-BUILD&userId=hn_dev_99&planId=pro`. Create a state selector component at the top (for testing purposes) that allows toggling the context between "HN-BUILD", "FILMFORGE", and "HN-LAVAGE", which immediately updates the entire UI:

- **Pricing Cards:** Change features based on the application selected.

- **Resource Bar:** Changes labels (e.g., "Sites Built", "Videos Rendered", "API Deliveries").

- **Invoice Log:** Modifies names and values relative to the active application context.

### 3. Structural Page Layout (The 4 Core Pillars)

#### Pillar A: The Cyber Header

- **Left:** Display the ultra-sleek "HN-PAY" branding logo with a gold-to-yellow gradient text and a glowing shield badge icon.

- **Right:** A vital system network status card stating: "● Core Node: Connected to 192.168.100.233:8181" wrapped in a clean, glowing green badge (`bg-emerald-500/5 text-emerald-400 border-emerald-500/20`).

#### Pillar B: Active Account Status & Glowing KPI Usage

- Render a primary horizontal glass banner displaying the user's "Current Active Plan" for the loaded app.

- Embed a luminous, reactive "Resource Usage Progress Bar" glowing intensely in Amber/Gold, indicating clear operational thresholds (e.g., "Current Usage: 12 / 50 Premium Tokens").

#### Pillar C: The Premium 3-Tier Pricing Grid

Render three perfectly proportioned vertical tier columns featuring responsive call-to-action (CTA) buttons:

1. **Basic Plan:** Thin dark border, neat list of introductory capabilities.

2. **Pro Plan (Recommended):** Crowned with a glorious glowing gold frame (`shadow-[0_0_25px_rgba(245,158,11,0.2)] border-amber-500/30`), utilizing a distinct badge saying "MOST POPULAR". Clicking this plan opens the payment layout.

3. **Enterprise Plan (MAX Processing Mode):** A dark titanium, high-tech industrial container representing boundless compute limits for huge networks.

#### Pillar D: The Absolute Payment Gateway & Success Message

- Clicking any CTA reveals a beautifully animated Checkout section or Overlay Container.

- Features: Cardholder Name, Masked Card Number (`•••• •••• •••• ••••`), Expiry Date, and CVV.

- Upon clicking the "Confirm Secure Transaction" button, initiate a mock processing loading sequence that transforms into a glorious Success State, triggering: `window.parent.postMessage({ status: 'PAYMENT_SUCCESS', appId, planId }, '*')`.

#### Pillar E: Historical Ledger (Invoice Matrix)

- At the bottom, lay out a highly polished transaction grid showing historical invoices.

- Fields: Invoice ID (Mono text font colored in neon amber/gold), Date, Total Amount ($ USD), and Status displaying an emerald glowing chip reading "Paid / مدفوعة".

### 4. Code & Typography Refinement

Ensure all text layout layers utilize flawless line-height and contrast. Use crisp, modern typography and clean iconography (Lucide React style) across all interactive states to maintain a premium, professional SaaS appearance.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://hnpay-ai.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/1522c528-a8f9-4656-8f59-1353e768d9f4).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
