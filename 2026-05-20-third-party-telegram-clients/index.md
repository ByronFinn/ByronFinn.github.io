# 第三方 Telegram 客户端大合集：谁在维护，谁该避坑


先说结论：第三方 Telegram 客户端数量很多，质量参差不齐，闭源的尽量别碰。2021 年起 Telegram 限制首次注册必须用官方手机客户端收验证码，桌面端和第三方不能直接注册——这已经是一个信号。

<!-- more -->

{{< image src="/pictures/posts/third-party-telegram-clients-overview.svg" caption="第三方 Telegram 客户端按平台分布概览" alt="第三方 Telegram 客户端分布图" title="第三方 Telegram 客户端分布" width="800" class="center" >}}

这篇是一个整理清单，来源是 [Telegram @LCGFX](https://t.me/LCGFX/2794) 的汇总帖，我按平台重新梳理了一遍，补充了开源状态和风险判断。

✅ 表示开源，❌ 表示闭源。

## Android 平台

Android 是第三方客户端最活跃的平台，因为 Telegram 官方 Android 端本身就是开源的（GPL v2），fork 门槛低。

### 开源客户端（相对安全）

| 客户端 | 频道 | 备注 |
|--------|------|------|
| **Telegram X** | [@tgx_log](https://t.me/tgx_log) | 官方出品，不是第三方，无风险 |
| **Nekogram** | [@NekoUpdates](https://t.me/NekoUpdates) | 老牌第三方，功能丰富，维护活跃 |
| **NekogramX** | [@NekogramX](https://t.me/NekogramX) | Nekogram 的 X 分支 |
| **Nagram** | [@nagram_channel](https://t.me/nagram_channel) | 基于 Nekogram 二次修改 |
| **Nnngram** | [@Nnngram](https://t.me/Nnngram) | 同系 |
| **Nullgram** | [@NullgramClient](https://t.me/NullgramClient) | 去除了部分官方限制 |
| **AyuGram** | [@ayugram1338](https://t.me/ayugram1338) | 主打自定义和隐私选项 |
| **Cherrygram** | [@Cherry_gram](https://t.me/Cherry_gram) | UI 定向优化 |
| **exteraGram** | [@exteraGram](https://t.me/exteraGram) | Material Design 风格 |
| **Forkgram** | [@forkgram](https://t.me/forkgram) | 简单 fork，改动不大 |
| **Telegraher** | [@telegraher](https://t.me/telegraher) | 名字有梗 |
| **OctoGram** | [@OctoGramApp](https://t.me/OctoGramApp) | 功能向 |
| **Mercurygram** | [@Mercurygram](https://t.me/Mercurygram) | — |
| **moeGramX** | [@moeGramX](https://t.me/moeGramX) | 二次元向 |

### 闭源客户端（谨慎使用）

| 客户端 | 频道 | 风险点 |
|--------|------|--------|
| **Plus** | [@plusmsgr](https://t.me/plusmsgr) | 闭源，无法审计 |
| **Turrit** | [@TurritTips](https://t.me/TurritTips) | 闭源 |
| **MDGram** | [@MDGramUpdates](https://t.me/MDGramUpdates) | 闭源 |
| **Ninjagram** | [@tele_ninja](https://t.me/tele_ninja) | 闭源 |
| **BGram** | [@BGramChannel](https://t.me/BGramChannel) | 闭源 |
| **iMe** | [@ime_en](https://t.me/ime_en) | 闭源，内置钱包等功能 |
| **GraphMessenger** | [@graphmessenger](https://t.me/graphmessenger) | 闭源 |
| **Nicegram** | [@nicegramapp](https://t.me/nicegramapp) | 闭源，iOS 上也有 |
| **RitMGram** | [@RitMGram](https://t.me/RitMGram) | 闭源 |
| **HuIugram** | [@hulugramupdate](https://t.me/hulugramupdate) | 闭源 |
| **Aka** | [@aka_messenger](https://t.me/aka_messenger) | 闭源 |

闭源的意味着你没法确认它有没有在后台做多余的事。Telegram 的账号体系本身就绑定手机号，客户端如果做了不该做的事，后果比普通 App 严重得多。

## iOS 平台

iOS 第三方客户端少很多，因为 Telegram iOS 端虽然也开源，但 iOS 的签名机制让非 App Store 分发很麻烦。

| 客户端 | 频道 | 开源 | 备注 |
|--------|------|------|------|
| **Swiftgram** | [@swiftgram](https://t.me/swiftgram) | ✅ | iOS 上为数不多的开源选项 |
| **Nicegram** | [@nicegramapp](https://t.me/nicegramapp) | ❌ | 同 Android 版 |
| **iMe** | [@ime_en](https://t.me/ime_en) | ❌ | 同 Android 版 |
| **Revgram** | [@RevgramApp](https://t.me/RevgramApp) | ❌ | — |
| **Turrit** | [@TurritTips](https://t.me/TurritTips) | ❌ | 同 Android 版 |
| **Aka** | [@aka_messenger](https://t.me/aka_messenger) | ❌ | 同 Android 版 |

iOS 上如果要用第三方，Swiftgram 是唯一开源选项，其他都不推荐。

## Windows / macOS / Linux 桌面端

| 客户端 | 平台 | 频道 | 开源 |
|--------|------|------|------|
| **64Gram** | Win / macOS | [@tg_x64](https://t.me/tg_x64) | ✅ |
| **Unigram** | Win | [@unigram](https://t.me/unigram) | ✅ |
| **AyuGram** | Win | [@ayugram1338](https://t.me/ayugram1338) | ✅ |
| **Forkgram** | Win | [@forkgram](https://t.me/forkgram) | ✅ |
| **Kotatogram** | Win / macOS | [@kotatogram](https://t.me/kotatogram) | ✅ |
| **materialgram** | Win / macOS / Linux | [@materialgram](https://t.me/materialgram) | ✅ |
| **iMe** | Win | [@ime_en](https://t.me/ime_en) | ❌ |

桌面端的情况好很多——除了 iMe，其他全部开源。64Gram 和 materialgram 是比较主流的选择。

## WearOS

| 客户端 | 来源 | 开源 |
|--------|------|------|
| **HandyGram** | [@handygram_client](https://t.me/handygram_client) | ✅ |
| **Telewatch** | [GitHub](https://github.com/gohj99/Telewatch) | ✅ |

 WearOS 上的选择不多，两个都开源，HandyGram 更活跃一些。

{{< image src="/pictures/posts/third-party-telegram-clients-safety.svg" caption="第三方客户端安全判断流程" alt="第三方客户端选型决策树" title="选型决策树" width="800" class="center" >}}

## 怎么选

几个简单原则：

1. **能用开源的就不碰闭源的。** 代码可审计是最基本的安全保障。
2. **看维护频率。** 一个半年没更新的客户端，即使开源，也可能存在未修复的安全问题。去它的 GitHub 或频道看最近一次更新时间。
3. **Telegram X 是官替，不是第三方。** Android 上如果只是想要一个比官方客户端体验不同的版本，Telegram X 是最安全的选择。
4. **别贪功能。** 有些第三方客户端主打"已读回执伪造""在线状态隐藏"之类的功能——这些功能本身可能违反 Telegram ToS，账号有被限制的风险。

原始汇总帖来自 [@LCGFX](https://t.me/LCGFX)，有兴趣可以去原帖看评论区里的更新。

