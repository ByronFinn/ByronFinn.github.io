# 关于我


<link rel="stylesheet" href="/css/profile.css">
<script src="/js/skill-animation.js" defer></script>

<div class="profile-container">
  <!-- 核心信息展示区 -->
  <div class="profile-header">
    <div class="profile-avatar-wrapper">
      <img src="/pictures/avatar/angryCat.png" alt="Finn" class="profile-avatar">
    </div>
    <h1 class="profile-name">Finn</h1>
    <p class="profile-title">后端开发工程师</p>
    <p class="profile-bio">从地质学转向软件开发的跨界工程师，专注于高并发后端系统和AI技术应用</p>
  </div>

  <!-- 联系方式 -->

{{< profile-section title="联系方式" icon="📧" type="contact" >}}

  <div class="profile-contact">
    <a href="mailto:baifan@z.org" class="profile-contact-item">
      <span class="profile-contact-icon">📧</span>
      <span>Email</span>
    </a>
    <a href="https://github.com/ByronFinn" target="_blank" class="profile-contact-item">
      <span class="profile-contact-icon">💻</span>
      <span>GitHub</span>
    </a>
    <a href="https://blog.baifan.site" target="_blank" class="profile-contact-item">
      <span class="profile-contact-icon">📝</span>
      <span>博客</span>
    </a>
  </div>
  {{< /profile-section >}}

  <!-- 核心技能概览 -->

{{< profile-section title="核心技能" icon="🚀" >}}

  <div class="skills-grid">
    <!-- 编程语言 -->
    <div class="skill-category">
      <div class="skill-category-header">
        <span class="skill-category-icon">💻</span>
        <h3 class="skill-category-title">编程语言</h3>
      </div>
      <div class="skill-list">
        {{< skill-bar name="Python" level="85" type="bar" >}}
        {{< skill-bar name="Go" level="85" type="bar" >}}
        {{< skill-bar name="Rust" level="15" type="bar" >}}
      </div>
    </div>

    <!-- 后端技术 -->
    <div class="skill-category">
      <div class="skill-category-header">
        <span class="skill-category-icon">⚙️</span>
        <h3 class="skill-category-title">Web框架</h3>
      </div>
      <div class="skill-list">
        {{< skill-bar name="FastAPI/Flask/Django" level="85" type="bar" >}}
        {{< skill-bar name="Gin/CloudWeGo" level="80" type="bar" >}}
        {{< skill-bar name="RESTful API" level="90" type="bar" >}}
      </div>
    </div>

    <!-- 数据库 -->
    <div class="skill-category">
      <div class="skill-category-header">
        <span class="skill-category-icon">🗄️</span>
        <h3 class="skill-category-title">数据库</h3>
      </div>
      <div class="skill-list">
        {{< skill-bar name="MySQL/PG/OB" level="80" type="bar" >}}
        {{< skill-bar name="Redis/MongoDB" level="75" type="bar" >}}
        {{< skill-bar name="ES" level="50" type="bar" >}}
      </div>
    </div>

    <!-- DevOps -->
    <div class="skill-category">
      <div class="skill-category-header">
        <span class="skill-category-icon">🚀</span>
        <h3 class="skill-category-title">DevOps</h3>
      </div>
      <div class="skill-list">
        {{< skill-bar name="Docker/K8S" level="80" type="bar" >}}
        {{< skill-bar name="Prometheus/Grafana/Loki" level="70" type="bar" >}}
        {{< skill-bar name="Git/CI/CD" level="70" type="bar" >}}
      </div>
    </div>

  </div>
  {{< /profile-section >}}

  <!-- 教育背景 -->

{{< profile-section title="🎓 教育背景" icon="🏛️" >}}

  <div class="profile-timeline">
    <div class="profile-timeline-item">
      <div class="profile-timeline-date">2011 - 2015</div>
      <div class="profile-timeline-title">中国地质大学(武汉)</div>
      <div class="profile-timeline-subtitle">资源勘察工程(矿产调查与开发方向) | 本科</div>
      <div class="profile-timeline-description">
        <p><strong>核心课程：</strong>地质学基础、矿产勘查技术、地球物理学、工程地质学</p>
        <p><strong>实践经历：</strong>参与地质勘探实习，掌握野外地质调查和数据分析方法</p>
        <p><strong>专业技能：</strong>地质数据处理、矿产资源评估、工程地质分析</p>
      </div>
    </div>
  </div>
  {{< /profile-section >}}

  <!-- 工作经历 -->

