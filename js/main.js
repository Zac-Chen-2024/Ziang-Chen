// 滚动动画
document.addEventListener('DOMContentLoaded', function() {
    // 初始化工作时间显示
    const workTimeSpan = document.querySelector('.work-time span');
    if (workTimeSpan) {
        workTimeSpan.textContent = 'Work Time: 9:00 AM - 9:00 PM ET';
    }
    
    // 标签筛选功能初始化
    initializeTagFilter();
    
    // 其他功能初始化
    initializeScrollEffects();
    initializeSmoothScroll();
    initializeFadeEffects();
});

// 导航栏滚动效果
const header = document.querySelector('.header');
let lastScroll = 0;

window.addEventListener('scroll', () => {
    const currentScroll = window.pageYOffset;
    if (currentScroll <= 0) {
        header.classList.remove('scroll-up');
        return;
    }
    
    if (currentScroll > lastScroll && !header.classList.contains('scroll-down')) {
        header.classList.remove('scroll-up');
        header.classList.add('scroll-down');
    } else if (currentScroll < lastScroll && header.classList.contains('scroll-down')) {
        header.classList.remove('scroll-down');
        header.classList.add('scroll-up');
    }
    lastScroll = currentScroll;
});

// 平滑滚动函数
const smoothScroll = (target) => {
    const targetPosition = target.getBoundingClientRect().top + window.pageYOffset;
    const startPosition = window.pageYOffset;
    const distance = targetPosition - startPosition;
    const duration = 800;
    let start = null;

    const animation = (currentTime) => {
        if (start === null) start = currentTime;
        const timeElapsed = currentTime - start;
        const progress = Math.min(timeElapsed / duration, 1);
        
        const ease = 1 - Math.pow(1 - progress, 4);
        
        window.scrollTo(0, startPosition + distance * ease);
        
        if (timeElapsed < duration) {
            requestAnimationFrame(animation);
        }
    };

    requestAnimationFrame(animation);
};

// 导航链接点击效果
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            smoothScroll(target);
        }
    });
});

// 渐入动画
const fadeElements = document.querySelectorAll('.fade-in');

const fadeInObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
        }
    });
}, {
    threshold: 0.1
});

fadeElements.forEach(element => {
    fadeInObserver.observe(element);
});

// 初始化内容加载
loadResearchProjects();
loadPublications();

// 研究项目数据
const researchProjects = [
    {
        title: '研究项目1',
        description: '这是研究项目1的详细描述...',
        image: 'assets/images/research1.jpg'
    },
    {
        title: '研究项目2',
        description: '这是研究项目2的详细描述...',
        image: 'assets/images/research2.jpg'
    }
    // 可以继续添加更多研究项目
];

// 发表文章数据
const publications = [
    {
        title: '论文标题1',
        authors: '作者1, 作者2',
        journal: '期刊名称',
        year: '2024',
        link: '#'
    },
    {
        title: '论文标题2',
        authors: '作者1, 作者3',
        journal: '期刊名称',
        year: '2023',
        link: '#'
    }
    // 可以继续添加更多发表文章
];

// 动态加载研究项目
function loadResearchProjects() {
    const researchGrid = document.querySelector('.research-grid');
    researchProjects.forEach(project => {
        const projectElement = document.createElement('div');
        projectElement.className = 'research-item fade-in';
        projectElement.innerHTML = `
            <img src="${project.image}" alt="${project.title}">
            <h3>${project.title}</h3>
            <p>${project.description}</p>
        `;
        researchGrid.appendChild(projectElement);
    });
}

// 动态加载发表文章
function loadPublications() {
    const publicationsList = document.querySelector('.publications-list');
    publications.forEach(pub => {
        const pubElement = document.createElement('div');
        pubElement.className = 'publication-item fade-in';
        pubElement.innerHTML = `
            <h3>${pub.title}</h3>
            <p>${pub.authors}</p>
            <p><em>${pub.journal}</em>, ${pub.year}</p>
            <a href="${pub.link}" target="_blank">查看详情</a>
        `;
        publicationsList.appendChild(pubElement);
    });
}

// 初始化标签筛选功能
function initializeTagFilter() {
    const filterTags = document.querySelectorAll('.filter-tag');
    const researchCards = document.querySelectorAll('.research-card');
    let activeTags = new Set();

    // 更新标签的可见性
    function updateTagsVisibility() {
        // 获取所有可见卡片（非隐藏类的卡片）的标签
        const visibleCardTags = new Set();
        researchCards.forEach(card => {
            if (!card.classList.contains('hidden')) {
                const tags = Array.from(card.querySelectorAll('.tag')).map(tag => tag.textContent);
                tags.forEach(tag => visibleCardTags.add(tag));
            }
        });

        // 更新筛选标签的可见性
        filterTags.forEach(tag => {
            if (visibleCardTags.has(tag.textContent)) {
                tag.style.display = 'block';
            } else {
                tag.style.display = 'none';
                // 如果标签被隐藏，同时取消其激活状态
                if (tag.classList.contains('active')) {
                    tag.classList.remove('active');
                    activeTags.delete(tag.getAttribute('data-tag'));
                }
            }
        });
    }

    // 更新卡片显示状态
    function updateCards() {
        researchCards.forEach(card => {
            if (activeTags.size === 0) {
                // 如果没有选中的标签，显示所有非隐藏的卡片
                if (!card.classList.contains('hidden')) {
                    card.classList.remove('filtered-out');
                }
                return;
            }

            const cardTags = Array.from(card.querySelectorAll('.tag')).map(tag => tag.textContent);
            // 检查卡片是否包含所有选中的标签（交集）
            const hasAllTags = Array.from(activeTags).every(tag => cardTags.includes(tag));
            
            if (hasAllTags && !card.classList.contains('hidden')) {
                card.classList.remove('filtered-out');
            } else {
                card.classList.add('filtered-out');
            }
        });
    }

    // 为每个筛选标签添加点击事件
    filterTags.forEach(tag => {
        tag.addEventListener('click', () => {
            const tagName = tag.getAttribute('data-tag');
            
            if (tag.classList.contains('active')) {
                // 如果标签已激活，则取消激活
                tag.classList.remove('active');
                activeTags.delete(tagName);
            } else {
                // 如果标签未激活，则激活
                tag.classList.add('active');
                activeTags.add(tagName);
            }

            updateCards();
        });
    });

    // 初始化时更新标签可见性
    updateTagsVisibility();
}

// 在语言切换时更新标签文本
function updateFilterTags(lang) {
    const filterTags = document.querySelectorAll('.filter-tag');
    filterTags.forEach(tag => {
        const tagKey = tag.getAttribute('data-tag');
        if (translations[lang].filterTags[tagKey]) {
            tag.textContent = translations[lang].filterTags[tagKey];
        }
    });
    
    // 语言切换后重新检查标签可见性
    const visibleCardTags = new Set();
    document.querySelectorAll('.research-card:not(.hidden)').forEach(card => {
        const tags = Array.from(card.querySelectorAll('.tag')).map(tag => tag.textContent);
        tags.forEach(tag => visibleCardTags.add(tag));
    });

    filterTags.forEach(tag => {
        if (visibleCardTags.has(tag.textContent)) {
            tag.style.display = 'block';
        } else {
            tag.style.display = 'none';
        }
    });
} 