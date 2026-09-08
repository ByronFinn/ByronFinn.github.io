# Third-Party Telegram Clients: What to Use and What to Avoid


Conclusion first: there are a lot of third-party Telegram clients, quality varies wildly, and you should avoid the closed-source ones as a rule. Since 2021, Telegram has required first-time registration to receive its verification code on the official mobile client — desktop and third-party clients can't register directly. That's already a signal.

<!-- more -->

{{< image src="/pictures/posts/third-party-telegram-clients-overview.svg" caption="Third-party Telegram clients by platform: an overview" alt="Distribution of third-party Telegram clients" title="Third-party Telegram client distribution" width="800" class="center" >}}

This post is a curated list. The source is a roundup post by [Telegram's @LCGFX](https://t.me/LCGFX/2794); I've reorganized it by platform and added open-source status and risk judgments.

✅ means open source; ❌ means closed source.

## Android

Android is the most active platform for third-party clients, because Telegram's official Android app is itself open source (GPL v2), so the barrier to forking is low.

### Open-Source Clients (Relatively Safe)

| Client | Channel | Notes |
|--------|------|------|
| **Telegram X** | [@tgx_log](https://t.me/tgx_log) | Official product, not third-party, no risk |
| **Nekogram** | [@NekoUpdates](https://t.me/NekoUpdates) | Long-standing third-party option, feature-rich, actively maintained |
| **NekogramX** | [@NekogramX](https://t.me/NekogramX) | The X fork of Nekogram |
| **Nagram** | [@nagram_channel](https://t.me/nagram_channel) | A secondary modification based on Nekogram |
| **Nnngram** | [@Nnngram](https://t.me/Nnngram) | Same family |
| **Nullgram** | [@NullgramClient](https://t.me/NullgramClient) | Removes some official restrictions |
| **AyuGram** | [@ayugram1338](https://t.me/ayugram1338) | Focused on customization and privacy options |
| **Cherrygram** | [@Cherry_gram](https://t.me/Cherry_gram) | UI-focused polish |
| **exteraGram** | [@exteraGram](https://t.me/exteraGram) | Material Design style |
| **Forkgram** | [@forkgram](https://t.me/forkgram) | A simple fork, minor changes |
| **Telegraher** | [@telegraher](https://t.me/telegraher) | The name is a pun |
| **OctoGram** | [@OctoGramApp](https://t.me/OctoGramApp) | Feature-oriented |
| **Mercurygram** | [@Mercurygram](https://t.me/Mercurygram) | — |
| **moeGramX** | [@moeGramX](https://t.me/moeGramX) | Anime-flavored |

### Closed-Source Clients (Use with Caution)

| Client | Channel | Risk |
|--------|------|--------|
| **Plus** | [@plusmsgr](https://t.me/plusmsgr) | Closed source, cannot be audited |
| **Turrit** | [@TurritTips](https://t.me/TurritTips) | Closed source |
| **MDGram** | [@MDGramUpdates](https://t.me/MDGramUpdates) | Closed source |
| **Ninjagram** | [@tele_ninja](https://t.me/tele_ninja) | Closed source |
| **BGram** | [@BGramChannel](https://t.me/BGramChannel) | Closed source |
| **iMe** | [@ime_en](https://t.me/ime_en) | Closed source, ships a built-in wallet and more |
| **GraphMessenger** | [@graphmessenger](https://t.me/graphmessenger) | Closed source |
| **Nicegram** | [@nicegramapp](https://t.me/nicegramapp) | Closed source, also on iOS |
| **RitMGram** | [@RitMGram](https://t.me/RitMGram) | Closed source |
| **HuIugram** | [@hulugramupdate](https://t.me/hulugramupdate) | Closed source |
| **Aka** | [@aka_messenger](https://t.me/aka_messenger) | Closed source |

Closed source means there's no way to confirm it isn't doing something extra in the background. Telegram's account system is bound to your phone number, so a client that does something it shouldn't has far more serious consequences than an ordinary app.

## iOS

iOS has far fewer third-party clients. Telegram's iOS app is open source too, but iOS code signing makes distribution outside the App Store a hassle.

| Client | Channel | Open source | Notes |
|--------|------|------|------|
| **Swiftgram** | [@swiftgram](https://t.me/swiftgram) | ✅ | One of the few open-source options on iOS |
| **Nicegram** | [@nicegramapp](https://t.me/nicegramapp) | ❌ | Same as the Android version |
| **iMe** | [@ime_en](https://t.me/ime_en) | ❌ | Same as the Android version |
| **Revgram** | [@RevgramApp](https://t.me/RevgramApp) | ❌ | — |
| **Turrit** | [@TurritTips](https://t.me/TurritTips) | ❌ | Same as the Android version |
| **Aka** | [@aka_messenger](https://t.me/aka_messenger) | ❌ | Same as the Android version |

If you must use a third-party client on iOS, Swiftgram is the only open-source option; I can't recommend the rest.

## Windows / macOS / Linux Desktop

| Client | Platform | Channel | Open source |
|--------|------|------|------|
| **64Gram** | Win / macOS | [@tg_x64](https://t.me/tg_x64) | ✅ |
| **Unigram** | Win | [@unigram](https://t.me/unigram) | ✅ |
| **AyuGram** | Win | [@ayugram1338](https://t.me/ayugram1338) | ✅ |
| **Forkgram** | Win | [@forkgram](https://t.me/forkgram) | ✅ |
| **Kotatogram** | Win / macOS | [@kotatogram](https://t.me/kotatogram) | ✅ |
| **materialgram** | Win / macOS / Linux | [@materialgram](https://t.me/materialgram) | ✅ |
| **iMe** | Win | [@ime_en](https://t.me/ime_en) | ❌ |

Desktop is in much better shape — everything except iMe is open source. 64Gram and materialgram are the mainstream picks.

## WearOS

| Client | Source | Open source |
|--------|------|------|
| **HandyGram** | [@handygram_client](https://t.me/handygram_client) | ✅ |
| **Telewatch** | [GitHub](https://github.com/gohj99/Telewatch) | ✅ |

Options on WearOS are thin; both are open source, with HandyGram somewhat more active.

{{< image src="/pictures/posts/third-party-telegram-clients-safety.svg" caption="A safety decision flow for third-party clients" alt="Third-party client selection decision tree" title="Selection decision tree" width="800" class="center" >}}

## How to Choose

A few simple principles:

1. **If an open-source option exists, don't touch the closed-source one.** Auditable code is the most basic security guarantee.
2. **Check maintenance cadence.** A client that hasn't updated in six months — even open source — may carry unfixed security issues. Check the last update time on its GitHub or channel.
3. **Telegram X is the official alternative, not third-party.** On Android, if you just want a different experience from the official client, Telegram X is the safest choice.
4. **Don't lust after features.** Some third-party clients advertise things like faking read receipts or hiding online status — these features may themselves violate the Telegram ToS, and your account risks being restricted.

The original roundup is from [@LCGFX](https://t.me/LCGFX); if you're interested, check the comments on the original post for updates.

