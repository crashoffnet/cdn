(function () {
    const APP_URL = 'https://crashoff.net'
    const APP_KEY = 'bzOM1HXTojkijkqJ'

    String.prototype.rtrim = function(s) { 
        return this.replace(new RegExp(s + "*$"), '');
    }

    const injectStyles = () => new Promise((resolve) => {
        const styles = document.createElement('link')
        styles.rel = 'stylesheet'
        styles.href = `${APP_URL}/extension.css?${Date.now()}`
        
        styles.onload = async () => {
            await new Promise((r) => setTimeout(r, 100))
            resolve()
        }

        document.head.appendChild(styles)
    })

    const logInfo = (clear = true) => {
        if (clear) {
            console.clear()
        }

        console.group('%cLeonardo запущен', 'font-size: large; color: orange')
        console.log('%cК сожалению, все вычисления происходят на стороне нашего сервера. Поэтому здесь не будет ничего интересного.', 'color: lightblue')
        console.log('%cМы никак не собираем ваши данные. Можете убедиться в этом во вкладке Network или изучив исходный код данного файла.', 'color: lightblue')
    }

    const viewApp = () => {
        if (!document.querySelector('.leo')) {
            const html = `
                <div class="leo-button">
                    <img src="${typeof leoImage !== 'undefined' && leoImage ? leoImage : 'https://crashoff.net/img/icon.jpg?'+Date.now()}" />
                </div>

                <div class="leo-refresh">
                    <div class="leo-refresh__tooltip">Сбросить расположение Leonardo</div>
                    <svg viewBox="0 0 24 24"><path fill="currentColor" d="M19,8L15,12H18A6,6 0 0,1 12,18C11,18 10.03,17.75 9.2,17.3L7.74,18.76C8.97,19.54 10.43,20 12,20A8,8 0 0,0 20,12H23M6,12A6,6 0 0,1 12,6C13,6 13.97,6.25 14.8,6.7L16.26,5.24C15.03,4.46 13.57,4 12,4A8,8 0 0,0 4,12H1L5,16L9,12" /></svg>
                </div>

                <div class="leo-app">
                    <div class="leo-app__close"><span></span><span></span></div>
                    <div class="leo-app__move"><span></span></div>
                </div>
            `

            const app = document.createElement('div')

            app.className = 'leo'

            app.innerHTML = html

            document.body.appendChild(app)

            return app
        }

        return null
    }

    let intervals = []

    const loop = (callback, time) => {
        intervals.push(setInterval(callback, time))
    }

    const closeApp = (app) => {
        app.querySelector('.leo-app').classList.remove('is-show')
        app.querySelector('.leo-button').classList.remove('is-hidden')
        app.querySelector('.leo-app iframe').remove()
        intervals.forEach((a) => clearInterval(a))
    }

    const getServiceUrl = () => {
        if (document.title.split(' ')[0] == 'UP-X') {
            return 'up-x.com'
        } else if (document.title.trim() == 'Aviator') {
            return 'lucky-jet.com'
        }
        
        return encodeURIComponent(location.href.rtrim('/').replace('https://', ''))
    }

    const getService = async () => {
        let serviceUrl = getServiceUrl()

        if (leoServices && serviceUrl) {
            let url = serviceUrl.split('.')

            if (url[0] == 'www') {
                url = url[1]
            } else {
                url = url[0]
            }

            if (url == 'crashoff' && serviceUrl.indexOf('app-frame') === -1) {
                return {
                    error: false,
                    name: 'master'
                }
            }

            let service = null

            for (const s of leoServices) {
                let stop = false

                for (const pattern of s.pattern.split(',')) {
                    if (url.indexOf(pattern.replace('!', '')) !== -1) {
                        if (pattern.includes('!')) {
                            stop = true
                        } else {
                            service = s.slug
                        }
                    }
                }

                if (stop) {
                    service = null
                }

                if (service) {
                    break
                }
            }

            if (service) {
                return {
                    error: false,
                    name: service
                }
            }
        } else if (serviceUrl) {
            const serviceResponse = await fetch(`${APP_URL}/api/service?url=${serviceUrl}`)
            return await serviceResponse.json()
        }

        return {
            error: true
        }
    }

    const getDynamicData = (serviceName) => {
        let returnData = null

        if (serviceName == 'csgorun') {
            returnData = {
                counter: document.querySelector('.graph-svg__counter').innerText.replace(/\s/g, ''),
                ratios: Array.from(document.querySelectorAll('a.px-7')).map((el) => parseFloat(el.innerText.replace('x', ''))),
                status: {'progress': 'progress', 'finish': 'crash', 'countdown': 'timer'}[document.querySelector('.graph-svg').className.split(' ')[1]]
            }
        } else if (serviceName == 'csfail') {
            let status = null, statusClass = document.querySelector('.bomb-timer').className.split(' ')[1]

            if (statusClass) {
                status = {'is-multiplier': 'progress', 'is-explosion': 'crash'}[statusClass]
            } else {
                status = 'timer'
            }

            let counter = document.querySelector('.bomb-timer__numbers').innerText.replace(/\s/g, '') + document.querySelector('.bomb-timer__ending').innerText.replace(/\s/g, '').replace('sec', 's')

            if (counter[0] == '0') {
                counter = counter.substr(1)
            }
            
            returnData = {
                counter,
                ratios: Array.from(document.querySelectorAll('.crash-history__wrapper a')).map((el) => parseFloat(el.innerText.replace('x', ''))),
                status
            }
        } else if (serviceName == 'up-x') {
            const crashCounter = document.querySelector('.crash-timer > :last-child'), waitCounter = document.querySelector('.crash-timer > :first-child')

            let status = null, counter = ''

            if (!crashCounter.style.color) {
                counter = waitCounter.innerText.replace(/\s/g, '').replace('СЕК', 's')
                status = 'timer'
            } else {
                counter = crashCounter.innerText.replace(/\s/g, '').replace('X', 'x')

                if (crashCounter.style.color == 'rgb(255, 54, 54)') {
                    status = 'crash'
                } else if (crashCounter.style.color == 'rgb(255, 255, 255)') {
                    status = 'progress'
                }
            }

            returnData = {
                counter,
                ratios: Array.from(document.querySelectorAll('.history-block__item')).map((el) => parseFloat(el.innerText.replace('x', ''))),
                status
            }
        } else if (serviceName == 'csgo500') {
            const counterText = document.querySelector('.info-text').innerHTML.trim()

            let status = null, counter = ''

            if (counterText.startsWith('Starting in')) {
                status = 'timer'
                counter = (Math.floor(parseFloat(counterText.replace('Starting in 0', '').replace('s', '')) * 10) / 10).toFixed(1) + 's'
            } else if (counterText.startsWith('Crashed at')) {
                status = 'crash'
                counter = counterText.replace('Crashed at x', '') + 'x'
            } else {
                status = 'progress'
                counter = counterText.replace('x', '') + 'x'
            }

            returnData = {
                counter,
                ratios: Array.from(document.querySelectorAll('.crash-round')).map((el) => parseFloat(el.innerText.replace('x', ''))),
                status
            }
        } else if (serviceName == 'csgoroll') {
            const crashCounter = document.querySelector('.score'), isCrash = document.querySelector('.ng-trigger-bustedShowAnim:not(.invisible)')

            let status = null, counter = ''

            if (crashCounter) {
                status = isCrash ? 'crash' : 'progress'
                counter = crashCounter.innerText.replace('x', '') + 'x'
            } else {
                status = 'timer'
                counter = (Math.floor(parseFloat(document.querySelector('.countdown').innerText) * 10) / 10).toFixed(1) + 's'
            }

            returnData = {
                counter,
                ratios: Array.from(document.querySelectorAll('.game')).map((el) => parseFloat(el.innerText)),
                status
            }
        } else if (serviceName == 'lucky-jet') {
            let originElement = null
            
            ;[...document.querySelectorAll('div')]
                .filter(a => a.textContent == 'Улетел')
                .forEach(a => originElement = a)

            let status = null, counter = ''

            if (!!parseInt(getComputedStyle(originElement).opacity)) {
                status = 'crash'
                counter = originElement.parentNode.firstChild.innerHTML + 'x'
            } else if (!!parseInt(originElement.parentNode.parentNode.style.opacity)) {
                status = 'progress'
                counter = originElement.parentNode.firstChild.innerHTML + 'x'
            } else {
                status = 'timer'
                counter = (Math.floor(parseFloat(originElement.parentNode.parentNode.parentNode.lastChild.lastChild.childNodes[0].style.width.replace('%')) / 100 * 5 * 10) / 10).toFixed(1) + 's'
            }

            returnData = {
                counter,
                ratios: Array.from(originElement.parentNode.parentNode.parentNode.parentNode.previousElementSibling.firstChild.childNodes).map((el) => parseFloat(el.innerText)),
                status
            }
        } else if (serviceName == 'csgoup') {
            const status = {'state--pending': 'timer', 'state--crashed': 'crash', 'state--started': 'progress'}[document.querySelector('.crash-bomb-state').classList[1]]

            let counter = ''

            if (status == 'timer') {
                counter = parseFloat(document.querySelector('.countdown').innerText.replace(/\s/g, '').replace(':', '.')).toFixed(1) + 's'
            } else {
                counter = parseFloat(document.querySelector('.crash-display-coefficient').innerText.replace(/\s/g, '').replace('x', '')).toFixed(2) + 'x'
            }

            returnData = {
                counter,
                ratios: Array.from(document.querySelectorAll('.history__list-item')).map((el) => parseFloat(el.innerText.replace('x', ''))),
                status
            }
        } else if (serviceName == 'lucky-duck') {
            let status = null, counter = ''

            if (document.querySelector('.crash-chart-game__rocket.crash-chart-game__rocket_launched.crash-chart-game__rocket_exploited')) {
                status = 'crash'
            } else if (document.querySelector('.crash-chart-game-number_multiplier strong').innerText && document.querySelector('.crash-chart-game-number_multiplier strong').innerText != '0.00x') {
                status = 'progress'
            } else {
                status = 'timer'
            }

            if (status == 'timer') {
                counter = parseInt(document.querySelector('.crash-chart-game-number_countdown').innerText.replace('00:', '')) + 's'
            } else {
                counter = document.querySelector('.crash-chart-game-number_multiplier strong').innerText
            }

            returnData = {
                counter, 
                ratios: Array.from(document.querySelectorAll('.crash-chart-history-multipliers__item .multiplier')).map((el) => parseFloat(el.innerText.replace('x', ''))),
                status
            }
        }

        if (returnData) {
            return {
                service: serviceName,
                ...returnData
            }
        } else {
            return {
                service: serviceName,
                counter: '0.00s',
                ratios: [],
                status: 'timer'
            }
        }
    }

    let globalService = null

    const openApp = (app) => {
        app.querySelector('.leo-button').classList.add('is-hidden')

        const iframe = document.createElement('iframe')
        
        iframe.allow = 'clipboard-read; clipboard-write'
        iframe.src = `${APP_URL}/app-frame?type=iframe`
        iframe.name = 'leoApp'

        iframe.onload = async () => {
            loop(() => {
                window.frames.leoApp.postMessage({ key: APP_KEY, action: 'ping', date: Date.now() }, '*')

                window.frames.leoApp.postMessage({ key: APP_KEY, action: 'dynamic_data', dynamicData: getDynamicData(globalService.name) }, '*')
            }, 100)
        }

        app.querySelector('.leo-app').appendChild(iframe)

        app.querySelector('.leo-app').classList.add('is-show')
    }

    let isButtonDragging = false, isButtonMouseDown = false, wasButtonDragging = false, initialRefreshButton = false

    const initRefreshButton = (app) => {
        if (!app.querySelector('.leo-refresh.is-active')) {
            app.querySelector('.leo-refresh').classList.add('is-active')
            app.querySelector('.leo-refresh').addEventListener('click', () => {
                localStorage.removeItem('leo_button_position_x')
                localStorage.removeItem('leo_button_position_y')
                localStorage.removeItem('leo_window_position_x')
                localStorage.removeItem('leo_window_position_y')

                location = location
            })
        }
    }

    const initButtonControls = (app) => {
        const leoButton = app.querySelector('.leo-button')

        let startX = 0, startY = 0, oldX = 0, oldY = 0, newX = 0, newY = 0

        let initialPositionX = localStorage.getItem('leo_button_position_x'), initialPositionY = localStorage.getItem('leo_button_position_y')

        if (initialPositionX && initialPositionY) {
            initialPositionX = parseInt(initialPositionX)
            initialPositionY = parseInt(initialPositionY)

            leoButton.style.right = initialPositionX + 'px'
            leoButton.style.bottom = initialPositionY + 'px'

            oldX = initialPositionX
            oldY = initialPositionY

            initialRefreshButton = true
        }

        document.addEventListener('mousedown', (e) => {
            if (e.target.closest('.leo-button')) {
                isButtonMouseDown = true

                startX = e.clientX + oldX
                startY = e.clientY + oldY
            }
        })

        document.addEventListener('mouseup', () => {
            if (isButtonDragging) {
                oldX = newX
                oldY = newY

                localStorage.setItem('leo_button_position_x', oldX)
                localStorage.setItem('leo_button_position_y', oldY)

                leoButton.classList.remove('is-dragging')
                isButtonDragging = false

                initRefreshButton(app)
            }

            newX = newY = startX = startY = 0
            isButtonMouseDown = false
        })

        document.addEventListener('mousemove', (e) => {
            const leoButtonWidth = leoButton.getBoundingClientRect().width, leoButtonHeight = leoButton.getBoundingClientRect().height

            if (isButtonMouseDown && (newX || newY) && (Math.abs(newX - oldX) > 5 || Math.abs(newY - oldY) > 5)) {
                leoButton.classList.add('is-dragging')
                isButtonDragging = wasButtonDragging = true
            }

            if (e.clientX >= leoButtonWidth / 2 && e.clientX < window.innerWidth - leoButtonWidth) {
                if (isButtonMouseDown) {
                    newX = startX - e.clientX
                }

                if (isButtonDragging) {
                    leoButton.style.right = newX + 'px'
                }
            }

            if (e.clientY >= leoButtonHeight / 2 && e.clientY < window.innerHeight - leoButtonHeight) {
                if (isButtonMouseDown) {
                    newY = startY - e.clientY
                }

                if (isButtonDragging) {
                    leoButton.style.bottom = newY + 'px'
                }
            }
        })
    }

    const initWindowControls = (app) => {
        let isMoving = false

        const leoApp = app.querySelector('.leo-app')

        let startX = 0, startY = 0, oldX = 0, oldY = 0, newX = 0, newY = 0, checkX = 0, checkY = 0, lastMove = 0, lastMoveMax = 500

        let initialPositionX = localStorage.getItem('leo_window_position_x'), initialPositionY = localStorage.getItem('leo_window_position_y'), initialHeight = 628

        if (initialPositionX && initialPositionY) {
            initialPositionX = parseInt(initialPositionX)
            initialPositionY = parseInt(initialPositionY)

            leoApp.style.right = initialPositionX + 'px'
            leoApp.style.height = initialHeight + initialPositionY + 'px'

            oldX = initialPositionX
            oldY = initialPositionY

            initialRefreshButton = true
        }

        document.addEventListener('mousedown', (e) => {
            if (e.target.closest('.leo-app__move')) {
                isMoving = true

                startX = e.clientX + oldX
                startY = e.clientY + oldY

                lastMove = Date.now()

                leoApp.classList.add('is-dragging')
            }
        })

        const onMouseUp = () => {
            if (isMoving) {
                oldX = newX
                oldY = newY

                localStorage.setItem('leo_window_position_x', oldX)
                localStorage.setItem('leo_window_position_y', oldY)

                isMoving = false

                leoApp.classList.remove('is-dragging')
                initRefreshButton(app)
            }

            newX = newY = startX = startY = lastMove = 0
            isButtonMouseDown = false
        }

        document.addEventListener('mouseup', onMouseUp)

        document.addEventListener('mousemove', (e) => {
            const leoAppWidth = leoApp.getBoundingClientRect().width, leoAppHeight = leoApp.getBoundingClientRect().height

            if (e.clientX >= leoAppWidth / 2 + 40 && e.clientX < window.innerWidth - leoAppWidth / 2 - 40) {
                checkX = newX
                newX = startX - e.clientX

                if (isMoving) {
                    if (lastMove + lastMoveMax < Date.now() && checkX != newX) {
                        onMouseUp()
                    } else {
                        lastMove = Date.now()
                        leoApp.style.right = newX + 'px'
                    }
                }
            }

            if (e.clientY >= 40 && e.clientY < window.innerHeight - leoAppHeight / 2 - 40) {
                checkY = newY
                newY = startY - e.clientY

                if (isMoving) {
                    if (lastMove + lastMoveMax < Date.now() && checkY != newY) {
                        onMouseUp()
                    } else {
                        lastMove = Date.now()
                        leoApp.style.height = initialHeight + newY + 'px'
                    }
                }
            }
        })
    }

    const startApp = async () => {
        globalService = await getService()

        if (globalService && !globalService.error) {
            if (!document.getElementById('leo-inline-styles')) {
                await injectStyles()
            }
            
            const app = viewApp()

            if (!app) {
                return
            }

            // logInfo()

            setTimeout (() => {
                app.classList.add('is-show')

                app.querySelector('.leo-button').addEventListener('click', () => {
                    if (!wasButtonDragging) {
                        openApp(app)
                    } else {
                        wasButtonDragging = false
                    }
                })

                app.querySelector('.leo-app__close').addEventListener('click', () => closeApp(app))

                initButtonControls(app)
                initWindowControls(app)

                if (initialRefreshButton) {
                    initRefreshButton(app)
                }
            }, 100)
        }
    }

    const WebSocketProxy = new Proxy(window.WebSocket, {
        construct(target, args) {
            console.log(args);
        
            const instance = new target(...args);
        
            const openHandler = (event) => {
                console.log('Open', event);
            };
        
            const messageHandler = (event) => {
                console.log('Message', event);
            };
        
            const closeHandler = (event) => {
                console.log('Close', event);
                instance.removeEventListener('open', openHandler);
                instance.removeEventListener('message', messageHandler);
                instance.removeEventListener('close', closeHandler);
            };
        
            instance.addEventListener('open', openHandler);
            instance.addEventListener('message', messageHandler);
            instance.addEventListener('close', closeHandler);
        
            const sendProxy = new Proxy(instance.send, {
                apply: function(target, thisArg, _args) {
                    console.log('Send', _args);
                    target.apply(thisArg, _args);
                }
            });
        
            instance.send = sendProxy;
        
            return instance;
        },
        });
        
        window.WebSocket = WebSocketProxy;

    setTimeout(startApp, 500)
})()