// 滚动动画
document.addEventListener('DOMContentLoaded', function() {
    // 语言切换功能初始化
    initializeLanguageSwitch();
    
    // 标签筛选功能初始化
    initializeTagFilter();
    
    // 其他功能初始化
    initializeScrollEffects();
    initializeSmoothScroll();
    initializeFadeEffects();
});

function initializeLanguageSwitch() {
    const translations = {
        en: {
            about: 'About',
            research: 'Research',
            aboutMe: 'About Me',
            contact: 'Contact',
            education: 'Education',
            advisor: 'Advisor',
            researchExp: 'Research Experience',
            researchProjects: 'Research Projects',
            researchInterests: 'Research Interests',
            introText: 'I am a graduate student in Computer Science at Stony Brook University, focusing on human-computer interaction based on large language models.',
            currentStatus: 'Current',
            labMember: 'Lab Member',
            undergraduateAssistant: 'Outstanding Undergraduate Assistant',
            present: 'Present',
            hci: 'Human-Computer Interaction',
            llm: 'Large Language Model Applications',
            logo: 'Ziang Chen',
            pageTitle: 'Ziang Chen - Academic Profile',
            // 研究项目相关翻译
            tapSayTitle: 'Tap&Say: LLM-based Speech Error Correction Demo',
            tapSayDesc: 'Originally created by Maozheng, I am responsible for developing the web-based demonstration that enables speech error correction through simple interactions using LLM suggestions.',
            tapSayBullet1: 'Speech error correction through simple interactions',
            tapSayBullet2: 'LLM-powered correction suggestions',
            speechRecognition: 'Speech Recognition',
            // 教育经历
            sbu: 'Stony Brook University',
            neu: 'Northeastern University (China)',
            msCs: 'M.S. in Computer Science',
            beCs: 'B.E. in Computer Science and Technology',
            // 研究经历
            hciLab: 'HCI Lab, Stony Brook University',
            dsLab: 'Data Science and Computer Vision Lab, Northeastern University',
            hciExp1: 'Web-based demonstration development for Tap&Say error correction LLM',
            hciExp2: 'Development of LLM-based immigration legal assistant (Collaboration with Yazheng Chen, advised by Xiaojun Bi and Xianfeng Gu)',
            dsExp1: 'Participated in heart disease feature data processing research in collaboration with local medical institutions',
            dsExp2: 'Development of computer vision-based helmet wearing detection system',
            filterTags: {
                "LLM": "LLM",
                "HCI": "HCI",
                "Speech Recognition": "Speech Recognition",
                "Legal Tech": "Legal Tech",
                "NLP": "NLP",
                "Data Analysis": "Data Analysis",
                "Healthcare": "Healthcare",
                "Machine Learning": "Machine Learning",
                "Computer Vision": "Computer Vision",
                "Deep Learning": "Deep Learning",
                "Safety Monitoring": "Safety Monitoring"
            },
            workTime: 'Work Time',
            workTimeValue: '9:00 AM - 9:00 PM ET'
        },
        zh: {
            about: '关于',
            research: '研究',
            aboutMe: '个人简介',
            contact: '联系方式',
            education: '教育背景',
            advisor: '指导教师',
            researchExp: '研究经历',
            researchProjects: '研究项目',
            researchInterests: '研究兴趣',
            introText: '我是纽约州立大学石溪分校计算机科学专业的研究生，主要研究基于大语言模型的人机交互。',
            currentStatus: '在读',
            labMember: '实验室成员',
            undergraduateAssistant: '优秀本科生助研',
            present: '至今',
            hci: '人机交互',
            llm: '大语言模型应用',
            logo: '陈梓昂',
            pageTitle: '陈梓昂 - 学术主页',
            // 研究项目相关翻译
            tapSayTitle: 'Tap&Say：基于大语言模型的语音纠错演示',
            tapSayDesc: '该项目最初由茂正创建，我负责开发基于网页的演示系统，通过简单的交互方式实现基于大语言模型的语音纠错功能。',
            tapSayBullet1: '通过简单交互实现语音纠错',
            tapSayBullet2: '基于大语言模型的纠错建议',
            speechRecognition: '语音识别',
            // 教育经历
            sbu: '纽约州立大学石溪分校',
            neu: '东北大学',
            msCs: '计算机科学 硕士',
            beCs: '计算机科学与技术 学士',
            // 研究经历
            hciLab: '人机交互实验室，纽约州立大学石溪分校',
            dsLab: '数据科学与计算机视觉实验室，东北大学',
            hciExp1: '基于大语言模型的 Tap&Say 语音纠错系统网页演示开发',
            hciExp2: '基于大语言模型的移民法律助手系统开发（与陈亚正合作，由毕晓君和顾险峰指导）',
            dsExp1: '参与与当地医疗机构合作的心脏病特征数据处理研究',
            dsExp2: '基于计算机视觉的安全帽佩戴检测系统开发',
            filterTags: {
                "LLM": "大语言模型",
                "HCI": "人机交互",
                "Speech Recognition": "语音识别",
                "Legal Tech": "法律科技",
                "NLP": "自然语言处理",
                "Data Analysis": "数据分析",
                "Healthcare": "医疗健康",
                "Machine Learning": "机器学习",
                "Computer Vision": "计算机视觉",
                "Deep Learning": "深度学习",
                "Safety Monitoring": "安全监控"
            },
            workTime: '工作时间',
            workTimeValue: '美东时间 早9:00 - 晚9:00'
        }
    };

    const langToggle = document.getElementById('langToggle');
    if (!langToggle) {
        console.error('Language toggle button not found');
        return;
    }

    let currentLang = 'en';

    function updateContent(lang) {
        try {
            // 更新页面标题
            document.title = translations[lang].pageTitle;
            
            // 更新logo文本
            document.querySelector('.logo').textContent = translations[lang].logo;

            // 更新导航链接
            document.querySelector('a[href="#about"]').textContent = translations[lang].about;
            document.querySelector('a[href="#research"]').textContent = translations[lang].research;

            // 更新各个部分的标题
            document.querySelector('.self-intro h3').textContent = translations[lang].aboutMe;
            document.querySelector('.research-interests h4').textContent = translations[lang].researchInterests;
            document.querySelector('.about-text h3:nth-of-type(1)').textContent = translations[lang].contact;
            document.querySelector('.about-text h3:nth-of-type(2)').textContent = translations[lang].education;
            document.querySelector('.about-text h3:nth-of-type(3)').textContent = translations[lang].advisor;
            document.querySelector('.about-text h3:nth-of-type(4)').textContent = translations[lang].researchExp;
            document.querySelector('#research h2').textContent = translations[lang].researchProjects;

            // 更新简介文本
            document.querySelector('.intro-content p').textContent = translations[lang].introText;

            // 更新研究兴趣
            const interests = document.querySelectorAll('.research-interests li');
            interests[0].textContent = translations[lang].hci;
            interests[1].textContent = translations[lang].llm;

            // 更新联系方式
            const workTimeSpan = document.querySelector('.work-time span');
            workTimeSpan.textContent = `${translations[lang].workTime}: ${translations[lang].workTimeValue}`;

            // 更新教育经历
            const eduItems = document.querySelectorAll('.education-item');
            eduItems[0].querySelector('strong').textContent = translations[lang].sbu;
            eduItems[0].querySelector('p').textContent = `${translations[lang].msCs} (${translations[lang].currentStatus})`;
            eduItems[1].querySelector('strong').textContent = translations[lang].neu;
            eduItems[1].querySelector('p').textContent = `${translations[lang].beCs} (July 2024)`;

            // 更新研究经历
            const expItems = document.querySelectorAll('.experience-item');
            expItems[0].querySelector('p:first-child strong').textContent = translations[lang].hciLab;
            expItems[0].querySelector('p:nth-child(2)').textContent = `${translations[lang].labMember} (Jan 2024 - ${translations[lang].present})`;
            const hciList = expItems[0].querySelectorAll('li');
            hciList[0].textContent = translations[lang].hciExp1;
            hciList[1].textContent = translations[lang].hciExp2;

            expItems[1].querySelector('p:first-child strong').textContent = translations[lang].dsLab;
            expItems[1].querySelector('p:nth-child(2)').textContent = `${translations[lang].undergraduateAssistant} (Nov 2020 - June 2024)`;
            const dsList = expItems[1].querySelectorAll('li');
            dsList[0].textContent = translations[lang].dsExp1;
            dsList[1].textContent = translations[lang].dsExp2;

            // 更新研究项目
            const tapSayCard = document.querySelector('.research-card:not(.hidden)');
            if (tapSayCard) {
                tapSayCard.querySelector('h3').textContent = translations[lang].tapSayTitle;
                tapSayCard.querySelector('.research-description p').textContent = translations[lang].tapSayDesc;
                const bullets = tapSayCard.querySelectorAll('.research-description li');
                bullets[0].textContent = translations[lang].tapSayBullet1;
                bullets[1].textContent = translations[lang].tapSayBullet2;
                
                // 更新标签
                const tags = tapSayCard.querySelectorAll('.tag');
                tags[1].textContent = translations[lang].speechRecognition;
                tags[2].textContent = translations[lang].hci;
            }

            // 更新语言切换按钮文本
            langToggle.textContent = lang === 'en' ? '中文' : 'English';

            // 更新筛选标签
            updateFilterTags(lang);
        } catch (error) {
            console.error('Error updating content:', error);
        }
    }

    // 添加点击事件监听器
    langToggle.addEventListener('click', function() {
        currentLang = currentLang === 'en' ? 'zh' : 'en';
        document.documentElement.lang = currentLang;
        updateContent(currentLang);
    });

    // 初始化时立即更新内容
    updateContent(currentLang);
}

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