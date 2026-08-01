---
name: Serra SmartBus System
colors:
  surface: '#f8f9fa'
  surface-dim: '#d9dadb'
  surface-bright: '#f8f9fa'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f3f4f5'
  surface-container: '#edeeef'
  surface-container-high: '#e7e8e9'
  surface-container-highest: '#e1e3e4'
  on-surface: '#191c1d'
  on-surface-variant: '#43474f'
  inverse-surface: '#2e3132'
  inverse-on-surface: '#f0f1f2'
  outline: '#737780'
  outline-variant: '#c3c6d1'
  surface-tint: '#3a5f94'
  primary: '#001e40'
  on-primary: '#ffffff'
  primary-container: '#003366'
  on-primary-container: '#799dd6'
  inverse-primary: '#a7c8ff'
  secondary: '#904d00'
  on-secondary: '#ffffff'
  secondary-container: '#fd8b00'
  on-secondary-container: '#603100'
  tertiary: '#002507'
  on-tertiary: '#ffffff'
  tertiary-container: '#003d11'
  on-tertiary-container: '#36b24e'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#d5e3ff'
  primary-fixed-dim: '#a7c8ff'
  on-primary-fixed: '#001b3c'
  on-primary-fixed-variant: '#1f477b'
  secondary-fixed: '#ffdcc3'
  secondary-fixed-dim: '#ffb77d'
  on-secondary-fixed: '#2f1500'
  on-secondary-fixed-variant: '#6e3900'
  tertiary-fixed: '#83fc8e'
  tertiary-fixed-dim: '#66df75'
  on-tertiary-fixed: '#002106'
  on-tertiary-fixed-variant: '#00531a'
  background: '#f8f9fa'
  on-background: '#191c1d'
  surface-variant: '#e1e3e4'
typography:
  display-lg:
    fontFamily: Inter
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
  headline-lg-mobile:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  title-md:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-caps:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '700'
    lineHeight: 16px
    letterSpacing: 0.05em
  mono-timer:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 24px
    letterSpacing: -0.01em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  base: 8px
  xs: 4px
  sm: 12px
  md: 24px
  lg: 48px
  gutter: 16px
  margin-mobile: 16px
  margin-desktop: 32px
---

## Brand & Style

The design system is engineered for the high-stakes environment of urban mobility and public infrastructure. It embodies a **Corporate/Modern** aesthetic with a heavy emphasis on **Reliability, Efficiency, and Real-time Precision**. The goal is to instill immediate trust in both transit operators and citizens through a visual language that feels institutional yet technologically advanced.

The style leverages a structured, utilitarian approach to information density. It avoids unnecessary decoration in favor of clarity, using high-contrast status indicators and a systematic layout to ensure that critical transit data is digestible at a glance—whether on a large-screen operations console or a sun-glared street totem.

## Colors

The palette is rooted in "Institutional Trust." 

*   **Primary (Navy Blue):** Used for navigation, headers, and primary actions to establish a foundation of stability.
*   **Secondary (Safety Orange):** Reserved strictly for alerts, warnings, and urgent real-time status updates (e.g., "Arriving Now"). It provides high visibility against the neutral background.
*   **Success (Green):** Indicates "On-time" performance and active vehicle connectivity.
*   **Surface:** A range of cool grays and crisp whites maintain a clean "Control Room" environment. 

For the **Operations Center Dark Mode**, the surface colors should invert to deep charcoals (#121212) while maintaining the same Primary and Secondary tokens to ensure accessibility in low-light environments.

## Typography

This design system utilizes **Inter** for its exceptional legibility and neutral, professional character. 

*   **Hierarchy:** Large display sizes are reserved for vehicle line numbers and countdown timers.
*   **Readability:** Body text uses standard weights (400) with generous line height to prevent fatigue during long monitoring shifts.
*   **Labels:** All-caps labels with slight letter-spacing are used for data categories and metadata to distinguish them clearly from interactive text.
*   **Real-time Data:** Timers and bus numbers should use semi-bold or bold weights to ensure they are the first thing a user sees.

## Layout & Spacing

The layout follows a **Fluid Grid** model with a strict 8px baseline. 

*   **Desktop/Admin:** A 12-column grid with 16px gutters allows for modular "data cards" that can reflow based on the number of active monitors.
*   **Citizen Totem/Mobile:** A 4-column grid with larger 24px margins to account for physical screen edges and high-glare environments.
*   **Density:** The Admin dashboard utilizes "High Density" spacing (sm/md) to maximize information on screen, while the Citizen Portal utilizes "Comfortable" spacing (md/lg) to ensure accessibility for all users.

## Elevation & Depth

To maintain a professional and "flat" institutional feel, this design system uses **Tonal Layers** and **Low-contrast Outlines** rather than heavy shadows.

*   **Level 0 (Background):** Used for the main application canvas (#F8F9FA).
*   **Level 1 (Cards):** White surfaces with a subtle 1px border (#E9ECEF) to define boundaries. 
*   **Level 2 (Overlays/Modals):** Small, crisp ambient shadows (0px 4px 12px rgba(0,0,0,0.08)) are used only for map info-windows and dropdown menus to separate them from the base map layer.
*   **Interactive State:** Elements should "lift" slightly on hover using a Primary-colored thin bottom border rather than a shadow.

## Shapes

The shape language is **Soft (0.25rem)**. This provides a modern touch without appearing overly "consumer-focused" or playful. 

*   **Buttons & Inputs:** Use the standard 0.25rem (4px) radius.
*   **Status Badges:** Use a fully rounded "pill" shape to distinguish them from interactive buttons.
*   **Data Cards:** Use a 0.5rem (8px) radius to create a containerized feel for complex datasets and AI insights.

## Components

*   **Status Indicators:** Small circular dots or pill-shaped badges. Use green for "On-Time/Online," orange for "Delayed/Warning," and red for "Offline/Emergency." Always pair the color with a text label for accessibility.
*   **Countdown Timers:** High-contrast blocks. The "minutes remaining" should be the largest text element in the component, styled with `mono-timer`.
*   **Control Switches:** Used in the Admin panel for remote management. These should follow a standard toggle pattern but use the Primary Navy color for the "On" state.
*   **Data Visualization Cards:** AI-driven insights (e.g., "Predicted Congestion") should be housed in Level 1 cards with a Primary Blue header or left-accent bar to denote importance.
*   **Map Overlays:** Info-windows should have a white background, 8px rounded corners, and a 1px Navy border. Vehicle icons on the map should be directional arrows or icons colored by their current status.
*   **Buttons:** Primary buttons are solid Navy (#003366) with white text. Secondary buttons are outlined with 1px Navy. Warning buttons use Safety Orange.