{{< profile-section title="💼 工作经历" icon="🔧" >}}

  <div class="profile-timeline">
    <div class="profile-timeline-item">
      <div class="profile-timeline-date">2023 - 至今</div>
      <div class="profile-timeline-title">XX教育集团</div>
      <div class="profile-timeline-subtitle">后端开发工程师</div>
      <div class="profile-timeline-description">
        <ul>
          <li>负责教育平台后端系统的设计和开发</li>
          <li>使用Python和Go开发高并发API服务</li>
          <li>设计和优化数据库结构，提升系统性能</li>
          <li>参与微服务架构设计和容器化部署</li>
          <li>探索LLM技术在教育场景的应用</li>
        </ul>
      </div>
    </div>

    <div class="profile-timeline-item">
      <div class="profile-timeline-date">2021 - 2023</div>
      <div class="profile-timeline-title">XX科技</div>
      <div class="profile-timeline-subtitle">开发工程师</div>
      <div class="profile-timeline-description">
        <ul>
          <li>参与公司核心产品的后端开发工作</li>
          <li>学习和实践现代软件开发技术栈</li>
          <li>负责数据接口开发和系统维护</li>
          <li>从零开始积累软件开发经验</li>
        </ul>
      </div>
    </div>

    <div class="profile-timeline-item">
      <div class="profile-timeline-date">2015 - 2021</div>
      <div class="profile-timeline-title">XX集团</div>
      <div class="profile-timeline-subtitle">开发工程师</div>
      <div class="profile-timeline-description">
        <ul>
          <li>参与项目OA开发，负责第三方对接、需求澄清</li>
          <li>参与矿产勘探项目的实地调研和数据分析</li>
          <li>负责地质勘探数据的收集、处理和解释</li>
          <li>编制地质勘探报告和技术方案</li>
          <li>使用专业软件进行地质建模和资源评估</li>
        </ul>
      </div>
    </div>

  </div>
  {{< /profile-section >}}

  <!-- 专业技能 -->

{{< profile-section title="🛠️ 专业技能" icon="💻" >}}
{{< skill-bar name="Python" level="90" unit="%" showPercentage="true" >}}

<p style="margin-top: 0.5rem; opacity: 0.8;">
深入理解 Python 高级特性和设计模式，熟练使用 FastAPI/Django/Flask 等 Web 框架，具备 Python 性能优化经验
</p>

    {{< skill-bar name="Go" level="85" unit="%" showPercentage="true" >}}
    <p style="margin-top: 0.5rem; opacity: 0.8;">
      掌握Go并发编程和微服务开发，熟悉CloudWeGo、Gin、GORM等主流框架，了解Go语言底层原理和最佳实践
    </p>

{{< skill-bar name="后端开发" level="85" unit="%" >}}

<p style="margin-top: 0.5rem; opacity: 0.8;">RESTful API 设计和开发、微服务架构设计和实现、高并发系统设计和性能优化</p>

{{< skill-bar name="数据库(MySQL/PG/Redis)" level="75" unit="%" >}}

<p style="margin-top: 0.5rem; opacity: 0.8;">MySQL 数据库设计和优化、Redis 缓存策略和数据结构、数据一致性保证和事务处理</p>

{{< skill-bar name="Docker/K8s" level="75" unit="%" >}}

<p style="margin-top: 0.5rem; opacity: 0.8;">Docker 容器化部署和编排、Kubernetes 集群管理和运维、CI/CD 流程设计和实现</p>

{{< skill-bar name="LLM+Agent+MCP" level="70" unit="%" >}}

<p style="margin-top: 0.5rem; opacity: 0.8;">大语言模型 API 集成和调优、AI Agent 框架设计和开发、Model Context Protocol(MCP)技术探索</p>

{{< /profile-section >}}

  <!-- 软技能 -->

