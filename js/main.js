// 滚动动画
document.addEventListener('DOMContentLoaded', () => {
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

    // 平滑滚动
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            document.querySelector(this.getAttribute('href')).scrollIntoView({
                behavior: 'smooth'
            });
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
});

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

// 页面加载完成后执行
document.addEventListener('DOMContentLoaded', () => {
    loadResearchProjects();
    loadPublications();
}); 