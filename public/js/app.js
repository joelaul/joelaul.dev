// DOM

const body = document.querySelector('body');
const bg = document.querySelector('.background');
const me = document.querySelector('.me');
const h1 = document.querySelector('.h1');
const socialEls = document.querySelectorAll('.social > a');
const socialContainer = document.querySelector('.social-container');
const desc = document.querySelector('.description');
const navBrand = document.querySelector('.navbar-brand');

// STATE

const state = {
    descText: `🎸👨‍💻 I'm a fullstack developer, musician, and educator. I like building things that awaken people's curiosity.`,
    ctaText: `
        <div>
            <a class="cta hide" style="padding-right: 10px" href="/portfolio">
                Check out some of my work!
            </a>
        </div>
        `,
    ctaDisplayed: false,
    hoveredSocialEls: [],
    isTouching: false,
    touchedEl: null,
    typewriterInterval: null,
    typewriterDone: false
}
const leaves = `url("../img/leaves.png")`

// HELPERS

const isUniqueSocialEl = (el) => {
    return state.hoveredSocialEls.indexOf(el) == -1;
}

const typewriter = (element, text, ms) => {
        desc.textContent = '';
        let index = 0;

        state.typewriterInterval = setInterval(() => {
            if (index < text.length) {
                element.innerHTML += text.charAt(index);
                index++;
            } else {
                clearInterval(state.typewriterInterval);
                state.typewriterDone = true;
            }
        }, ms)
        if (window.innerWidth <= 576) { 
            setTimeout(renderCta, ms * (text.length + 3));
            state.ctaDisplayed = true;
        }
}

const renderCta = () => {
    if (!state.typewriterDone) {
        clearInterval(state.typewriterInterval);
    }
    desc.innerHTML = state.descText + state.ctaText;

    const cta = document.querySelector('.cta');

    if (cta) {
        setTimeout(() => {
            cta.classList.remove('hide');
        }, 10); // Short delay allows the browser to register opacity: 0 before switching to 1
    }
    state.typewriterDone;
}

// HANDLERS

const handleSocialElMouseover = (el) => {
    let audio = new Audio(`audio/${el.title.toLowerCase()}.wav`);
    audio.setAttribute('aria-muted', 'false');
    audio.play();                       

    let link = el.classList[1];
    let theme = el.classList[2];

    h1.textContent = el.title;
    el.firstChild.style.color = theme;
    h1.style.color = theme;
    navBrand.style.color = theme;

    let bgColor = `linear-gradient(-45deg, ${theme}30, white)`;
    body.style.background = `${bgColor}, ${leaves}`;

    if (link == 'resume') {
        el.firstChild.src = "../img/resume-hover.png"
    }

    if (state.hoveredSocialEls.length < 5 && isUniqueSocialEl(el)) {
        state.hoveredSocialEls.push(el);
        if (state.hoveredSocialEls.length == 5) {
            renderCta();
        }
    } else {}

    sessionStorage.setItem('theme', theme)
}

const handleSocialElTouch = (el) => {
    
}
    
const handleMeClick = () => {
    me.classList.toggle('spin');
    h1.style.color = 'black';
    body.style.background = leaves;

    navBrand.style.color = 'white';

    for (let el of socialEls) {
        let link = el.classList[1];
        el.firstChild.style.color = '#333333';
        if (link == 'resume') {
            el.firstChild.src = "../img/resume.png"
        }
        el.classList.toggle('spin');
    }

    sessionStorage.clear();
}

// INIT

const init = () => {
    window.addEventListener('load', () => {
        typewriter(desc, state.descText, 25);

        const theme = sessionStorage.getItem('theme');
        if (theme) {
            sessionStorage.removeItem('theme');
            // document.body.style.backgroundColor = `linear-gradient(-45deg, ${theme}40, white)`;
            // document.querySelector('.navbar-brand').style.color = theme;
        }
            
    });

    for (let el of socialEls) {
        el.firstChild.addEventListener('mouseover', () => {
            handleSocialElMouseover(el);
        });
        // el.firstChild.addEventListener('touchmove', () => {
        //     handleSocialElMouseover(el);
        // });
    };

    socialContainer.addEventListener('mouseout', () => {
        h1.textContent = 'Joe Lauletta';
    });

    socialContainer.addEventListener('touchend', () => {
        h1.textContent = 'Joe Lauletta';
        // socialContainer.removeEventListener('touchmove', () => {
        //     handleSocialElMouseover(el);
        // });
    });

    me.addEventListener('click', handleMeClick);
}


init();


// TODO(joe):

// fix      - mob-touch-pfp, social-slidebar, anim-talk, audio-cache, sessionStorage.clear() on index revisit in same session
// onload   - solo-face,  click -> container-slidein
// extras   - cta-border, social-hop, add-pedalboard, migrate