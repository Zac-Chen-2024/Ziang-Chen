// 现代化学术个人网站 - 主要JavaScript功能
// ========================================================================

document.addEventListener('DOMContentLoaded', function() {
    // 初始化所有功能
    initializeNavigation();
    initializeProgressBar();
    initializeBackToTop();
    initializeProjectFilter();
    initializeScrollAnimations();
    initializeHeroAnimations();
});

// 导航栏功能
function initializeNavigation() {
    const navToggle = document.querySelector('.nav-toggle');
    const navMenu = document.querySelector('.nav-menu');
    const navLinks = document.querySelectorAll('.nav-link');
    
    // 移动端菜单切换
    if (navToggle) {
        navToggle.addEventListener('click', () => {
            navToggle.classList.toggle('active');
            navMenu.classList.toggle('active');
        });
    }
    
    // 导航链接点击处理
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            // 移除所有链接的active类
            navLinks.forEach(l => l.classList.remove('active'));
            // 为当前链接添加active类
            link.classList.add('active');
            
            // 移动端关闭菜单
            if (navMenu.classList.contains('active')) {
                navToggle.classList.remove('active');
                navMenu.classList.remove('active');
            }
            
            // 平滑滚动到目标部分
            const targetId = link.getAttribute('href');
            if (targetId.startsWith('#')) {
                e.preventDefault();
                const targetElement = document.querySelector(targetId);
                if (targetElement) {
                    targetElement.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            }
        });
    });
    
    // 滚动时高亮当前部分的导航链接
    const sections = document.querySelectorAll('section[id]');
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const currentLink = document.querySelector(`[href="#${entry.target.id}"]`);
                if (currentLink) {
                    navLinks.forEach(link => link.classList.remove('active'));
                    currentLink.classList.add('active');
                }
            }
        });
    }, {
        threshold: 0.6,
        rootMargin: '-20% 0px -20% 0px'
    });
    
    sections.forEach(section => observer.observe(section));
}

// 进度条功能
function initializeProgressBar() {
    const progressBar = document.getElementById('progressBar');
    
    window.addEventListener('scroll', () => {
        const scrollTop = window.pageYOffset;
        const docHeight = document.body.scrollHeight - window.innerHeight;
        const scrollPercent = (scrollTop / docHeight) * 100;
        
        if (progressBar) {
            progressBar.style.width = scrollPercent + '%';
        }
    });
}

// 返回顶部按钮
function initializeBackToTop() {
    const backToTopBtn = document.getElementById('backToTop');
    
    if (!backToTopBtn) return;
    
    window.addEventListener('scroll', () => {
        if (window.pageYOffset > 300) {
            backToTopBtn.classList.add('visible');
        } else {
            backToTopBtn.classList.remove('visible');
        }
    });
    
    backToTopBtn.addEventListener('click', () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
}

// 项目筛选功能
function initializeProjectFilter() {
    const filterBtns = document.querySelectorAll('.filter-btn');
    const projectCards = document.querySelectorAll('.project-card');
    
    if (filterBtns.length === 0 || projectCards.length === 0) return;
    
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const filter = btn.getAttribute('data-filter');
            
            // 更新按钮状态
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            // 筛选项目卡片
            projectCards.forEach(card => {
                const categories = card.getAttribute('data-category');
                
                if (filter === 'all' || (categories && categories.includes(filter))) {
                    card.style.display = 'block';
                    card.style.opacity = '0';
                    card.style.transform = 'translateY(20px)';
                    
                    // 添加显示动画
                    setTimeout(() => {
                        card.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
                        card.style.opacity = '1';
                        card.style.transform = 'translateY(0)';
                    }, 100);
                } else {
                    card.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
                    card.style.opacity = '0';
                    card.style.transform = 'translateY(20px)';
                    
                    setTimeout(() => {
                        card.style.display = 'none';
                    }, 300);
                }
            });
        });
    });
}

// 滚动动画
function initializeScrollAnimations() {
    const animatedElements = document.querySelectorAll('.info-card, .education-card, .interests-card, .advisor-card, .project-card, .contact-card');
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry, index) => {
            if (entry.isIntersecting) {
                setTimeout(() => {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                }, index * 100);
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    });
    
    animatedElements.forEach(element => {
        element.style.opacity = '0';
        element.style.transform = 'translateY(30px)';
        element.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(element);
    });
}

// Hero区域动画
function initializeHeroAnimations() {
    // 浮动卡片动画
    const floatingCards = document.querySelectorAll('.floating-card');
    floatingCards.forEach((card, index) => {
        card.style.animation = `float ${4 + index}s ease-in-out infinite`;
        card.style.animationDelay = `${index}s`;
    });
    
    // 个人照片悬浮效果增强
    const profileImg = document.querySelector('.profile-img');
    const imageContainer = document.querySelector('.image-container');
    
    if (imageContainer && profileImg) {
        imageContainer.addEventListener('mouseenter', () => {
            profileImg.style.transform = 'scale(1.05) rotate(2deg)';
        });
        
        imageContainer.addEventListener('mouseleave', () => {
            profileImg.style.transform = 'scale(1) rotate(0deg)';
        });
    }
}

// 高级交互效果
function initializeAdvancedInteractions() {
    // 3D倾斜效果
    const cards = document.querySelectorAll('.info-card, .education-card, .interests-card, .advisor-card, .project-card');
    
    cards.forEach(card => {
        card.addEventListener('mouseenter', (e) => {
            if (window.innerWidth > 768) { // 只在桌面端启用
                const rect = card.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                
                const centerX = rect.width / 2;
                const centerY = rect.height / 2;
                
                const rotateX = (y - centerY) / 20;
                const rotateY = (centerX - x) / 20;
                
                card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateZ(10px)`;
            }
        });
        
        card.addEventListener('mouseleave', () => {
            card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) translateZ(0)';
        });
        
        card.addEventListener('mousemove', (e) => {
            if (window.innerWidth > 768) {
                const rect = card.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                
                const centerX = rect.width / 2;
                const centerY = rect.height / 2;
                
                const rotateX = (y - centerY) / 20;
                const rotateY = (centerX - x) / 20;
                
                card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateZ(10px)`;
            }
        });
    });
}

// 平滑滚动增强
function initializeSmoothScrolling() {
    // 为所有内部链接添加平滑滚动
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
}

// 性能优化：节流函数
function throttle(func, limit) {
    let inThrottle;
    return function() {
        const args = arguments;
        const context = this;
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    }
}

// 窗口调整大小时的处理
window.addEventListener('resize', throttle(() => {
    // 重新计算移动端菜单状态
    const navMenu = document.querySelector('.nav-menu');
    const navToggle = document.querySelector('.nav-toggle');
    
    if (window.innerWidth > 768) {
        navMenu.classList.remove('active');
        navToggle.classList.remove('active');
    }
}, 250));

// 页面加载完成后的初始化
window.addEventListener('load', () => {
    // 启用高级交互效果
    initializeAdvancedInteractions();
    initializeSmoothScrolling();
    
    // 添加页面加载动画
    document.body.style.opacity = '0';
    document.body.style.transition = 'opacity 0.5s ease';
    
    setTimeout(() => {
        document.body.style.opacity = '1';
    }, 100);
});

// 错误处理
window.addEventListener('error', (e) => {
    console.error('页面脚本错误:', e.error);
});

// 导出主要函数供调试使用
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        initializeNavigation,
        initializeProgressBar,
        initializeBackToTop,
        initializeProjectFilter,
        initializeScrollAnimations
    };
}