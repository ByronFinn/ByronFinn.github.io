# Oracle 白送 4 核 24G 服务器，注册到跑起来一次讲清


Oracle 的 Always Free 计划每个月给一台 4 核 CPU、24 GB 内存的 ARM 服务器，不限期，不扣钱。同样配置在 AWS 上月费 $80–100。这篇把注册、避坑、创建实例和保活串一遍。

<!-- more -->

{{< image src="/pictures/posts/oracle-free-vps-flow.svg" caption="Oracle 免费 VPS：从准备到跑起来的全流程" alt="Oracle 免费 VPS 全流程" title="全流程概览" width="800" class="center" >}}

## 你拿到的是什么

Oracle 的免费计划叫 **Always Free**。不是试用期，不是限时促销。

核心资源是一台 ARM 架构的虚拟机：

| 资源 | 配置 |
|------|------|
| CPU | 4 核（Ampere A1） |
| 内存 | 24 GB |
| 存储 | 200 GB |
| 每月出口流量 | 10 TB |
| 价格 | **$0，永久** |

Oracle 按小时数计费：每月 3,000 OCPU hours + 18,000 GB memory-hours，正好分配成 1 台 4 核 24 GB。另外附带 2 台 AMD x86 小机器（各约 1 核 1 GB），当备用或跑轻量任务。

{{< image src="/pictures/posts/oracle-free-vps-comparison.svg" caption="Oracle Always Free vs AWS 同配置月费对比" alt="Oracle 免费 VPS 与 AWS 价格对比" title="价格对比" width="800" class="center" >}}

## 注册之前准备好三样东西

**实体信用卡**：Visa 或 Mastercard 标志，招行、工行、中行、浦发都行。不接受虚拟卡和预付卡。绑卡时扣约 $1 做验证，几天内退回。

**邮箱和手机号**：国内 +86 手机号直接用。

**关代理，换手机热点**：Oracle 会校验 IP 来源和信用卡发卡国是否匹配。代理把 IP 变成其他国家，验证直接失败。

## 注册失败的排查清单

提交后出现红色感叹号，大概率是 IP 来源、信用卡发卡国、账单地址三者不一致。

用中国信用卡注册时的规则：

- IP 来自中国（手机热点，不开代理）
- 信用卡是中国发行的 Visa/Mastercard
- 账单地址填中国地址

出现感叹号后逐项检查：

- VPN/代理是否完全关闭？
- 是否用的手机热点而不是 WiFi？
- 信用卡是实体卡（非虚拟卡、非预付卡）？
- 账单地址是中国地址？
- 同一张卡试了 2 次以上？停手，换卡或等 2-3 天

这是社区总结出来的风控规律，Oracle 官方没公开说过。但按这个清单排查，成功率确实高很多。

## 区域选完不能改，停下来想清楚

注册时选"主区域"（Home Region），**选完不能改**。

热门区域 ARM 实例竞争激烈，免费账号很难抢到。

| 区域 | 建议 |
|------|------|
| Phoenix（美国凤凰城） | 首选，竞争低 |
| Mumbai（印度孟买） | 备选 |
| Jakarta（印尼雅加达） | 备选 |
| Tokyo / Seoul / Singapore | ARM 抢占率低，除非对亚洲延迟有硬性要求 |

跑服务器不是打游戏，延迟不是第一优先级，稳定拿到机器才是。推荐 Phoenix。

## 注册流程

准备好之后，打开无痕浏览器。

1. **进入注册页**：打开 [oracle.com/cloud/free](https://www.oracle.com/cloud/free/)，点"立即免费试用"
2. **填基本信息**：国家选中国，姓名用拼音，填邮箱，验证邮箱确认链接
3. **设密码和账号类型**：密码 8 位以上含大小写数字特殊字符，Customer type 选 Individual
4. **选主区域**：下拉选 US West (Phoenix)
5. **填地址**：信用卡账单对应的英文地址

```text
Street: 123 Renmin Road
City: Beijing
State/Province: Beijing
Postal Code: 100000
Country: China
```

6. **填手机号**：+86 加手机号，收验证码
7. **绑信用卡**：填卡信息提交。$1 预授权，几天内退回

跳转欢迎页就是成功。出现红色感叹号看上面的排查清单。

## 创建 ARM 实例

登录控制台，进入 **Compute → Instances → Create Instance**。

核心选择：

- **镜像**：Ubuntu 22.04，选标有 "Always Free Eligible" 的
- **配置型号**：VM.Standard.A1.Flex，设 4 核 / 24 GB
- **存储**：自定义引导卷，200 GB
- **SSH 密钥**：上传 `.pub` 公钥文件

没有 SSH 密钥？Mac/Linux 终端跑一条：

```bash
ssh-keygen -t rsa -b 4096 -f ~/.ssh/oracle_key
```

Windows 用 Windows Terminal 自带的 `ssh-keygen`，或者 PuTTYgen。生成的 `oracle_key.pub` 上传即可。

点 Create，等几分钟，状态变绿就跑起来了。

## 提示资源不足怎么办

看到 **"Out of Capacity"** 不是你操作有问题——这个区域的 ARM 暂时满了。

手动刷成功率很低。社区有自动抢机脚本，每隔几十秒试一次，有容量释放就立刻建：

- GitHub Actions 版（放 GitHub 上自动跑，不用开电脑）：[oci-free-arm-instance](https://github.com/maoucodes/oci-free-arm-instance)
- Python 版：[oracle-freetier-instance-creation](https://github.com/mohankumarpaluru/oracle-freetier-instance-creation)

通常几小时到几天内成功。让脚本跑着就行。

## 保活：别让机器被收回去

Oracle 会检查闲置。CPU、内存、网络利用率连续 7 天低于 20%，可能回收（以官方最新策略为准，历史上阈值有调整）。

最简单的方式——cron 定时跑一个轻量请求：

```bash
# 每小时产生少量 CPU 和网络活动
* */1 * * * curl -s https://www.oracle.com > /dev/null
```

社区也有 [NeverIdle](https://github.com/layou233/NeverIdle) 这类脚本，但第三方脚本有失效风险，Oracle 更新检测机制后可能不灵。

等你在服务器上跑起了真实服务，就不需要这些了。ZRAM 压缩方案（{{< ref "posts/2026-05-16-zram-memory-optimization-linux.md" >}}）在低内存场景下也很实用，可以配合使用。

## 值不值得花这个时间

4 核 24 GB 的免费服务器，对个人项目和小团队来说够用。注册本身不复杂——实体信用卡 + 关代理 + 手机热点 + 区域选 Phoenix，大概率一次过。

唯一需要耐心的是等 ARM 容量。让脚本帮你守着，不用自己刷。

拿到服务器之后怎么配置、装什么，可以参考 VPS 圈的术语科普（{{< ref "posts/2026-05-16-vps-glossary-guide.md" >}}）和自建 AI API 全链路（{{< ref "posts/2026-05-16-self-hosted-ai-api-pipeline.md" >}}）。

