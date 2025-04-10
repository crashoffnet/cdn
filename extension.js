(function () {
    const APP_URL = 'https://crashoff.net'
    const APP_KEY = 'bzOM1HXTojkijkqJ'
    const APP_VERSION = '1.5.0'

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

        console.group(`%cLeonardo (v${APP_VERSION}) запущен`, 'font-size: large; color: orange')
        console.log('%cК сожалению, все вычисления происходят на стороне нашего сервера. Поэтому здесь не будет ничего интересного.', 'color: lightblue')
        console.log('%cМы никак не собираем ваши данные. Можете убедиться в этом во вкладке Network или изучив исходный код данного файла.', 'color: lightblue')
    }

    const getImage = () => (typeof leoImage !== 'undefined' && leoImage ? leoImage : 'https://crashoff.net/img/icon.jpg?'+Date.now())

    const viewApp = () => {
        if (!document.querySelector('.leo')) {
            const html = `
                <div class="leo-button">
                    <img src="${getImage()}" />
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
        if (document.title.includes('Нейросеть')) {
            return 'master'
        } else if (document.title.split(' ')[0] == 'UP-X') {
            return 'up-x.com'
        } else if (document.title.trim() == 'Aviator') {
            return 'lucky-jet.com'
        } else if (document.title.includes('Dragon Money')) {
            return 'drgn.com'
        } else if (document.title.includes('GET-X')) {
            return 'getx.com'
        } else if (document.title.includes('CSGORUN')) {
            return 'csgorun.com'
        }
        
        return encodeURIComponent(location.href.rtrim('/').replace('https://', ''))
    }

    const getService = async () => {
        let serviceUrl = getServiceUrl()

        if (serviceUrl) {
            if (typeof leoServices !== 'undefined' && leoServices) {
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
                        if (pattern.includes('!')) {
                            const newUrl = serviceUrl.split('.')

                            for (let i = 0; i < newUrl.length - 1; i++) {
                                if (newUrl[i].indexOf(pattern.replace('!', '')) !== -1) {
                                    stop = true
                                    break
                                }
                            }
                        } else if (url.indexOf(pattern) !== -1) {
                            service = {
                                name: s.slug,
                                modes: JSON.parse(s.modes)
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
                        ...service
                    }
                }
            } else {
                const serviceResponse = await fetch(`${APP_URL}/api/service?url=${serviceUrl}`)
                return await serviceResponse.json()
            }
        }

        return {
            error: true
        }
    }

    const getServiceMode = (map) => {
        for (const name in map) {
            if (name == 'crash') {
                continue
            }

            if (location.pathname.includes(map[name])) {
                return name
            }
        }

        return 'crash'
    }

    const getDynamicData = ({ name: serviceName, modes: serviceModes }) => {
        let returnData = null

        let serviceMode = getServiceMode(serviceModes)

        if (serviceMode == 'mines' || serviceMode == 'slots') {
            returnData = {}
        } else if (serviceName == 'csgorun') {
            returnData = {
                counter: document.querySelector('[data-crash-counter]').getAttribute('data-value'),
                ratios: Array.from(document.querySelectorAll('.crash-history-item')).map((el) => parseFloat(el.innerText.replace('X', ''))),
                status: {'В раунде': 'progress', 'Краш': 'crash', 'Раунд через': 'timer'}[document.querySelector('[data-crash-counter-desc]').innerText]
            }
        } else if (serviceName == 'csfail') {
            let status = null, statusClass = document.querySelector('crash-home-timer').className

            if (statusClass) {
                status = {'is-multiplier': 'progress', 'is-dead': 'crash'}[statusClass]
            } else {
                status = 'timer'
            }

            let counter = document.querySelector('.timer__timer').innerText.replace(/\s/g, '')
            
            returnData = {
                counter: counter.includes('x') ? counter.replace('x', '') + 'x' : counter,
                ratios: Array.from(document.querySelectorAll('.history__game')).map((el) => parseFloat(el.innerText.replace('x', ''))),
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
                counter = (Math.floor(parseFloat(originElement.parentNode.parentNode.parentNode.lastChild.lastChild.childNodes[0].style.width.replace('%', '')) / 100 * 5 * 10) / 10).toFixed(1) + 's'
            }

            returnData = {
                counter,
                ratios: Array.from(originElement.parentNode.parentNode.parentNode.parentNode.previousElementSibling.firstChild.childNodes).map((el) => parseFloat(el.innerText)),
                status
            }
        } else if (serviceName == 'csgoup') {
            const status = {'state--countdown': 'timer', 'state--finished': 'crash', 'state--started': 'progress'}[document.querySelector('.crash-bomb-state').classList[1]]

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
        } else if (serviceName == 'dragon-money') {
            const ratioElement = document.querySelector('.multiplier-view'), graphicElement = document.querySelector('button[name="guard"]')

            if (!ratioElement) {
                graphicElement.click()
            }

            if (graphicElement) {
                graphicElement.remove()
            }

            let status = null, counter = ''

            if (document.querySelector('.absolute.text-center.text-h5.text-yellow').style.display == 'none') {
                if (document.querySelector('.multiplier-view.no-schedule-end')) {
                    status = 'crash'
                } else {
                    status = 'progress'
                }

                counter = ratioElement.innerText
            } else {
                status = 'timer'
                counter = parseFloat(document.querySelector('.absolute.text-center.text-h5.text-yellow p').innerText.replace('с.', '').trim()).toFixed(1) + 's'
            }

            returnData = {
                counter,
                ratios: Array.from(document.querySelectorAll('.history-buttons-cont .item')).map((el) => parseFloat(el.innerText.replace('x', ''))),
                status
            }
        } else if (serviceName == 'get-x') {
            const ratioElement = document.querySelector('.ratio-timer')

            let status = null, counter = ''

            if (ratioElement.style.display != 'none') {
                if (document.querySelector('.ratio-timer.ratio-timer__red')) {
                    status = 'crash'
                } else {
                    status = 'progress'
                }

                counter = ratioElement.querySelector('span:first-child').innerText + 'x'
            } else {
                status = 'timer' 
                counter = (Math.floor((1 - parseFloat(getComputedStyle(document.querySelector('.loader__line')).width.replace('px', '')) / 192) * 6 * 10) / 10).toFixed(1) + 's'
            }

            returnData = {
                counter,
                ratios: Array.from(document.querySelectorAll('.line-tags__tag')).map((el) => parseFloat(el.innerText.split(' ')[0])),
                status
            }
        } else if (serviceName == 'csgopolygon') {
            const counterText = document.querySelector('.crash-info').innerText.toLowerCase()

            let status = 'progress', counter = null

            if (counterText.includes('crashed')) {
                status = 'crash'
                counter = counterText.replace('crashed x', '') + 'x'
            } else if (counterText.includes('next round')) {
                status = 'timer'
                counter = counterText.replace('next round in ', '').replace(' s..', '') + 's'
            } else {
                counter = counterText.replace('x', '') + 'x'
            }

            counter = counter.replace('loading..', '0.00')

            returnData = {
                counter,
                ratios: Array.from(document.querySelectorAll('.crash-history li span')).map((el) => parseFloat(el.innerText)),
                status
            }
        } else if (serviceName == 'lootrun') {
            let status = {'progress': 'progress', 'finish': 'crash', 'countdown': 'timer'}[document.querySelector('.graph-svg').className.split(' ')[1]], counter = null

            if (['progress', 'crash'].includes(status)) {
                counter = document.querySelector('.graph-svg > div:first-child > div:first-child').innerText.replace('x', '') + 'x'
            } else {
                counter = parseFloat(document.querySelector('.graph-svg > div:nth-child(2) > div:first-child').innerText.replace('s', '')).toFixed(1) + 's'
            }

            returnData = {
                counter,
                ratios: Array.from(document.querySelectorAll('.graph-svg + * li')).map((el) => parseFloat(el.innerText)),
                status
            }
        } else if (serviceName == 'knife-x') {
            let status = 'timer', counter = null

            if (document.querySelector('.crashAnim').classList[3] == 'is-opened') {
                if (document.querySelector('.crashAnim__coeff.is-lost')) {
                    status = 'crash'
                } else {
                    status = 'progress'
                }

                counter = document.querySelector('.crashAnim__coeff').innerText.replace(/\r?\n/g, '').replaceAll('-', '').replace('X', '') + 'x'
            } else {
                counter = parseFloat(document.querySelector('.crashAnim__timer span').innerText).toFixed(1) + 's'
            }

            returnData = {
                counter,
                ratios: Array.from(document.querySelectorAll('.latest-track__item span')).map((el) => parseFloat(el.innerText)),
                status
            }
        } else if (serviceName == 'kebup') {
            let status = document.querySelector('.crash-wrapper').classList[1].replace('status-', ''), counter = document.querySelector('.crash-timer').innerText.replace('Краш на ', '')

            returnData = {
                counter,
                ratios: Array.from(document.querySelectorAll('.crash-ratios__item')).map((el) => parseFloat(el.innerText)),
                status
            }
        }

        const serviceLinks = {}

        for (const mode in serviceModes) {
            serviceLinks[mode] = location.origin + serviceModes[mode]
        }

        if (returnData) {
            return {
                service: serviceName,
                mode: serviceMode,
                modes: serviceLinks,
                ...returnData
            }
        } else {
            return {
                service: serviceName,
                mode: 'crash',
                modes: { 'crash': 'default' },
                counter: '0.00s',
                ratios: [],
                status: 'timer'
            }
        }
    }

    let globalService = null

    const openApp = (app) => {
        app.querySelector('.leo-button').classList.add('is-hidden')

        let warningNotification = localStorage.getItem('leo_warning')

        warningNotification = warningNotification ? parseInt(warningNotification) : 0

        if (warningNotification < 3) {
            pushNotification('Предупреждение', 'Для корректной работы Leonardo необходимо создавать чистые аккаунты через вкладку «Сервисы».', 'left')

            localStorage.setItem('leo_warning', warningNotification + 1)
        }

        const isSignals = globalService.modes['signals']

        const iframe = document.createElement('iframe')
        
        iframe.allow = 'clipboard-read; clipboard-write'
        iframe.src = isSignals ? `${APP_URL}/app-frame?type=signals&service=${globalService.name}` : `${APP_URL}/app-frame?type=iframe`
        iframe.name = 'leoApp'

        iframe.onload = async () => {
            loop(() => {
                window.frames.leoApp.postMessage({ key: APP_KEY, action: 'ping', date: Date.now() }, '*')

                if (!isSignals) {
                    window.frames.leoApp.postMessage({ key: APP_KEY, action: 'dynamic_data', dynamicData: getDynamicData(globalService) }, '*')
                }
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
    
    const pushNotification = (title, text, type = 'right') => {
        const element = document.createElement('div')
        element.className = `leo-notification leo-notification__${type}`
        element.innerHTML = `<div class="leo-notification__close" onclick="this.parentNode.remove()"><span></span><span></span></div><div class="leo-notification__title"><img src="${getImage()}" /> ${title}</div><div class="leo-notification__text">${text}</div>`
        document.body.appendChild(element)

        setTimeout(() => {
            element.classList.add('is-show')
        }, 100)
    }

    const createOverlay = () => {
        const overlay = document.createElement('div')
        overlay.className = 'leo-overlay'
        return overlay
    }

    const createGuide = (text) => {
        const guideElement = document.createElement('div')
        guideElement.className = 'leo-guide'
        guideElement.innerHTML = text

        document.body.appendChild(guideElement)
    }

    const getUserConfig = async (unique_id) => {
        const request = await fetch(`https://crashoff.net/api/config?unique_id=${unique_id}`)
        const response = await request.json()

        return response
    }

    const checkWebsite = (name) => {
        return location.href.startsWith('https://'+name)
    }

    const configHandler = async () => {
        if (!document.getElementById('leo-config-done')) {
            const taskDoneElement = document.createElement('div')
            taskDoneElement.id = 'leo-config-done'
            document.body.appendChild(taskDoneElement)

            let userConfig = localStorage.getItem('leo_user_config')

            if (userConfig) {
                userConfig = JSON.parse(userConfig)
                
                if (checkWebsite('vk.com')) {
                    if (userConfig.config_vk_ads) {
                        setInterval(() => {
                            document.querySelectorAll('._ads_block_data_w').forEach((el) => el.parentNode.remove())
                        }, 500)
                    } else {
                        const leftAds = document.getElementById('ads_left')

                        if (leftAds) {
                            leftAds.classList.add('is-show')

                            let vkAdsSeen = localStorage.getItem('leo_ads_vk_seen')

                            if (!vkAdsSeen) {
                                vkAdsSeen = 0
                            } else {
                                vkAdsSeen = parseInt(vkAdsSeen)
                            }

                            if (Math.random() <= 0.5 && vkAdsSeen + 1000 * 3600 * 3 < Date.now()) {
                                setTimeout(() => {
                                    const ads = document.createElement('a')

                                    ads.onmousedown = () => {
                                        localStorage.setItem('leo_ads_vk_seen', Date.now())
                                    }

                                    ads.href = 'https://telegra.ph/Arhiv-urokov-03-03'
                                    ads.className = 'leo-ads-vk'
                                    ads.innerHTML = `<div class="ads_ad_box redesign"><img src="${getImage()}"><div class="ads_ad_title ver repeat_ver redesign" style="font-weight: 700">Гайд по игре</div><div class="ads_ad_domain ver redesign">LEONARDO</div><div style="color: white;margin-top: 3px;line-height: 15px;">Узнайте как правильно играть с Leonardo и какие существуют тактики</div></div>`
                                    leftAds.appendChild(ads)
                                }, 300)
                            }
                        }
                    }
                }
            }
        }
    }

    const actionHandler = async () => {
        if (!document.getElementById('leo-task-done')) {
            const taskDoneElement = document.createElement('div')
            taskDoneElement.id = 'leo-task-done'
            document.body.appendChild(taskDoneElement)

            const params = new Proxy(new URLSearchParams(window.location.search), {
                get: (searchParams, prop) => searchParams.get(prop),
            })

            if (checkWebsite('vk.com')) {
                const vkElement = document.querySelector('.left_menu_nav_wrap > :first-child')
                vkElement.outerHTML = `<a class="left_menu_nav" href="https://vk.com/crashoffnet">Leonardo</a>${vkElement.outerHTML}`
            }

            const sendPush = (close = true, accent = true) => {
                document.querySelectorAll('.like_btns, #page_actions_btn').forEach((el) => el.style.pointerEvents = 'none')
                pushNotification('Задание выполнено автоматически', 'Вернитесь в расширение и нажмите на «Завершить», чтобы получить вознаграждение. ' + (close ? 'Вкладка закроется через 5 секунд.' : ''))

                if (accent) {
                    document.querySelector('.post').style.zIndex = 99999
                    document.getElementById('page_wall_posts').appendChild(createOverlay())
                }

                if (close) {
                    setTimeout(() => {
                        window.close()
                    }, 5000)
                }
            }

            const isYouTubeTask = () => {
                if (params.ab_channel && ['ЛудоманчикЛео'].includes(params.ab_channel)) {
                    return true
                } else {
                    const titleElement = document.querySelector('h1.ytd-watch-metadata')

                    if (titleElement) {
                        const title = titleElement.innerHTML.toLowerCase()
                        return title.includes('leonardo') || title.includes('леонардо') || title.includes('нейросеть')
                    }
                }

                return false
            }

            if (params.la) {
                if (params.la == 'vk_like') {
                    if (document.querySelector('.PostButtonReactions--active')) {
                        sendPush()
                    } else {
                        document.querySelector('.PostButtonReactions').click()
                        sendPush(false)
                    }
                } else if (params.la == 'vk_repost') {
                    document.querySelector('._share').click()

                    setTimeout(() => {
                        document.querySelector('.like_btns').style.pointerEvents = 'none'
                        document.getElementById('like_share_my').click()
                        document.getElementById('like_share_text').innerText = 'Классная тема 🤔'
                        document.getElementById('like_share_send').click()

                        sendPush(false)
                    }, 1000)
                } else if (params.la == 'vk_subscribe') {
                    setTimeout(() => {
                        const recommendGroup = document.querySelector('.page_menu_group_like')
                        const notificationsElement = document.querySelector('.redesigned-group-main-action[data-act="1"], .redesigned-group-main-action[data-act="0"]')

                        if (recommendGroup.getAttribute('data-state') != 1) {
                            recommendGroup.click()
                        }

                        setTimeout(() => {
                            if (!notificationsElement) {
                                if (recommendGroup.nextElementSibling.getAttribute('data-act') != 0) {
                                    recommendGroup.nextElementSibling.click()
                                }
                            } else {
                                if (notificationsElement.getAttribute('data-act') != 0) {
                                    notificationsElement.click()
                                }
                            }

                            setTimeout(() => {
                                let bookmark = document.querySelector('.redesigned-group-main-actions > :first-child .redesigned-group-main-action__text')

                                if (bookmark) {
                                    if (bookmark.innerHTML == 'Избранное') {
                                        bookmark.click()
                                    }
                                } else {
                                    bookmark = document.querySelector('a[onclick*="Fave"] .PageActionCell__label')

                                    if (bookmark && bookmark.innerHTML == 'Сохранить в закладках') {
                                        bookmark.click()
                                    }
                                }
                            }, 100)
                        }, 100)
                    }, 100)

                    if (document.getElementById('public_subscribe')) { 
                        document.getElementById('public_subscribe').click()
                        sendPush(true, false)
                    } else if (document.getElementById('page_actions_btn')) {
                        sendPush(true, false)
                    }
                } else if (params.la == 'vk') {
                    const vk_id = document.getElementById('l_ph')?.querySelector('a')?.href?.split('albums')[1]

                    createGuide('Открываем гайд Leonardo...')

                    if (vk_id) {
                        await fetch(`https://crashoff.net/api/vk?vk_id=${vk_id}&unique_id=${params.la_user}`)
                    } else {
                        await fetch(`https://crashoff.net/api/vk?vk_id=-1&unique_id=${params.la_user}`)
                    }

                    location = 'https://telegra.ph/Arhiv-urokov-03-03'
                } else if (params.la == 'config') {
                    createGuide('Настраиваем сайт...')

                    const config = await getUserConfig(params.la_user)

                    if (config?.unique_id) {
                        localStorage.setItem('leo_user_config', JSON.stringify(config))
                    }

                    window.close()
                } 

                return true
            } else if (isYouTubeTask()) {
                let likeButton = null

                while (!likeButton) {
                    likeButton = document.querySelector('#segmented-like-button > * > * > *')
                    await new Promise((resolve) => setTimeout(resolve, 500))
                }

                const likeWrapper = document.querySelector('ytd-segmented-like-dislike-button-renderer')

                if (likeButton.getAttribute('aria-pressed') != 'true') {
                    likeButton.click()
                }

                likeWrapper.style.pointerEvents = 'none'

                const subscribeButton = document.querySelector('#subscribe-button > * > * > *')
                const notificationButton = document.getElementById('notification-preference-button')

                if (document.querySelector('#notification-preference-button[hidden]')) {
                    subscribeButton.click()

                    document.querySelector('#notification-preference-button > * > * > *').click()

                    setTimeout(() => {
                        document.querySelector('ytd-menu-service-item-renderer:first-child').click()
                        notificationButton.style.pointerEvents = 'none'
                    }, 300)
                } else {
                    notificationButton.style.pointerEvents = 'none'
                }

                return true
            }

            return false
        }

        return true
    }

    const startYouTubeWorker = () => {
        if (window.location.href == 'https://www.youtube.com/' && document.querySelector('#contents > ytd-rich-item-renderer')) {
            const videoData = leoServices.find(a => a.slug == 'YT_ADS')
            const lastVideo = localStorage.getItem('yt-ads')

            if (videoData && lastVideo != videoData.videoUrl) {
                const html = `<div id="content" class="style-scope ytd-rich-item-renderer">
                    <ytd-rich-grid-media class="style-scope ytd-rich-item-renderer" lockup="true">
                    <div id="dismissible" class="style-scope ytd-rich-grid-media">
                        <div id="thumbnail" class="style-scope ytd-rich-grid-media">
                        <ytd-thumbnail rich-grid-thumbnail="" use-hovered-property="" width="9999" class="style-scope ytd-rich-grid-media" size="large" loaded="">
                            <a id="thumbnail" class="yt-simple-endpoint inline-block style-scope ytd-thumbnail" aria-hidden="true" tabindex="-1" rel="null" href="${videoData.videoUrl}">
                            <yt-image alt="" ftl-eligible="" notify-on-loaded="" notify-on-unloaded="" class="style-scope ytd-thumbnail">
                                <img alt="" class="yt-core-image yt-core-image--fill-parent-height yt-core-image--fill-parent-width yt-core-image--content-mode-scale-aspect-fill yt-core-image--loaded" style="background-color:transparent" src="${videoData.videoCover}">
                            </yt-image>
                            <div id="overlays" class="style-scope ytd-thumbnail">
                                <ytd-thumbnail-overlay-time-status-renderer class="style-scope ytd-thumbnail" hide-time-status="" overlay-style="DEFAULT">
                                <div class="thumbnail-overlay-badge-shape style-scope ytd-thumbnail-overlay-time-status-renderer">
                                    <badge-shape class="badge-shape-wiz badge-shape-wiz--thumbnail-default badge-shape-wiz--thumbnail-badge" role="img">
                                    <div class="badge-shape-wiz__text">5:25</div>
                                    </badge-shape>
                                </div>
                                </ytd-thumbnail-overlay-time-status-renderer>
                            </div>
                            </a>
                        </ytd-thumbnail>
                        </div>
                        <div id="details" class="style-scope ytd-rich-grid-media">
                        <div id="avatar-container" class="yt-simple-endpoint style-scope ytd-rich-grid-media">
                            <a id="avatar-link" class="yt-simple-endpoint style-scope ytd-rich-grid-media" tabindex="-1" hidden="" href="${videoData.videoUrl}">
                            <yt-img-shadow id="avatar" width="48" class="style-scope ytd-rich-grid-media no-transition empty" style="background-color:transparent">
                                <img id="img" draggable="false" class="style-scope yt-img-shadow" alt="" width="48">
                            </yt-img-shadow>
                            </a>
                            <div id="decorated-avatar" class="style-scope ytd-rich-grid-media">
                            <yt-decorated-avatar-view-model class="yt-decorated-avatar-view-model-wiz style-scope ytd-rich-grid-media">
                                <yt-avatar-shape>
                                <div class="yt-spec-avatar-shape yt-spec-avatar-shape__button yt-spec-avatar-shape__button--button-medium yt-spec-avatar-shape__button--tappable" aria-label="Перейти на канал" role="button" tabindex="0">
                                    <div class="">
                                    <div class="yt-spec-avatar-shape--avatar-size-medium">
                                        <img alt="" class="yt-core-image yt-spec-avatar-shape__image yt-core-image--fill-parent-height yt-core-image--fill-parent-width yt-core-image--content-mode-scale-to-fill yt-core-image--loaded" src="https://yt3.googleusercontent.com/Qg_Nqf1e-9RoHGeTdrWbf_jkDGiaDDLQetNUOsx8Pjo5GfrSakOwDm7fxP1fXd_cFaTLjknvIXM=s160-c-k-c0x00ffffff-no-rj">
                                        <div class="yt-spec-avatar-shape__image-overlays yt-spec-avatar-shape__image"></div>
                                    </div>
                                    </div>
                                </div>
                                </yt-avatar-shape>
                            </yt-decorated-avatar-view-model>
                            </div>
                        </div>
                        <div id="meta" class="style-scope ytd-rich-grid-media">
                            <h3 class="style-scope ytd-rich-grid-media">
                            <a id="video-title-link" class="yt-simple-endpoint focus-on-expand style-scope ytd-rich-grid-media" href="${videoData.videoUrl}">
                                <div id="video-title" class="style-scope ytd-rich-grid-media leo-video-title">${videoData.videoTitle}</div>
                            </a>
                            </h3>
                            <ytd-video-meta-block class="grid style-scope ytd-rich-grid-media byline-separated" rich-meta="" amsterdam-post-mvp="">
                            <div id="metadata" class="style-scope ytd-video-meta-block">
                                <div id="byline-container" class="style-scope ytd-video-meta-block">
                                <ytd-channel-name id="channel-name" class="style-scope ytd-video-meta-block style-scope ytd-video-meta-block">
                                    <div id="container" class="style-scope ytd-channel-name">
                                    <div id="text-container" class="style-scope ytd-channel-name">
                                        <div id="text" link-inherit-color="" respect-lang-dir="" class="style-scope ytd-channel-name complex-string" ellipsis-truncate="" ellipsis-truncate-styling="" dir="auto" has-link-only_="" style="text-align:left">
                                        <a class="yt-simple-endpoint style-scope yt-formatted-string" spellcheck="false" href="${videoData.videoUrl}">Aura Gambling — iGaming на русском</a>
                                        </div>
                                    </div>
                                    </div>
                                </ytd-channel-name>
                                </div>
                                <div id="metadata-line" class="style-scope ytd-video-meta-block">
                                <div id="separator" class="style-scope ytd-video-meta-block" hidden="">•</div>
                                <span class="inline-metadata-item style-scope ytd-video-meta-block">${videoData.videoViews}&nbsp;тыс. просмотров</span>
                                <span class="inline-metadata-item style-scope ytd-video-meta-block">3 дня назад</span>
                                </div>
                            </div>
                            </ytd-video-meta-block>
                        </div>
                        </div>
                    </div>
                    </ytd-rich-grid-media>
                </div>`

                document.querySelector('#contents').insertAdjacentHTML('afterbegin', `
                    <ytd-rich-item-renderer class="style-scope ytd-rich-grid-renderer" items-per-row="1" lockup="true" rendered-from-rich-grid="" is-in-first-column="" is-link-card-full-width="" id="leo-video">
                        ${html}
                    </ytd-rich-item-renderer>
                `)

                setInterval(() => {
                    if (!document.querySelector('.leo-video-title')) {
                        document.getElementById('leo-video').innerHTML = html
                    }
                }, 100)

                document.getElementById('leo-video')?.addEventListener('click', () => {
                    localStorage.setItem('yt-ads', videoData.videoUrl)
                })
            }
        }

        return 

        try {
            if (window === window.top) {
                const targetSlugs = ['kebup.top', 'twitch.tv', 'kick.com', 'vk.com', 'youtube.com', 'telegram.org', 'whatsapp.com']

                const checkHref = () => {
                    let check = false

                    for (const slug of targetSlugs) {
                        if (window.location.href.includes(slug)) {
                            check = true
                            break
                        }
                    }

                    return check
                }

                if (checkHref() && !document.querySelector('.yt-iframe')) {
                    const videoData = leoServices.find(a => a.slug == 'YT_ADS')
                    const lastYtTime = parseInt(localStorage.getItem('yt-ads')) || 0

                    if (videoData.video && lastYtTime < Date.now() - 1000 * 120) {
                        localStorage.setItem('yt-ads', Date.now())

                        setTimeout(() => {
                            const test = document.createElement('div')
                            test.innerHTML = `<iframe class="yt-iframe" width="1280" height="720" src="https://www.youtube.com/leo-extension-init/${videoData.video}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen style="opacity: 0.00001; pointer-events: none; position: absolute; top: 0; left: 0; z-index: 999999"></iframe>`
                            document.body.append(test)
                        }, 120 * 1000)
                    }
                }
            }

            if (window.location.href.includes('youtube.com')) {
                const ytNextStep = localStorage.getItem('yt-next-step')

                if (ytNextStep) {
                    if (window.location.href == 'https://www.youtube.com/' && ytNextStep.startsWith('play')) {
                        localStorage.setItem('yt-next-step', 'mute')
                        setTimeout(() => window.location = 'https://www.youtube.com/watch?v=' + ytNextStep.split('=')[1], 1000)
                    } else if (window.location.href.startsWith('https://www.youtube.com/watch') && ytNextStep == 'mute') {
                        const video = document.querySelector('.video-stream')

                        if (video) {
                            const muteAll = () => {
                                video.volume = 0
                                video.muted = true
                                video.setAttribute('muted', 'muted')
                            }

                            muteAll()

                            setInterval(muteAll, 500)

                            window.addEventListener('load', () => {
                                if (!video.playing) {
                                    setTimeout(() => {
                                        muteAll()
                                        video.play()
                                    }, 1000)
                                }

                                localStorage.removeItem('yt-next-step')
                            })
                        }
                    }
                }
                
                if (window.location.href.includes('/leo-extension-init/')) {
                    let videoSlug = window.location.href.split('/')
                    videoSlug = videoSlug[videoSlug.length - 1]

                    localStorage.setItem('yt-next-step', 'play=' + videoSlug)
                    window.location = '/'
                }
            }
        } catch (e) {
            console.error('error', e)
        }
    }

    const startApp = async () => {
        await configHandler()

        if (await actionHandler()) {
            return
        }

        startYouTubeWorker()

        globalService = await getService()

        if (globalService && !globalService.error) {
            if (!localStorage.getItem('leo_linked') && globalService.name != 'master') {
                localStorage.setItem('leo_linked', true)
                location = APP_URL + '/go/' + globalService.name
            }

            if (!document.getElementById('leo-inline-styles')) {
                await injectStyles()
            }
            
            const app = viewApp()

            if (!app) {
                return
            }

            logInfo()

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

    startApp()
})()