{{< profile-section title="🎯 软技能" icon="🤝" >}}

  <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1rem;">
    <div style="padding: 1rem; border: 1px solid var(--global-border-color); border-radius: 8px;">
      <h4 style="margin: 0 0 0.5rem 0; color: var(--global-link-hover-color);">🎯 项目管理</h4>
      <p style="margin: 0; opacity: 0.8;">具备丰富的项目管理和团队协作经验</p>
    </div>
    <div style="padding: 1rem; border: 1px solid var(--global-border-color); border-radius: 8px;">
      <h4 style="margin: 0 0 0.5rem 0; color: var(--global-link-hover-color);">🤝 沟通能力</h4>
      <p style="margin: 0; opacity: 0.8;">优秀的跨部门沟通和协调能力</p>
    </div>
    <div style="padding: 1rem; border: 1px solid var(--global-border-color); border-radius: 8px;">
      <h4 style="margin: 0 0 0.5rem 0; color: var(--global-link-hover-color);">📚 学习能力</h4>
      <p style="margin: 0; opacity: 0.8;">快速学习新技术和适应变化</p>
    </div>
    <div style="padding: 1rem; border: 1px solid var(--global-border-color); border-radius: 8px;">
      <h4 style="margin: 0 0 0.5rem 0; color: var(--global-link-hover-color);">🔍 问题解决</h4>
      <p style="margin: 0; opacity: 0.8;">强大的分析和问题解决能力</p>
    </div>
  </div>
  {{< /profile-section >}}

  <!-- 项目经验 -->

{{< profile-section title="🚀 项目经验" icon="📦" >}}

  <div class="project-highlight" style="background: var(--global-hover-background-color); padding: 1rem; border-radius: 8px; margin-bottom: 1rem;">
    <h4>教育平台后端系统 | xx教育集团</h4>
    <p><strong>项目时期：</strong>近期项目</p>
    <p><strong>技术栈：</strong>Python, Go, MySQL, Redis, Docker, Kubernetes</p>
    <p><strong>项目描述：</strong>为在线教育平台设计和开发高可扩展的后端服务系统</p>
    <p><strong>主要贡献：</strong>设计微服务架构、开发RESTful API、优化数据库性能、实现Redis缓存、构建Docker容器化部署</p>
  </div>

  <div class="project-highlight" style="background: var(--global-hover-background-color); padding: 1rem; border-radius: 8px; margin-bottom: 1rem;">
    <h4>AI教育助手系统 | xx教育集团</h4>
    <p><strong>项目时期：</strong>近期项目</p>
    <p><strong>技术栈：</strong>Python, OpenAI API, Agent框架, MCP</p>
    <p><strong>项目描述：</strong>基于LLM的智能教育助手，为学生提供个性化学习建议</p>
    <p><strong>主要贡献：</strong>集成大语言模型API、设计Agent工作流、开发MCP协议接口、实现对话历史管理</p>
  </div>

  <div class="project-highlight" style="background: var(--global-hover-background-color); padding: 1rem; border-radius: 8px; margin-bottom: 1rem;">
    <h4>企业管理系统 | xx科技</h4>
    <p><strong>项目时期：</strong>成长期项目</p>
    <p><strong>技术栈：</strong>Python, Django, MySQL, JavaScript</p>
    <p><strong>项目描述：</strong>为公司内部开发的企业级管理系统</p>
    <p><strong>主要贡献：</strong>负责后端API开发、实现用户权限管理、参与前后端分离架构、实践敏捷开发流程</p>
  </div>
  {{< /profile-section >}}

  <!-- 个人理念 -->

{{< profile-section title="🌟 个人理念" icon="💡" >}}

  <blockquote style="border-left: 4px solid var(--global-link-hover-color); padding-left: 1rem; margin: 1rem 0; font-style: italic;">
    <p>"我做事有方法，但更有决心。"</p>
    <p style="text-align: right; margin-top: 0.5rem;">—— ByronFinn</p>
  </blockquote>

  <h4>我相信：</h4>
  <ul>
    <li><strong>持续学习：</strong> 保持好奇，不断拓展边界，跨界思维孕育创新。</li>
    <li><strong>深度思考：</strong> 以系统性视角洞察问题，追求更优解法。</li>
    <li><strong>技术热情：</strong> 以热爱为驱动力，勇于探索与突破。</li>
    <li><strong>实干精神：</strong> 理论指路，行动成真；敢于试错，不畏失败。</li>
  </ul>
  {{< /profile-section >}}

  <!-- 结束语 -->

{{< profile-section type="footer" >}}

  <p style="text-align: center; font-size: 0.9rem; opacity: 0.7;">
    <strong>免责声明：</strong>本页面所展示的个人信息和经历仅供参考，具体内容可能随时间变化而更新。
  </p>
  {{< /profile-section >}}
</div>

