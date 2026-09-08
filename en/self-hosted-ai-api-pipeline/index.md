# Self-Hosted AI API Pipeline: From Domain Email to Sub2API


I originally wrote this post for a friend; I'm just cleaning it up a bit and publishing it.

I'll assume you've never touched domain email, Cloudflare Workers, SMS-code platforms, registration bots, or AI API relays before. Wherever possible I'll explain things in terms of "why this step exists" and "how to confirm you did it right". When you get stuck, you can just paste the error into an AI and ask — in my testing, Codex handles this kind of deployment doc and config troubleshooting reasonably well. But sanitize API keys, passwords, cookies, and tokens before sending them to an AI. Don't ask me how I know.

Once everything is set up, the structure looks like this:

- Your own domain, used to generate email addresses
- A disposable email service deployed on Cloudflare, receiving verification emails
- An SMS-code platform, receiving SMS verification codes
- A registration bot, chaining together the email, SMS code, and other steps
- A Sub2API service, consolidating and distributing AI APIs

Boundary first: this article only documents building and testing an environment for personal use. Please follow the terms of service of the target services — do not use this for unauthorized automated registration or resource abuse.

## First, Let's Define a Few Terms

If you already know these, skip ahead.

### Domain

A domain is a name you buy on the internet, like `example.com`. Once you have one, you can set up lots of email addresses: `a@example.com`, `test@example.com`, `anything@example.com`. Later on, we'll use your own domain to receive signup verification codes.

### DNS

DNS is the domain's signpost system. The records you add in Cloudflare tell the internet where to find each service when someone visits the domain. This tutorial needs DNS because email, subdomains, and Cloudflare services all rely on DNS to point the way.

### Cloudflare

Cloudflare is a popular domain hosting and network services platform. Here we mainly use it for three things: managing domain DNS, deploying cloudflare\_temp\_email, and binding our own email domain or subdomains.

### Disposable Email

A disposable email service is a lightweight service for receiving mail. We'll deploy our own with cloudflare\_temp\_email so that our own domain can receive verification emails.

### SMS-Code Platform

Some signup flows require an SMS verification code on top of the email code. SMS-code platforms provide temporary phone numbers to receive those texts. I currently use Hero SMS. This is not an ad and there's no referral — it's just what I use myself. Feel free to swap in another one, as long as the registration bot supports it or you can adapt the API.

### Registration Bot

A registration bot is a tool that automates the signup flow. It typically needs: an email inbox for verification codes, an SMS platform for SMS verification codes, a stable network environment, and a config file telling it what to do at each step.

The one I use is from this linux.do thread: <https://linux.do/t/topic/2129705>. It's in linux.do's trust-level-3 section, so non-TL3 users may not see it. If you're TL2, search the forum for similar keywords — the TL2 section usually has some options too. Once you have a registration bot, don't run it right away; at minimum, read through its config, dependencies, and network requests first.

### Sub2API

Sub2API is not a network proxy tool, nor is it a "convert your proxy subscription into an API" thing. It's an AI API gateway platform: plug upstream accounts or APIs like Claude, OpenAI, and Gemini into one backend, then hand out API keys to downstream tools.

In plain language, it does exactly one thing:

```
Upstream AI accounts / APIs / subscription quotas -> Sub2API -> one unified API key and endpoint -> downstream tools call it
```

