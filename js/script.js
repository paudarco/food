document.addEventListener('DOMContentLoaded', () => {

    // tabs
    const tabsContent = document.querySelectorAll('.tabcontent'),
          tabs = document.querySelectorAll('.tabheader__item'),
          tabsContainer = document.querySelector('.tabheader');
    
    function hideTabContent() {
        tabsContent.forEach(tab => {
            tab.classList.add('hide');
            tab.classList.remove('show', 'fade');
        });

        tabs.forEach(tab => {
            tab.classList.remove('tabheader__item_active');
        });
    }

    function showTabContent(i = 0) {
        tabsContent[i].classList.add('show', 'fade');
        tabsContent[i].classList.remove('hide');
        tabs[i].classList.add('tabheader__item_active');
    }

    hideTabContent();
    showTabContent();

    tabsContainer.addEventListener('click', event => {
        const target = event.target;

        if (target && target.classList.contains('tabheader__item')) {
            tabs.forEach((tab, i) => {
                if(tab == target) {
                    hideTabContent();
                    showTabContent(i);
                }
            });
        }
    });

    // timer
    const deadline = '2021-12-15';

    function getTImeRemaining(endtime) {
        const t = Date.parse(endtime) - Date.parse(new Date()),
              days = Math.floor(t / (1000 * 60 * 60 * 24)),
              hours = Math.floor((t / (1000 * 60 * 60)) % 24),
              minutes = Math.floor((t / (1000 * 60)) % 60),
              seconds = Math.floor((t / 1000) % 60);

        return {
            'total': t,
            days,
            hours,
            minutes,
            seconds
        };
    }

    function getZero(num) {
        if (num >= 0 && num < 10) {
            return `0${num}`;
        } else {
            return num;
        }
    }

    function setClock(selector, endtime) {
        const timer = document.querySelector(selector),
              days = timer.querySelector('#days'),
              hours = timer.querySelector('#hours'),
              minutes = timer.querySelector('#minutes'),
              seconds = timer.querySelector('#seconds'),
              timeInterval = setInterval(updateClock, 1000);

        updateClock();
        
        function updateClock() {
            const timeRemaining = getTImeRemaining(endtime);

            days.textContent = getZero(timeRemaining.days);
            hours.textContent = getZero(timeRemaining.hours);
            minutes.textContent = getZero(timeRemaining.minutes);
            seconds.textContent = getZero(timeRemaining.seconds);

            if (timeRemaining.total <= 0) {
                clearInterval(timeInterval);
            }
        }
    }

    setClock('.timer', deadline);

    // Modal

    const modalBtns = document.querySelectorAll('[data-modal]'),
          modal = document.querySelector('.modal');

    function showModal() {
        modal.classList.add('show');
        document.body.style.overflow = 'hidden';
        clearInterval(modalTimerId);
    }

    function closeModal() {
        modal.classList.remove('show');
        document.body.style.overflow = '';
    }

    modalBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            showModal();
        });
    });

    modal.addEventListener('click', event => {
        const target = event.target;
        if (target === modal || target.getAttribute('data-close') == '') {
            closeModal();
        }
    });

    document.addEventListener('keydown', event => {
        if (event.code == 'Escape' && modal.classList.contains('show')) {
            closeModal();
        }
    });

    const modalTimerId = setTimeout(showModal, 50000);

    function showModalByScroll() {
        if (window.pageYOffset + document.documentElement.clientHeight >= document.documentElement.scrollHeight) {
            showModal();
            window.removeEventListener('scroll', showModalByScroll);
        }
    }

    window.addEventListener('scroll', showModalByScroll);


    // Food menu
    class FoodMenuItem {
        constructor(src, alt, title, description, price, ...classes) {
            this.src = `./${src}`;
            this.alt = alt;
            this.title = title;
            this.description = description;
            this.price = price;
            this.classes = classes;
        }

        load(selector) {
            const parent = document.querySelector(selector);
            const element = document.createElement('div');

            if (this.classes.length <=  0) {
                element.classList.add('menu__item');
            } else {
                this.classes.forEach(className => element.classList.add(className));
            }
            
            element.innerHTML = `
                <img src="${this.src}" alt="${this.alt}">
                <h3 class="menu__item-subtitle">${this.title}</h3>
                <div class="menu__item-descr">${this.description}</div>
                <div class="menu__item-divider"></div>
                <div class="menu__item-price">
                    <div class="menu__item-cost">Цена:</div>
                    <div class="menu__item-total"><span>${this.price}</span> грн/день</div>
                </div>
            `;

            parent.append(element);
        }
    }

    const getResource = async (url) => {
        const res = await fetch(url);

        if (!res.ok) {
            throw new Error(`Could not fetch ${url}, status: ${res.status} `);
        } 
        return await res.json();
    }

    getResource('http://localhost:3000/menu')
        .then(data => {
            data.forEach(({img, altimg, title, descr, price}) => {
                new FoodMenuItem(img, altimg, title, descr, price, "menu__item").load('.menu .container');
            })
        });

    // Forms

    const forms = document.querySelectorAll('form');

    const message = {
        loading: './img/form/spinner.svg',
        success: 'Спасибо! Скоро мы с вами свяжемся :)',
        failure: 'Что-то пошло не так :('
    };

    forms.forEach(form => {
        bindPostData(form);
    });

    const postData = async (url, data) => {
        const res = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-type': 'application/json'
            },
            body: data
        });
        
        return await res.json();
    };

    function bindPostData(form) {
        form.addEventListener('submit', (event) => {
            // Чтобы отправка формы не перезагружала страницу
            event.preventDefault();

            const statusMessage = document.createElement('img');
            statusMessage.src = message.loading;
            statusMessage.style.cssText = `
                display: block;
                margin: 0 auto;
            `;
            form.insertAdjacentElement('afterend', statusMessage);

            const formData = new FormData(form);

            // Если мы работаем с xml, нам не обязательно создавать obj
            // достаточто просто передать formData в body для fetch

            const json = JSON.stringify(Object.fromEntries(formData.entries()));


            postData('http://localhost:3000/requests', json)
            .then(data => {
                console.log(data);
                showThanksModal(message.success);
                statusMessage.remove();
            }).catch(() => {
                showThanksModal(message.failure);
            }).finally(() => {
                form.reset();
            });
        });
    }

    function showThanksModal(message) {
        const prevModalDialog = document.querySelector('.modal__dialog');


        prevModalDialog.classList.add('hide');
        showModal();

        const thanksModal = document.createElement('div');
        thanksModal.classList.add('modal__dialog');
        thanksModal.innerHTML = `
            <div class="modal__content">
                <div class="modal__close" data-close>&times;</div>
                <div class="modal__title">${message}</div>
            </div>
        `;

        document.querySelector('.modal').append(thanksModal);

        setTimeout(() => {
            thanksModal.remove();
            prevModalDialog.classList.remove('hide');
            closeModal();
        }, 4000);
    }


    // Slider

    const slider = document.querySelector('.offer__slider'),
          offerPrev = document.querySelector('.offer__slider-prev'),
          offerNext = document.querySelector('.offer__slider-next'),
          currentSlide = document.querySelector('#current'),
          totalSlides = document.querySelector('#total'),
          slidesWrapper = document.querySelector('.offer__slider-wrapper'),
          slidesField = slidesWrapper.querySelector('.offer__slider-inner'),
          offerSlides = slidesWrapper.querySelectorAll('.offer__slide'),
          width = +window.getComputedStyle(slidesWrapper).width.replace(/\D/g, '');

    let slideIndex = 1;
    let offset = 0;

    slidesWrapper.style.overflow = 'hidden';

    slidesField.style.width = 100 * offerSlides.length + '%';
    slidesField.style.display = 'flex';
    slidesField.style.transition = '.5s';
    
    offerSlides.forEach(slide => {
        slide.style.width = width + 'px';  
    });

    slider.style.position = 'relative';

    const indicators = document.createElement('ol');
    indicators.classList.add('carousel-indicators');
    slider.append(indicators);

    for (let i = 0; i < offerSlides.length; i++) {
        const dot = document.createElement('li');
        dot.classList.add('dot');
        dot.setAttribute('data-slide-to', i);
        indicators.append(dot);
    }

    const dots = indicators.querySelectorAll('.dot')

    function activeDot(num) {
        dots.forEach(dot => dot.classList.remove('active'));

        dots[num].classList.add('active');
    }

    activeDot(offset);
    
    if (offset < 10) {
        currentSlide.textContent = `0${offset + 1}`;
    } else {
        currentSlide.textContent = offset + 1;
    }

    if (offerSlides.length < 9) {
        totalSlides.textContent = `0${offerSlides.length}`;
    } else {
        totalSlides.textContent = offerSlides.length;
    }

    offerNext.addEventListener('click', () => {
        if (offset == offerSlides.length - 1) {
            offset = 0;
        } else {
            offset++;
        }

        if (offset < 9) {
            currentSlide.textContent = `0${offset + 1}`;
        } else {
            currentSlide.textContent = offset + 1;
        }

        activeDot(offset);

        slidesField.style.transform = `translateX(-${offset * width}px)`
    })

    offerPrev.addEventListener('click', () => {
        if (offset == 0) {
            offset = offerSlides.length - 1;
        } else {
            offset--;
        }

        if (offset < 9) {
            currentSlide.textContent = `0${offset + 1}`;
        } else {
            currentSlide.textContent = offset + 1;
        }

        activeDot(offset);

        slidesField.style.transform = `translateX(-${offset * width}px)`
    })

    slider.addEventListener('click', (event) => {
        // dots.forEach((dot, i) => {
        //     if (event.target == dot) {
        //         offset = i;

        //         if (offset < 9) {
        //             currentSlide.textContent = `0${offset + 1}`;
        //         } else {
        //             currentSlide.textContent = offset + 1;
        //         }

                // activeDot(offset);

                // slidesField.style.transform = `translateX(-${offset * width.slice(0, width.length - 2)}px)`;
        //     }
        // });

        if (event.target.hasAttribute('data-slide-to')) {
            offset = +event.target.getAttribute('data-slide-to');

            if (offset < 9) {
                currentSlide.textContent = `0${offset + 1}`;
            } else {
                currentSlide.textContent = offset + 1;
            }

            activeDot(offset);

            slidesField.style.transform = `translateX(-${offset * width}px)`;
        }
    })

    

    
});