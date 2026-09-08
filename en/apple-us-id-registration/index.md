# Foreign Apple ID Registration: Four Paths That Work


Registering an Apple ID for another region shouldn't be hard, but Apple keeps changing the flow. Most tutorials online record only a single path, and the comments are full of people saying it no longer works. More annoying: after registering, your first App Store login has a chance of being bumped straight back to the China store.

Here I've put together all four methods I could find, plus a complete plan to avoid being sent back to the China store. Not just the US store — the same applies to Turkey, Japan, and Nigeria.

<!-- more -->

{{< image src="/pictures/posts/apple-us-id-three-methods.svg" caption="Four registration paths + tricks to avoid being bounced back to the China store" alt="Comparison of foreign Apple ID registration paths" width="720" class="center" >}}

## Method 1: Register Directly on the iCloud Website (Recommended, US Store)

The fewest steps and fewest restrictions.

1. Open [icloud.com](https://www.icloud.com/) in a browser on your phone or computer
2. Tap "Create Apple ID" at the bottom of the sign-in page
3. Use a purely English name and pick "United States" as the country/region
4. Enter an email (Gmail / Outlook, one never used for an Apple ID) and a password
5. A +86 mainland number works fine for the phone field, even if it's already bound to another Apple ID
6. Once verification is done, open the App Store on your iPhone, sign out of the current account, and sign in with the newly registered ID
7. A popup will say your information is incomplete → tap "Review" → agree to the terms → fill in a US address and phone number

Address generators are easy to find; for example, on [meiguodizhi.com](http://www.meiguodizhi.com/usa-address/oregon) pick Oregon (a sales-tax-free state).

**Critical detail**: the payment menu defaults to sitting on the credit card option. **Do not tap Credit Card or PayPal** — just scroll down and pick "None," then fill in the address. Once you've tapped credit card, you must enter a card number and there's no going back.

This path needs no global proxy, no computer, no Android phone — five minutes in a phone browser and you're done.

## Method 2: Register at account.apple.com + a Safari Redirect (Works for Any Region)

This method isn't limited to the US store — Turkey, Japan, Nigeria, and Hong Kong all work too. Currently the most universal path.

1. Open [account.apple.com](https://account.apple.com/) in a private/incognito browser window; proxy on or off, both fine
2. Click "Create Your Apple Account"
3. Fill in details for your target region (for Turkey, generate a name and address with a [Turkey address generator](https://1ktools.com/zh-cn/tools/developer/turkey-address-generator))
4. Select the target country, use a brand-new email (163 mail works too; avoid QQ mail), and a +86 number is fine
5. After verifying, **do not sign in to the App Store right away** — signing in directly will most likely bounce you to the China store

### Force the region switch with a Safari redirect link

This is the critical step. First sign out of the current App Store account:

- iOS 26: Settings → Apple Account at the top → Media & Purchases → Sign Out
- Mac: App Store → Store → Sign Out

Then paste the matching redirect link in **Safari**:

| Region | Link |
|------|------|
| United States | `itms-apps://itunes.apple.com/WebObjects/MZStore.woa/wa/resetAndRedirect?dsf=143441&cc=us` |
| Turkey | `itms-apps://itunes.apple.com/WebObjects/MZStore.woa/wa/resetAndRedirect?dsf=143480&cc=tr` |
| Japan | `itms-apps://itunes.apple.com/WebObjects/MZStore.woa/wa/resetAndRedirect?dsf=143462&cc=jp` |
| South Korea | `itms-apps://itunes.apple.com/WebObjects/MZStore.woa/wa/resetAndRedirect?dsf=143466&cc=kr` |
| Hong Kong | `itms-apps://itunes.apple.com/WebObjects/MZStore.woa/wa/resetAndRedirect?dsf=143463&cc=hk` |
| Nigeria | `itms-apps://itunes.apple.com/WebObjects/MZStore.woa/wa/resetAndRedirect?dsf=143561&cc=ng` |
| India | `itms-apps://itunes.apple.com/WebObjects/MZStore.woa/wa/resetAndRedirect?dsf=143467&cc=in` |

Safari will ask to open the App Store — allow it. If you see "Cannot Connect to App Store" after entering the verification code, that's normal; it means the region-switch request already went out. Then sign in with the newly registered ID and check that the country is correct.

## Method 3: Create on apple.com, Then Switch Regions

The old method — a few more steps, but still works.

1. Open [apple.com](https://www.apple.com/) (a US global proxy is recommended)
2. Create an account and **choose China first** — a US region with a +86 phone number won't pass verification
3. Use Gmail / Outlook for email (QQ mail most likely fails)
4. Complete both email and phone verification
5. Go to your personal account → Country or Region → change to the United States
6. Agree to the terms twice to reach the payment page

**The payment method list must show "None".** If "None" is missing from the dropdown, your proxy isn't set up right or your IP is being detected as non-US. Retry with a global US proxy.

For the billing address, pick a sales-tax-free state: Oregon (OR), Delaware (DE), Montana (MT), New Hampshire (NH), or Alaska (AK).

{{< image src="/pictures/posts/apple-us-id-registration-flow.svg" caption="The full apple.com region-switch flow" alt="US Apple ID registration flowchart" width="720" class="center" >}}

## Method 4: Register via Apple Music on Android (Not Recommended)

The flow looks the simplest:

1. Get an Android phone and install Apple Music
2. Create an Apple account with the country set to the United States
3. Sign in to that account on your iPhone

But in practice the problem is obvious: **an ID registered this way works with Apple Music, yet signing in to the App Store throws "Cannot update account, an unknown error occurred"**.

The reason: IDs created through Apple Music haven't completed two-factor authentication, so you need to go to [icloud.com](https://www.icloud.com/) to sign in, bind a phone number, and finish the profile. After that it works for some people; others report it still fails.

If you happen to have an Android phone and only need Apple Music, give it a try. For the App Store's sake, this detour isn't worth it.

## Avoiding the Bounce Back to the China Store

Whichever method you use, your first App Store login has a chance of being reset to the China store. Combining several sources, the full anti-bounce routine is:

1. **Change the time zone before signing in**: set your iPhone's time zone to the target country first (Los Angeles/New York for the US, Istanbul for Turkey)
2. **Use the Safari redirect link**: the links from Method 2 — paste one straight into Safari and hit enter, forcing the App Store onto the target region
3. **Download an app immediately after signing in**: any free app will do. This step matters — if you sign out without downloading, the next login will most likely land you back in the China store

If you've already been bounced back, redo the region switch on the web, or reuse the Safari redirect link, then go through the sign-in flow again.

## Switching App Store Accounts Without Verification Codes

After registering a foreign ID, switching between the China and foreign accounts in the App Store asks for a verification code every time — annoying. The fix:

1. Open the stock "Mail" app on iOS
2. Add the email account tied to the foreign ID
3. Verify and bind it

Once bound, switching App Store accounts no longer needs a verification code — one tap and it switches.

## A Few Extra Details

**One phone number can be bound to Apple IDs in multiple regions.** People have bound the same +86 number to China, US, Turkey, Nigeria, and Hong Kong IDs with no conflict.

**Gift card redemption needs a mobile device.** A Mac can't be used to pay or redeem gift cards; you need an iPhone or iPad. Topping up with Turkish gift cards lets you subscribe to ChatGPT Plus at local pricing, roughly 80 RMB.

**Choosing "None" requires no card.** But it only works for newly registered IDs. If you don't see the "None" option, check your proxy or retry on another device.

## The Four Paths Compared

| Method | App Store works | Regions | Proxy needed | Extra device |
|------|:-:|:-:|:-:|:-:|
| iCloud direct signup | ✅ | Mainly US | No | None |
| account.apple.com + Safari | ✅ | Any region | No | None |
| apple.com region switch | ✅ | US | Yes | A computer helps |
| Android Apple Music | ⚠ Unstable | US | No | Needs an Android phone |

For the US store only, Method 1 is the simplest. For Turkey, Japan, or other regions, use Method 2's Safari redirect links. Keep Method 3 as a backup. Method 4 isn't recommended.

---

Sources: [linux.do US-store tutorial](https://linux.do/t/topic/1553008) / [Android Music addendum](https://linux.do/t/topic/1364474) / [Turkey registration guide](https://linux.do/t/topic/2021625)

Related: {{< ref "posts/2026-05-20-sms-verification-platforms.md" >}}