It handles: managing multiple upstream accounts or API keys, generating callable API keys for users, auth/billing/rate limiting/concurrency control, scheduling requests across upstreams, and a backend page for reviewing users and usage. The official repo is [Wei-Shaw/sub2api](https://github.com/Wei-Shaw/sub2api).

## The Overall Flow

The overall route first, details later:

1. Buy a domain
2. Move the domain onto Cloudflare
3. Deploy cloudflare\_temp\_email
4. Configure main-domain and subdomain email
5. Sign up on an SMS-code platform and get an API key
6. Deploy or configure Sub2API, with a group ready to receive accounts
7. Prepare the registration bot and check its config
8. Run one signup with a single account first
9. Import the signup results into Sub2API
10. Generate a downstream API key in the Sub2API backend and test a call

Don't chase a fully automatic run on day one. The first time you build this, test each step in isolation and only move on once it checks out. This isn't motivational fluff — it's the conclusion from actually falling into these pits: if you're changing DNS, tweaking environment variables, and running the registration bot all at once, when something breaks you have no idea where to look.

## What You Need

Prepare the following before starting:

| Item | What it's for |
|------|-----------|
| A domain registrar account | Buy the domain |
| A Cloudflare account | Host DNS, deploy the email service |
| A Hero SMS or other SMS-platform account | Receive SMS verification codes |
| A local environment that can run a real browser | Run the registration bot flow — Chrome or Edge |
| The registration bot files or project link | Prepare per the original thread's instructions |
| A Sub2API service | Centrally manage and distribute AI APIs |
| Upstream AI accounts or API keys | Plug into Sub2API as callable resources |
| A server or Docker environment | Deploy Sub2API |

If you're just reading along, no rush to buy a domain — but once you actually run the pipeline, the domain, Cloudflare, and an SMS platform are hard to avoid.

## 1. Buy a Domain

Step one is buying your own domain. It doesn't need to be expensive — an ordinary TLD is fine.

A few things to keep in mind when picking one: keep it short — it makes config entry easier later; avoid anything that looks like a bulk-registration domain; stick to common TLDs over obscure ones; and check for an obvious dark history first. A domain previously used to send spam will make receiving verification codes absolutely painful later.

After buying it, find the Nameserver or DNS Server settings in the registrar's dashboard, because the next step hands the domain over to Cloudflare. Every registrar names the entry differently; common spots are menus like "Domain Management", "DNS Management", or "Nameserver".

## 2. Move the Domain onto Cloudflare

The goal is to let Cloudflare take over your domain's DNS.

Rough steps: log in to Cloudflare → Add a site → enter the domain you just bought → choose the free plan → Cloudflare gives you two nameservers → go back to your registrar and replace the old nameservers with the Cloudflare ones → wait for it to take effect.

How to confirm you did it right:

- The domain shows Active in Cloudflare
- You can see your domain on Cloudflare's DNS page
- Adding DNS records later doesn't error out

This step can take anywhere from minutes to hours. Waiting for DNS the first time is agonizing, but a wrong config won't necessarily throw an immediate error — so don't keep re-editing just because it hasn't taken effect yet; too many changes and you'll lose track of what you did.

## 3. Deploy cloudflare\_temp\_email

The goal is a disposable email service that can receive mail.

cloudflare\_temp\_email is a Cloudflare-based disposable email project, built mainly on Workers, Pages, D1, and Email Routing. Once deployed, your own domain can receive mail: `test@example.com`, `abc@example.com`, `anything@example.com` — the registration bot later uses these addresses to receive verification codes.

Project links:

- GitHub repo: [dreamhunter2333/cloudflare\_temp\_email](https://github.com/dreamhunter2333/cloudflare_temp_email)
- Deployment docs: <https://temp-mail-docs.awsl.uk>
- On-site 2026 illustrated tutorial: a beginner-friendly guide to self-hosting a Cloudflare disposable email (domain email)
- AI-assisted deployment reference: deploying a Cloudflare disposable email with Claude Code in 20 minutes

The project's documentation is fairly complete; officially it supports CLI, Cloudflare dashboard UI, and GitHub Actions deployments. If you'd rather not configure everything manually line by line, hand the project README, the deployment docs, and your domain details to an AI and let it break the work into steps, check your config, and debug. Again: never send real API keys, passwords, or backend tokens out; sanitize before debugging. Manual deployment works too — there should be related tutorials on this site as well.

**Email Routing is the easiest thing to get wrong here.** The domain's DNS must be hosted on Cloudflare first, with Email Routing enabled and the corresponding mail DNS records issued. After the Worker is deployed, you must also route the domain's Catch-all delivery to the Worker. Deploying only the Worker or Pages without configuring Email Routing / Catch-all means verification emails will never arrive. If you just want to understand how Cloudflare email routing, Catch-all, and forwarding inboxes work first, read this site's piece: unlimited domain email forwarding with Cloudflare.

Starting from zero, follow this minimal path:

1. Confirm the domain shows Active in Cloudflare
2. Enable email routing under Cloudflare's Email Routing
3. Add or confirm the mail DNS records as Cloudflare prompts
4. Deploy the cloudflare\_temp\_email backend Worker
5. Create and bind the D1 database the project needs
6. Deploy the frontend Pages, or attach the frontend assets to the Worker per the project docs
7. In Email Routing, deliver the Catch-all address to this Worker
8. Open the email web page and create or enter a test address
9. Send a plain test email from your everyday inbox first
10. Then test a verification email in some low-stakes scenario

Get the email service working by itself before wiring up the registration bot. Don't change DNS, change environment variables, and run the bot simultaneously — problems become very hard to localize.

After deployment, manually verify the mailbox can receive mail. How: open the deployed email page → generate or type any test address → send it a test email from your everyday inbox → check whether the page receives it → then test a verification email once.

How to confirm you did it right:

- The email page opens
- The test email arrives
- The verification email arrives
- Latency is within acceptable range
- Once the registration bot's email channel is configured, it can also create addresses and read mail

If plain email arrives but verification email doesn't, it could be the target platform filtering, misconfigured email routing, or domain reputation. Domain reputation is pretty much voodoo — luck plays a sizable role.

## 4. Configure Main-Domain and Subdomain Email

The goal is to separate mailboxes by purpose so problems are easier to trace later.

The simplest approach is using main-domain addresses directly: `test@example.com`, `user001@example.com`, `user002@example.com`.

To split different tasks apart, you can also use subdomains:

| Subdomain | Example address | Purpose |
|--------|---------|------|
| a.example.com | test@a.example.com | Task A |
| b.example.com | test@b.example.com | Task B |
| test.example.com | abc@test.example.com | Testing |

The benefit: if one group of addresses has problems, the others are unaffected. When configuring, read the cloudflare\_temp\_email docs closely — add whichever MX, TXT, CNAME, or routing records it asks for, exactly as asked. Test the main domain and each subdomain separately; never assume that because the main domain receives mail, the subdomain will too.

**Subdomains need Email Routing enabled separately**, each with its own mail DNS records and Catch-all. Enabling Email Routing only on the main domain `example.com` does not automatically cover subdomains. Cloudflare won't do this for you — you have to add each one yourself.

Beginners should get things working with the main domain only first — start by testing `test@example.com`. Once the main domain receives mail reliably, add subdomains. Each time you add one, repeat the verification: mail DNS records + Catch-all + an actual receive test.

How to confirm you did it right:

- Main-domain mailboxes receive mail
- Subdomain mailboxes receive mail
- Each subdomain can be tested independently

## 5. Sign Up on an SMS-Code Platform

The goal is a working SMS verification code API.

I use Hero SMS. Again, not an ad — just my current setup. There are many SMS platforms; any of them works, as long as it can reliably receive texts for your target service.

Beginner advice: top up a small amount to test first — don't dump in a big pile right away; judge by success rate, not price; test the exact service you plan to register for first; never share your API key with anyone or post screenshots of it. If an SMS platform API key leaks, people will drain the balance — I've seen it happen several times in various groups already.

Hero SMS is at <https://hero-sms.com>. After signing up, locate the balance, service selection, number acquisition, and API key pages. Menu names vary between platforms, but the logic is basically the same: top up → pick the target service → get a number → wait for the code → paste the API key into the registration bot.

SMS receive test flow:

1. Log in to the SMS platform
2. Choose a country or region
3. Choose the target service
4. Get a phone number
5. Write down the number and the order / activationId
6. Enter the number in the target service
7. Wait for the SMS code
8. Confirm the platform displays the code

How to confirm you did it right:

- You can get a number
- The SMS code arrives
- Codes arrive without noticeable timeouts
- Balance deductions match expectations

If the registration bot supports a manual phone number mode, save the activationId too. Some scripts later query SMS status by activationId; if you only saved the number, the script may have to look the order up in reverse, and if that fails, it stalls.

Where to look first for common problems:

- Can't get a number: check target service, country/region, platform balance
- Got a number but no code: has the number been used before; does the target service support that region
- Code takes forever: platform latency, carrier latency, target service rate limiting
- Billing looks wrong: platform order status, cancellation rules, balance history

## 6. Prepare and Check the Registration Bot

The goal is to get the registration bot — but don't rush to run it.

I use the one from this linux.do thread: <https://linux.do/t/topic/2129705>. It's in the TL3 section, so non-TL3 users may not see it. If you can't, search the forum for similar keywords — the TL2 section has some options too. When searching, prioritize recent replies and check the title status; skip threads marked closed, dead, or unusable as your primary option. Once found, have an AI do a security pass for you before adapting the config to your environment.

I won't go into the registration bot's internals here — follow the original thread for usage. Conceptually, it's an automation tool driven by a real local browser; its core job is chaining together SMS codes, email codes, login authorization results, or API credential acquisition. The sturdier approach today isn't full automation from the start, but getting it working semi-automatically first: keep the phone number, email, and code steps manual where possible, confirm the chain works, then automate step by step.

How it relates to the earlier services:

- The SMS platform supplies SMS verification codes
- cloudflare\_temp\_email serves as the self-hosted email channel — usually the "legacy" email mode in the registration bot — for creating mailboxes and polling for email codes
- Email can also be handled manually at first, or via another email channel the bot supports
- Sub2API is not the bot's network proxy — it's the API gateway that later receives and manages the signup results

If code isn't your thing, have an AI or someone who reads code check a few things for you: does it send email details, SMS API keys, or account passwords anywhere unfamiliar; does it download remote scripts and execute them directly; is there obvious obfuscation, encrypted strings, or suspicious domains; does it print the entire config file to logs; does it support the email service, SMS platform, and target service you're using; do any config defaults point at someone else's address or token.

A registration bot's config usually includes:

| Config item | What to fill in | Notes |
|--------|--------|------|
| Email domain | example.com | Used to generate signup addresses |
| Email service URL | Your email service URL | The cloudflare\_temp\_email access address |
| Email admin password | Your email admin password | Usually required when using the self-hosted email channel |
| Email site password | Fill in per your setup | Required if the email site has an access password |
| SMS platform API key | Your SMS platform key | Obtain from Hero SMS or another platform |
| Phone number / activationId | Fill in per your setup | Worth saving with manual SMS receiving |
| Network config | Per your environment | For when the bot needs a proxy or custom network |
| Sub2API import config | Per your backend | Prepare in advance for automatic result import |
| Target count | Start with 1 | Get one account through the full flow first |

Before the first run, confirm all of this: local Chrome or Edge opens the target site fine; the bot's dependencies are installed; the config file loads properly; the email service URL opens; the email channel can create mailboxes or read existing ones; the SMS platform can produce numbers and codes; if importing into Sub2API, the backend URL, admin account, and group name are ready; target count is set to 1.

Run exactly one account the first time. The point is verifying the full flow works, not speed.

## 7. Deploy and Configure Sub2API

The goal is your own AI API gateway: bring upstream accounts or APIs under one roof, then issue callable API keys to downstream tools.

The correct Sub2API chain:

```
Upstream AI accounts / API keys -> Sub2API backend -> downstream API keys -> tools or clients call them
```

It does not hand network proxies to the registration bot. It's better thought of as an "AI API admin backend": plug upstream resources like Claude, OpenAI, and Gemini in, and Sub2API handles unified auth, forwarding, scheduling, usage stats, and API key distribution.

Official repo: [Wei-Shaw/sub2api](https://github.com/Wei-Shaw/sub2api)

On-site deployment reference: sub2API deployment (manual Docker Compose edition)

The official README offers three deployment methods: Docker Compose for beginners, bringing PostgreSQL and Redis along in one go; script installs for Linux servers where you already run PostgreSQL, Redis, and systemd; and building from source for development or customization. Beginners should go with Docker Compose — orchestrating PostgreSQL and Redis together avoids a lot of environment pitfalls.

Before deploying, confirm: you have a reachable Linux server; Docker and Docker Compose are installed; the server firewall opens the ports Sub2API uses; you know the backend URL; you can keep the admin account and password safe; the data directory is persistent for future backup and migration.

Once deployed, open the Sub2API backend and do a few things in order:

1. Create or confirm the admin account
2. Create a group to receive accounts
3. Add upstream AI accounts or API keys
4. Generate a downstream API key, then fill in the base\_url and API key in your client or tool

Here, "upstream" means the accounts or API keys you're putting under Sub2API's management, and "downstream" means the clients or tools that call with the keys Sub2API issues.

If the registration bot supports auto-importing into Sub2API, you generally prepare the backend URL, admin account, password, and group name in advance, so results go straight into Sub2API's account management when a signup finishes. Without auto-import, the bot usually just saves results to a local file, and you import manually or backfill with a script later.

How to confirm you did it right:

- The Sub2API backend opens
- The admin account can log in
- You can add upstream accounts or API keys
- You can generate downstream API keys
- A model request with that API key succeeds

## 8. Run One Full Single-Account Pass

Only start the registration bot after every preceding step has been tested in isolation.

For the first run, test like this: set target count to 1 → use one test mailbox → get one number from the SMS platform → run one complete signup → import the result into Sub2API → generate a downstream API key in Sub2API → test one model request with the key → check the logs to see where it stalls.

Signs the full pipeline works:

- The email code arrives
- The SMS code arrives
- The bot advances to the next step
- Sub2API takes in the upstream resource
- The downstream API key calls successfully
- The run ends with a success or a clear failure reason

When it fails, don't flail around editing a pile of configs. First figure out which layer stalled:

- No email: domain DNS, the email service, or verification email being filtered
- No SMS: the SMS platform, country/region, target service support
- Bot errors: config file, API endpoints, API keys, logs
- Can't log in to Sub2API: service status, port, firewall, admin account
- API key calls fail: upstream account, model permissions, base\_url, auth headers, quota

## FAQ

**Why top up a small amount first?**

SMS platform success rates aren't fixed. The same platform can perform differently with a different country, service, or time of day. A small test top-up avoids the awkwardness of money you can't use. Don't ask me why this item deserves special mention.

**Cloudflare shows Active already — why still no email?**

Active only means the domain's DNS is hosted there; it says nothing about email routing being configured. Check first whether Email Routing is enabled, whether the mail DNS records are issued, and whether Catch-all delivers to the Worker.

**Main domain receives but the subdomain doesn't?**

Subdomains need their own receive chain. The main domain's Email Routing doesn't automatically cover them. Configure mail DNS records and Catch-all for the subdomain, then test with a separate email.

**The Sub2API backend opens, but API key calls fail?**

First check whether the upstream account or API key actually works, then whether the key's group binding, model permissions, balance, and base\_url are correct. The backend opening only proves the service started — it doesn't guarantee upstream calls succeed.

