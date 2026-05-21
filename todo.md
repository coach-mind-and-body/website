# Mind & Body Reset — Full Platform TODO

## Phase 1: Foundation & Architecture
- [x] Upload logo to CDN
- [x] Reset index.css with brand tokens (blush pink, gold, forest green)
- [x] Update index.html with Google Fonts, SEO meta base, Open Graph tags
- [x] Update App.tsx with all routes and navigation structure
- [x] Create shared constants file (Google Calendar URLs, brand config)

## Phase 2: Public Website
- [x] Homepage (/) — hero, quiz CTA, testimonials, Lee Anne bio, services, blog preview
- [x] About page (/about) — Lee Anne full story, credentials, personal journey
- [x] RECLAIM program page (/reclaim) — what it is, what's included, pricing options, FAQ
- [x] Book a Free Call page (/book) — Google Calendar embed (discovery call)
- [x] Navigation component with mobile menu
- [x] Footer component with links and disclaimer
- [x] JSON-LD structured data: Person, Course, LocalBusiness, FAQPage schemas

## Phase 3: Blog System
- [x] Database schema: blogPosts table
- [x] Blog index page (/blog) with category filter
- [x] Individual blog post page (/blog/[slug]) with full SEO schema
- [x] Blog tRPC router (list, bySlug, adminList, create, update, delete)
- [ ] Seed existing blog posts from GoDaddy site into database
- [ ] Admin blog post editor (/blog/new)

## Phase 4: Enrollment & Payments
- [x] Database schema: enrollments + coachingSessions tables
- [x] /enroll page — dual payment option ($597 full or $200 deposit)
- [x] Stripe checkout for full $597 payment
- [x] Stripe checkout for $200 non-refundable deposit
- [x] Session 1 Google Calendar booking embed after payment
- [x] Stripe webhook: handle payment success, create enrollment record
- [ ] Enrollment confirmation email (automated via Resend)

## Phase 5: Client Portal
- [x] /my-program page — session progress tracker (1 of 6)
- [x] Session cards with status (completed, upcoming, locked)
- [x] "Book Next Session" button per session (Google Calendar link)
- [x] Session unlock logic (admin marks complete → next session unlocks)
- [ ] Post-session automated email to client with booking link for next session
- [ ] Post-program email sequence (Day 1 review, Day 14 check-in, Day 30 upsell)

## Phase 6: Admin Dashboard
- [x] /admin route guard (admin role only)
- [x] Admin dashboard overview (active clients, new leads, blog posts, enrollments)
- [x] Clients tab — enrollment list with expandable session management + notes
- [x] Leads tab — discovery call leads with status management
- [x] Blog tab — post list with draft/published status
- [x] Payments tab — link to Stripe dashboard
- [ ] "Mark Session Complete" → triggers client email + unlocks next session
- [x] Google Meet launch button in admin session view
- [ ] Admin blog post editor (create/edit posts from admin)

