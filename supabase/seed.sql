-- ============================================================================
-- PromptVault — demo seed data (optional)
-- Run AFTER schema.sql. Creates 4 demo creators (password: password123) and
-- 8 public prompts with likes and copy counts so the feed is alive instantly.
-- Safe to re-run (idempotent, fixed UUIDs).
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Demo auth users (the on_auth_user_created trigger creates their profiles)
-- ----------------------------------------------------------------------------
insert into auth.users (instance_id, id, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data, is_super_admin, role, aud)
values
  ('00000000-0000-0000-0000-000000000000', '11111111-1111-1111-1111-111111111111', 'mia@promptvault.app',   crypt('password123', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{"username":"midjourney_mia"}', false, 'authenticated', 'authenticated'),
  ('00000000-0000-0000-0000-000000000000', '22222222-2222-2222-2222-222222222222', 'kate@promptvault.app',  crypt('password123', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{"username":"copykate"}',       false, 'authenticated', 'authenticated'),
  ('00000000-0000-0000-0000-000000000000', '33333333-3333-3333-3333-333333333333', 'dev@promptvault.app',   crypt('password123', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{"username":"codewright"}',     false, 'authenticated', 'authenticated'),
  ('00000000-0000-0000-0000-000000000000', '44444444-4444-4444-4444-444444444444', 'sam@promptvault.app',   crypt('password123', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{"username":"promptmaster"}',   false, 'authenticated', 'authenticated')
on conflict (id) do nothing;

-- ----------------------------------------------------------------------------
-- Polish the demo profiles
-- ----------------------------------------------------------------------------
update public.profiles set bio = 'AI art director. I turn Midjourney chaos into repeatable formulas.', avatar_url = 'https://api.dicebear.com/9.x/shapes/svg?seed=mia'   where id = '11111111-1111-1111-1111-111111111111';
update public.profiles set bio = 'Conversion copywriter. Frameworks that sell without shouting.',      avatar_url = 'https://api.dicebear.com/9.x/shapes/svg?seed=kate'  where id = '22222222-2222-2222-2222-222222222222';
update public.profiles set bio = 'Staff engineer. Prompts for reviews, refactors and rubber ducks.',   avatar_url = 'https://api.dicebear.com/9.x/shapes/svg?seed=dev'   where id = '33333333-3333-3333-3333-333333333333';
update public.profiles set bio = 'Productivity systems nerd. Prompts that give you hours back.',       avatar_url = 'https://api.dicebear.com/9.x/shapes/svg?seed=sam'   where id = '44444444-4444-4444-4444-444444444444';

-- ----------------------------------------------------------------------------
-- Public prompts
-- ----------------------------------------------------------------------------
insert into public.prompts (id, user_id, title, content, category, tags, is_public, copy_count, created_at)
values
  ('aaaaaaaa-0000-0000-0000-000000000001', '33333333-3333-3333-3333-333333333333',
   'Senior Code Reviewer Persona',
   'You are a senior software engineer with 15 years of experience across large codebases. Review the code below with the following priorities, in order: (1) correctness and edge cases, (2) security vulnerabilities, (3) performance, (4) readability and naming. For each issue, cite the exact line, explain the risk, and show a corrected version. End with a one-paragraph summary of overall code quality and the single most important fix. Do not rewrite the whole file unless asked.',
   'Coding', array['code-review','senior','debugging'], true, 41, now() - interval '9 days'),

  ('aaaaaaaa-0000-0000-0000-000000000002', '33333333-3333-3333-3333-333333333333',
   'Regex Builder & Explainer',
   'Act as a regex expert. I will describe the text I want to match in plain English. Respond with: 1) the regex pattern in a code block, 2) a plain-English breakdown of each token, 3) three test strings that SHOULD match, 4) three that should NOT match, 5) one edge case where this pattern could break and how to harden it. Ask one clarifying question first if my description is ambiguous.',
   'Coding', array['regex','explanation'], true, 27, now() - interval '6 days'),

  ('aaaaaaaa-0000-0000-0000-000000000003', '22222222-2222-2222-2222-222222222222',
   'PAS Email Framework',
   'Write a marketing email using the Problem–Agitate–Solve framework. Product: [PRODUCT]. Audience: [AUDIENCE]. Subject line: under 50 characters, curiosity-driven, no clickbait. Structure: Hook (1 sentence naming the problem), Agitate (2 short paragraphs making the pain visceral with a relatable scenario), Solve (introduce the product as the turning point, 3 bullet benefits tied to the pain), CTA (single button text, urgency without fake scarcity). Tone: warm, direct, like a smart friend. Under 200 words.',
   'Copywriting', array['email','framework','conversion'], true, 35, now() - interval '4 days'),

  ('aaaaaaaa-0000-0000-0000-000000000004', '22222222-2222-2222-2222-222222222222',
   'Landing Page Hero Generator',
   'You are a conversion copywriter. Given the product description below, generate 5 hero section variants. Each variant has: a headline (max 8 words, outcome-focused), a subheadline (max 20 words), and a CTA button label (2–4 words). Vary the angles across the 5: pain-point, aspiration, social proof, curiosity, and direct offer. Then recommend the strongest one for a cold audience and explain why in 2 sentences. Product: [PRODUCT DESCRIPTION]',
   'Marketing', array['landing-page','copy','cta'], true, 22, now() - interval '3 days'),

  ('aaaaaaaa-0000-0000-0000-000000000005', '44444444-4444-4444-4444-444444444444',
   'Meeting Notes → Action Items',
   'You are an executive assistant. Transform the raw meeting notes below into: 1) a 3-sentence summary of what was discussed, 2) a decisions table (Decision | Rationale | Owner), 3) action items sorted by priority (Action | Owner | Due date if mentioned | Related decision), 4) open questions that need a follow-up meeting. Flag any action item that lacks a clear owner and assign a placeholder [OWNER?]. Be terse; no filler sentences.',
   'Productivity', array['meetings','summarizer','actions'], true, 48, now() - interval '2 days'),

  ('aaaaaaaa-0000-0000-0000-000000000006', '44444444-4444-4444-4444-444444444444',
   'Weekly Deep Work Planner',
   'Act as a productivity coach. My week: [LIST COMMITMENTS]. My #1 priority this week: [GOAL]. Build a deep-work plan: 1) pick the 3 highest-leverage outcomes, 2) schedule 90-minute deep work blocks around my commitments (morning preferred), 3) for each block, write the exact first physical action to start, 4) list what I should SAY NO to or defer, 5) a 5-line Friday review checklist. Protect at least one full meeting-free afternoon. Format as a clean Markdown schedule.',
   'Productivity', array['planning','deep-work','weekly'], true, 19, now() - interval '30 hours'),

  ('aaaaaaaa-0000-0000-0000-000000000007', '11111111-1111-1111-1111-111111111111',
   'Midjourney Product Photography',
   'Midjourney prompt formula for premium product shots: [PRODUCT] + [SURFACE] + lighting + lens + mood. Use this skeleton: "commercial product photography of [PRODUCT] on [SURFACE], [LIGHTING: softbox rim light / golden hour window light], shot on [85mm f/1.4 / macro 100mm], shallow depth of field, [MOOD: minimalist / dramatic / warm], muted color grade, subtle reflection, 8k --ar 4:5 --style raw --v 6". Give me 4 variations: studio minimal, lifestyle, luxury dark, and flat-lay top-down. Replace bracketed values with my product: [DESCRIBE PRODUCT].',
   'Art/Midjourney', array['midjourney','product','photography'], true, 56, now() - interval '20 hours'),

  ('aaaaaaaa-0000-0000-0000-000000000008', '11111111-1111-1111-1111-111111111111',
   'Cinematic Portrait Prompt Builder',
   'Build a cinematic Midjourney portrait prompt from my subject description. Formula: [SUBJECT] + wardrobe + environment + light + camera + film stock + mood. Skeleton: "cinematic portrait of [SUBJECT], wearing [WARDROBE], in [ENVIRONMENT], [LIGHT: neon rim light / overcast window light / tungsten practicals], shot on [ARRI Alexa 65 / Kodak Portra 800], [LENS: 35mm anamorphic / 50mm], [MOOD: melancholic / triumphant / tense], film grain, teal and orange grade --ar 2:3 --style raw". Output 3 distinct moods with the full prompt written out, plus one negative-prompt tip.',
   'Art/Midjourney', array['midjourney','portrait','cinematic'], true, 33, now() - interval '8 hours')
on conflict (id) do nothing;

-- ----------------------------------------------------------------------------
-- Likes between demo users (makes "Trending" interesting)
-- ----------------------------------------------------------------------------
insert into public.likes (prompt_id, user_id)
values
  ('aaaaaaaa-0000-0000-0000-000000000001', '22222222-2222-2222-2222-222222222222'),
  ('aaaaaaaa-0000-0000-0000-000000000001', '44444444-4444-4444-4444-444444444444'),
  ('aaaaaaaa-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111'),
  ('aaaaaaaa-0000-0000-0000-000000000003', '44444444-4444-4444-4444-444444444444'),
  ('aaaaaaaa-0000-0000-0000-000000000003', '33333333-3333-3333-3333-333333333333'),
  ('aaaaaaaa-0000-0000-0000-000000000005', '22222222-2222-2222-2222-222222222222'),
  ('aaaaaaaa-0000-0000-0000-000000000005', '33333333-3333-3333-3333-333333333333'),
  ('aaaaaaaa-0000-0000-0000-000000000005', '11111111-1111-1111-1111-111111111111'),
  ('aaaaaaaa-0000-0000-0000-000000000007', '22222222-2222-2222-2222-222222222222'),
  ('aaaaaaaa-0000-0000-0000-000000000007', '33333333-3333-3333-3333-333333333333'),
  ('aaaaaaaa-0000-0000-0000-000000000007', '44444444-4444-4444-4444-444444444444'),
  ('aaaaaaaa-0000-0000-0000-000000000002', '44444444-4444-4444-4444-444444444444'),
  ('aaaaaaaa-0000-0000-0000-000000000008', '22222222-2222-2222-2222-222222222222')
on conflict (prompt_id, user_id) do nothing;
