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