## Phase 7: Polish & SEO/AEO
- [x] Full-funnel routing (all pages connected)
- [x] FAQ sections on /reclaim with AEO-optimized Q&A format
- [x] Open Graph + Twitter Card tags
- [x] JSON-LD schemas (LocalBusiness, Person, Service, FAQ)
- [x] Vitest tests for payment router
- [x] Vitest tests for Google Calendar helpers
- [x] Google Calendar OAuth flow (connect Lee Anne's calendar)
- [x] Store/refresh Google tokens server-side
- [x] googleTokens table in schema
- [x] clientFiles table in schema (S3 uploads per client)
- [x] sessionBookings table in schema (with googleEventId + meetLink)
- [x] Auto-create Google Calendar event + Meet link on session booking
- [x] Join Meet button in admin and client portals
- [x] Admin file upload per client
- [x] Client portal (/portal) — session progress, files, book session, join meet
- [ ] Full mobile responsiveness audit
- [ ] Sitemap.xml + robots.txt
- [ ] Seed blog posts with real content
- [ ] Automated email integration (Resend)
- [ ] Final checkpoint and delivery

## New Requests
- [x] Show real client names/emails in admin Clients tab (join enrollments with users table)
- [x] Admin file upload per client in expanded enrollment view
- [x] Blog post create/edit page from admin portal (make "+ New Post" button work)
- [x] Direct image upload for blog cover image (upload to S3, return URL)
- [x] Custom category input in blog editor (type new or select existing)
- [x] Inline image insertion in blog content editor (upload to S3, insert Markdown at cursor)
- [x] Scheduled blog post publishing with Mountain Time date/time picker
- [x] Server-side scheduled publish check (auto-publish when scheduledAt time arrives)
- [x] Payments tab in admin dashboard (list all payments, stats, Stripe link)
- [x] Payment history section in client portal (deposit status, balance remaining)
- [x] Pay Balance button in client portal (Stripe checkout for $397 balance)
- [x] Google Calendar booking popup in client portal (embed booking page in modal)
- [x] Admin setting to store Lee Anne's Google Calendar booking page URL
- [x] Google Calendar webhook to auto-complete sessions when event ends
- [x] Private vs shared session notes (Lee Anne toggle, clients only see shared)
- [x] Twilio SMS scaffolding (24hr reminder, post-session follow-up)
- [x] Post-session email via Mailchimp (schedule next session CTA or program complete)

## Homepage Redesign (match reference PDF)
- [x] Update global CSS theme — warm cream bg, gold accent, remove dark green as primary
- [x] Rebuild hero section — two-column, olive green tagline, gold CTA button
- [x] Update nav bar — gold/tan background, clean links
- [x] Update testimonials section — white cards, gold stars
- [x] Update About Lee Anne section — two-column layout
- [x] Update email signup banner — dark green strip (accent only, not primary)
- [x] Verify all pages use new color tokens (no leftover dark green)

## Homepage Fixes (Mar 8)
- [x] Change nav "Book a Call" button to a contrasting color (not gold-on-gold)
- [x] Replace hero logo placeholder with quiz graphic image (uploaded to CDN)
- [x] Fix invisible blog posts in homepage blog preview section

## Image, Button & SEO Updates (Mar 9)
- [x] Upload new QuizResultsImage.jpg to CDN and replace quiz graphic on homepage
- [x] Fix "Book a Call" nav button text to white
- [x] Add/verify SEO meta tags (title, description, og:image, canonical) on all pages
- [x] Add structured data (JSON-LD) for the business
- [x] Verify images use WebP format and lazy loading
- [x] Add sitemap.xml and robots.txt
- [x] Optimize font loading (preconnect, display:swap)

## Nav & Button & Image Fixes (Mar 9 - Round 2)
- [x] Remove "Home" link from nav (logo already links home)
- [x] Fix Book a Call button: blush pink background (#E8C5C8 or similar) with white text
- [x] Upload QuizResultsImage(1).png (transparent bg) to CDN and update homepage
- [x] Create /financial-peace page from provided HTML, styled to match site

## FPU Enhancements (Mar 9 - Round 3)
- [x] Restore Google Calendar popup button in nav (with blush pink color)
- [ ] Add /financial-peace link to site footer
- [x] Upload Lee Anne headshot photo and replace logo placeholder on /financial-peace
- [x] Replace all placeholders on /financial-peace with recommended content
- [x] Build Stripe checkout for FPU (product definition, tRPC procedure, checkout page)


## Google Calendar Webhook & Call Tracking (Mar 9 - Round 4)
- [x] Add reclaimCalls table to track call count per enrollment
- [x] Build Google Calendar webhook endpoint to listen for meeting end events
- [x] Parse Google Calendar event data to identify client email
- [x] Increment call count when meeting ends
- [x] Schedule follow-up email 15 minutes after call (unless call #6)
- [x] Build email template for follow-up with /reclaim link
- [x] Test webhook with real Google Calendar events
- [x] Verify emails send correctly for calls 1-5, not for call #6

## Email & FPU Updates (Mar 9 - Round 5)
- [ ] Install Resend npm package
- [ ] Swap Mailchimp transactional email with Resend in notifications.ts
- [ ] Add RESEND_API_KEY secret
- [x] Remove fake testimonials from /financial-peace
- [ ] Add May 12 cohort start date to /financial-peace
- [ ] Add Dave Ramsey FPU free sign-up link on /financial-peace
- [ ] Add $249 for 3 sessions coaching add-on product to FPU page
- [ ] Add Stripe checkout for FPU 1:1 coaching sessions ($249)

## FPU Owner Notification (Mar 9, 2026)
- [x] Send owner notification email when FPU coaching add-on is purchased (name + email for Google Calendar)

## FPU Thank-You Page (Mar 10, 2026)
- [x] Create /financial-peace/thank-you dedicated post-payment page with booking link
- [x] Update Stripe success_url to redirect to /financial-peace/thank-you (same tab)
- [x] Remove coaching_success modal from FinancialPeace.tsx (replaced by thank-you page)
- [x] Register /financial-peace/thank-you route in App.tsx

## End-to-End Flow Fixes (Mar 10, 2026)
- [x] Fix RECLAIM webhook to create enrollment + 6 coaching sessions after deposit/full payment
- [x] Add email-based user lookup in webhook for clients who pay before signing up
- [x] Add auto-link deposit to account when client visits portal without enrollment (linkDepositToAccount)
- [x] Fix FPU myCoaching query to add email-based fallback for guest purchasers
- [x] Add adminCreate enrollment procedure for manual enrollment by admin
- [x] Add "Enroll Client Manually" button + modal to Admin Clients tab
- [x] Confirm coach@mindandbodyresetcoach.com is in ADMIN_EMAILS list (auto-admin on first login)

## Analytics & Tracking (Mar 12, 2026)
- [x] Add Google Analytics GA4 (G-09SQ5LHEEJ) to index.html
- [ ] Add Meta Pixel placeholder to index.html (ID TBD)

## UI & Content Fixes (Mar 12, 2026)
- [x] Fix FPU thank-you page booking button to open Google Calendar as popup (not new tab)
- [x] Update all site email references to coach@mindandbodyresetcoach.com

## Owner Email Notifications (Mar 12, 2026)
- [x] Add sendOwnerEmail to RECLAIM deposit/full payment webhook
- [x] Add sendOwnerEmail to RECLAIM balance payment webhook
- [x] Add sendOwnerEmail to new lead/discovery call booking

## Client Welcome Emails (Mar 12, 2026)
- [ ] RECLAIM welcome email to client after deposit/full payment (Resend)
- [ ] FPU welcome email to client after FPU enrollment purchase (Resend)
- [ ] FPU coaching welcome email to client after coaching add-on purchase (Resend)

## Email & Admin Improvements (Mar 12, 2026 - Round 2)
- [x] Add FPU group class owner email via Resend (with Google Calendar group event instructions)
- [x] Add sendBalanceReminderEmail function in notifications.ts
- [x] Add adminSendBalanceReminder tRPC procedure in enrollment router
- [x] Add "Send Balance Reminder" button in admin Clients tab (only shown when balancePaid=false)
- [x] Add "Paid in Full" badge in admin Clients tab for deposit clients who completed payment

## Three Feature Requests (Mar 12, 2026 - Round 3)
- [x] Balance reminder email: use real Stripe checkout URL for $397 balance (not portal link)
- [x] RECLAIM welcome email to client after deposit or full payment (Resend) — already implemented
- [x] FPU /financial-peace page: updated cohort to May 12, 2026 and Dave Ramsey link to fpu.com/leeannebennett

## Bug Fixes (Mar 12, 2026 - Round 4)
- [x] Revert FPU sign-up link back to /financial-peace (was incorrectly changed to external fpu.com/leeannebennett)
- [x] Fixed post-meeting email timing to 75 minutes (was incorrectly set to 65 min)

## FPU Sign-Up Form (Mar 12, 2026 - Round 5)
- [x] Add fpuSignUp tRPC procedure: save name+email to fpuLeads table, email Lee Anne via Resend
- [x] Replace FPU sign-up CTAs on /financial-peace with inline name+email form (inline, 3 locations)
- [x] Show confirmation message after submission (no page navigation)

## FPU Admin View + Visitor Confirmation Email (Mar 12, 2026 - Round 6)
- [x] Add adminListFpuLeads tRPC procedure to query all fpu_leads records
- [x] Add FPU Group Sign-Ups tab to admin dashboard with name, email, sign-up date, and delete option
- [x] Add sendFpuGroupSignUpConfirmationEmail function to notifications.ts
- [x] Call confirmation email in fpu.groupSignUp mutation after saving lead

## WordPress-Style Page Editor (Mar 17, 2026)
- [x] Add pageContent table to schema (page, key, draftContent, publishedContent, updatedAt)
- [x] Add tRPC procedures: getPublished, getAll, saveDraft, publishPage, discardDrafts, hasDrafts
- [x] Run pnpm db:push to migrate schema
- [x] Install TipTap rich text editor packages
- [x] Build EditableBlock component (inline editing with TipTap, admin-only)
- [x] Build EditModeContext to share edit mode state across the page (with postMessage support)
- [x] Refactor /financial-peace to use EditableBlock for all text sections
- [x] Add "Edit Financial Peace" tab to admin dashboard with PageEditorTab component (iframe)
- [x] Add edit mode toggle, Publish button, Discard button to admin tab
- [x] Ensure edit indicators are 100% invisible to non-admin visitors (admin_edit=1 URL param hides nav)

## Visual Fixes - /financial-peace (Mar 17, 2026)
- [x] Restore original header fonts (Cormorant Garamond serif) on /financial-peace headings
- [x] Fix all text on green backgrounds to be white (placeholder text confirmed white via useEffect CSS injection)

## Inline Editor Styling Bug (Mar 17, 2026)
- [x] Fix editor: text goes black and loses Cormorant Garamond font when entering edit mode
- [x] Ensure white text color is preserved in editor on dark/green backgrounds (via style prop on wrapper)
- [x] Ensure Cormorant Garamond font is preserved in editor for headings (via style prop on wrapper)

## Admin Access & Heading Fix (Mar 17, 2026)
- [x] Fix "May 2026 Cohort Details" heading to white on /financial-peace (style prop on wrapper + DB content cleaned)
- [ ] Document how admin access works and who currently has it

## Cohort Heading Size Fix (Mar 17, 2026)
- [x] Restore large title font size on "May 2026 Cohort Details" heading

## Auth Overhaul - Google + Email/Password (Mar 17, 2026)
- [ ] Add password_hash column to users table in DB schema
- [ ] Add email/password signup and login server endpoints
- [ ] Add Google OAuth server endpoints (separate from Manus OAuth)
- [ ] Build login/signup page with Google button and email/password form
- [ ] Add password reset flow (forgot password email)
- [ ] Update admin whitelist logic to work with new auth methods
- [ ] Keep Manus OAuth working for existing admin accounts during transition

## Auth Overhaul - Google + Email/Password (Mar 17, 2026)
- [x] Add passwordHash, googleId, emailVerified, emailVerifyToken, passwordResetToken, passwordResetExpiry, loginMethod columns to users table
- [x] Run db:push to apply schema changes (users table now has 15 columns)
- [x] Create /api/auth/signup, /api/auth/login, /api/auth/forgot-password, /api/auth/reset-password, /api/auth/verify-email endpoints
- [x] Create /api/auth/google and /api/auth/google/callback Google OAuth endpoints
- [x] Build /login page with Google Sign-In + email/password form + forgot password flow
- [x] Build /reset-password page for password reset token links
- [x] Update getLoginUrl() to point to /login instead of Manus OAuth portal
- [x] Register new auth routes in server/_core/index.ts
- [ ] Add /api/auth/google/callback to Google Cloud Console authorized redirect URIs (manual step)

## Google OAuth Fix (Mar 17, 2026)
- [ ] Fix redirect_uri_mismatch: use reliable origin detection in /api/auth/google route

## Three Bug Fixes (Mar 17, 2026)
- [ ] Update site title to include "Mind and Body Reset" company name
- [ ] Fix post-login redirect: URL goes to internal run.app domain instead of staying on manus.space
- [ ] Fix page editor publish button not working after deleting content

## Editor Revert Bug & Google App Name (Mar 17, 2026)
- [x] Fix content revert: edited/deleted content reverts to old text when clicking outside block (fixed with localContent state)
- [ ] Update Google OAuth app name shown during sign-in (currently shows run.app domain)

## Google OAuth Redirect URI Fix (Mar 17, 2026)
- [x] Fix Google OAuth redirect URI to use stable public domain via APP_PUBLIC_URL env var

## Image & Footer Updates (Mar 17, 2026)
- [ ] Replace Lee Anne's photo on homepage with new image
- [ ] Replace Lee Anne's photo on Financial Peace page with new image
- [ ] Fix footer text from "About Lee Anne" to "About Mind & Body"

## Podcast, Mailchimp & Chatbot (Mar 18, 2026)
- [x] Fix podcast episode click scroll-to-top bug (now scrolls to player, not page top)
- [x] Add podcast.subscribe tRPC procedure with "podcast" Mailchimp tag
- [x] Set up Mailchimp RSS-to-email campaign (ID: 4d7c073a3f) pointing at YouTube playlist RSS feed
- [x] Add floating AI chatbot widget (ChatWidget.tsx) to all pages via App.tsx
- [x] Update /api/chat system prompt with Lee Anne's business context (programs, FPU, podcast)

## Chatbot & Email Template Fixes (Mar 18, 2026)
- [x] Fix AI chatbot blank response (convert UIMessage parts format to CoreMessage for streamText)
- [x] Redesign Mailchimp RSS email template: logo, YouTube thumbnail, description, CTA button, mobile-responsive

## Chatbot & Email Enhancements (Mar 18, 2026)
- [x] Chatbot: render Markdown links as styled pill buttons in chat responses
- [x] Chatbot: update system prompt to use Markdown link syntax and stay strictly on-topic
- [x] Email: add "Share this episode" link auto-generated from YouTube URL
- [x] Email: add static quiz CTA section at bottom of every podcast email

## Email & Chatbot Fixes Round 2 (Mar 18, 2026)
- [x] Fix Mailchimp email: thumbnail and description not showing (wrong RSS merge tags for YouTube)
- [x] Chatbot pills: navigate within site (no new tab), keep chatbot open across pages
- [x] Chatbot pills: show contextual follow-up message on destination page after navigation
- [x] Fix email thumbnail: add /api/youtube-thumbnail proxy endpoint (YouTube uses media:thumbnail not media:content)
- [x] Fix email description: use *|RSSITEM:CONTENT|* with server proxy
- [x] Fix quiz URL in email: /food-quiz
- [x] Chatbot notification dot: red dot on button when follow-up arrives, clears on open
- [x] Chatbot navigation: minimize chat and show dot instead of forcing open on follow-up

## SEO & Discoverability (Mar 18, 2026)
- [x] Add robots.txt (already existed, fixed www prefix in Sitemap URL)
- [x] Add Open Graph meta tags (already existed, fixed www prefix on og:url and canonical)
- [x] Add llms.txt for AI model discoverability
- [x] Add sitemap reminder comment in index.html — always add new pages to sitemap.xml

## SEO & Discoverability (Mar 18, 2026)
- [x] Add robots.txt (already existed, fixed www prefix in Sitemap URL)
- [x] Add Open Graph meta tags (already existed, fixed www prefix on og:url and canonical)
- [x] Add llms.txt for AI model discoverability
- [x] Add sitemap reminder comment in index.html — always add new pages to sitemap.xml
- [ ] Install Tiptap rich text editor in BlogEditor (H1/H2/H3, bold, italic, lists, links, images)
- [ ] Add per-post schema type fields to DB (Article, FAQ, VideoObject, HowTo) with auto-detect
- [ ] Render per-post JSON-LD schema on public blog post page
- [ ] Fix canonical URL conflict (www vs non-www)
- [ ] Fix viewport meta user-scalable=no
- [ ] Fix descriptive link text for SEO
- [ ] Add alt text support for blog post images
- [ ] Build SEO analysis panel in blog editor (Yoast/Rank Math style)
- [ ] Add www -> non-www 301 redirect in Express server
- [ ] Add hero image preload link in index.html
- [ ] Add Vite code splitting (manualChunks) for better JS loading
- [ ] Defer non-critical third-party scripts (Meta Pixel, Google Fonts)

## Meta Pixel Custom Events (Mar 18, 2026)
- [x] Create useMetaPixel utility hook for fbq() calls
- [x] Fire Lead event on FoodQuiz submission success
- [x] Fire Lead event on FoodQuizThankYou page load
- [x] Fire Lead event on Book page form submission success
- [x] Fire Lead event on FPU sign-up form submission success
- [x] Fire ViewContent on Reclaim page load
- [x] Fire ViewContent on FinancialPeace page load

## Meta Conversions API & PageSpeed (Mar 18, 2026)
- [x] Add META_CONVERSIONS_API_TOKEN secret
- [x] Enable Meta Conversions API server-side Purchase event calls in stripe.ts
- [x] PageSpeed: defer non-critical scripts (Meta Pixel, fonts)
- [x] PageSpeed: add image preloading for hero/LCP images
- [x] PageSpeed: lazy load below-the-fold images

## /join Page Pixel Events (Mar 18, 2026)
- [x] Add ViewContent event on /join page load
- [x] Add Lead event on /join form submit
- [x] Add Lead event on /join-thank-you page load

## Blog Editor Improvements (Mar 28, 2026)
- [x] Fix image uploads in blog posts (fixed hooks ordering bug)
- [x] Fix split/preview modes (fixed hooks ordering bug)
- [x] Add YouTube/Instagram embed support
- [x] Add table creation/editing support
- [x] Add publish date picker (past, present, future)
- [x] Add featured image alt text field
- [x] Build one-click AI SEO optimizer with suggestion/approval flow

## Blog Editor Fixes & Embeds (Mar 28, 2026)
- [x] Fix image uploads in blog posts (root cause: React hooks ordering violation)
- [x] Fix split/preview modes in blog editor (working after hooks fix)
- [x] Add YouTube embed support in blog editor (styled dialog with live preview)
- [x] Add Instagram embed support in blog editor (styled dialog with URL validation)

## Blog Editor UX & Admin Redirect Fixes (Apr 3, 2026)
- [x] Fix admin login redirect: after login, redirect to mindandbodyresetcoach.com/admin instead of manus domain
- [x] Add floating bubble toolbar on text selection (bold, italic, link, H2 etc.) in blog editor
- [x] Fix table cell outlines in editor so cells are visible and clickable

## Page Titles, Sitemap, Redirect & Blog Editor Fixes (Apr 8)
- [x] Fix page titles: set default to "Health and Wellness Coach | Mind and Body Reset" with unique per-page titles
- [x] Ensure sitemap.xml is dynamic (auto-includes blog posts)
- [x] Ensure blog RSS feed is dynamic (already was, fixed URL to custom domain)
- [x] Fix Google OAuth redirect to mindandbodyresetcoach.com (not manus domain)
- [x] Admin logo should link to home page
- [x] Fix React error #310 when editing blog posts (was already fixed in dev, needs republish)

## Per-Page SEO Metadata (Apr 8)
- [x] Upgrade usePageTitle hook to also set meta description, keywords, and OG tags
- [x] Add unique meta descriptions to all 25 pages
- [x] Add unique keywords to all 25 pages
- [x] Update OG description per page

## FPU Page Updates & Unicity Page (Apr 8)
- [x] Add Unicity link (ufeelgreat.com/c/mindbodyresetgals) in multiple places on FPU page
- [x] Hero photo: crop/zoom closer to Lee Anne's face
- [x] Remove "Women 40+" from credential badges
- [x] Add Q&A box to benefits grid to make 12 boxes (4x3 even grid)
- [x] Move "You don't need to have it all figured out..." sentence UNDER the checkmarks box
- [x] Cohort details: add "Every Tuesday 6:30 PM to 7:15 PM" under May 12 start date
- [x] Move Cohort Details section ABOVE "This 9 Weeks Is For You If..." section
- [x] Update pricing: $129 All Access / $99 Basic with feature details
- [x] Add class sign-up link: https://www.financialpeace.com/app/classes/299D07
- [x] Add Dave Ramsey Store link for kit purchase
- [x] Rename /feel-great-system route to /unicity
- [x] Add "Unicity" to nav bar
- [x] Update Unicity page SEO metadata (title, keywords, description)
