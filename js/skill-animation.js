// 技能条动画脚本
document.addEventListener('DOMContentLoaded', function() {
  // 使用 Intersection Observer 实现滚动动画
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const container = entry.target;
        const skillBar = container.querySelector('.skill-bar-fill.animated');
        
        if (skillBar) {
          const percentage = skillBar.getAttribute('data-percentage');
          
          // 先设置为0，然后动画到目标值
          skillBar.style.width = '0%';
          
          // 使用 requestAnimationFrame 确保浏览器准备好执行动画
          requestAnimationFrame(() => {
            setTimeout(() => {
              skillBar.style.width = percentage + '%';
            }, 50);
          });
        }
        
        // 动画完成后停止观察
        observer.unobserve(container);
      }
    });
  }, { 
    threshold: 0.2,
    rootMargin: '0px 0px -50px 0px'
  });

  // 观察所有技能条容器
  document.querySelectorAll('.skill-bar-container').forEach(container => {
    observer.observe(container);
  });
});
