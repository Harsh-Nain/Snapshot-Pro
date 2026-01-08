const notf = document.querySelector(".hoP")
const notif = document.querySelectorAll("#notif")
const a = document.querySelectorAll(".a")
const an = document.querySelectorAll("a")
const buttonBar = document.querySelector(".buttonBar")
const hoP = document.querySelector(".hoP")

notif.forEach(nof => {
    nof.addEventListener('click', () => {
        console.log('ok');
        let i = nof.querySelector('i')
        if (window.innerWidth > 500) {
            if (notf.classList.contains('hidden')) {
                nof.classList.add('active')
                notf.classList.remove('hidden')
                hoP.style.opacity = '0'
                setTimeout(() => {
                    buttonBar.querySelectorAll('span').forEach(span => {
                        span.style.width = '0'
                    })
                    console.log('ko');
                    hoP.style.width = '70vh'
                    hoP.style.opacity = '1'
                }, 400);
                i.classList.replace('fa-regular', 'fa-solid')
            } else {
                console.log('eks');
                hoP.style.width = '0'
                setTimeout(() => {
                    buttonBar.querySelectorAll('span').forEach(span => {
                        span.style.width = 'fit-content'
                    })
                }, 500);
                i.classList.replace('fa-solid', 'fa-regular')
                setTimeout(() => {
                    hoP.style.opacity = '0'
                    nof.classList.remove('active')
                    notf.classList.add('hidden')
                }, 700);
            }
        } else {
            if (notf.classList.contains('hidden')) {
                hoP.style.width = '100%'
                nof.classList.add('active')
                notf.classList.remove('hidden')
                i.classList.replace('fa-regular', 'fa-solid')
            } else {
                i.classList.replace('fa-solid', 'fa-regular')
                nof.classList.remove('active')
                notf.classList.add('hidden')
            }
        }
    })
});

a.forEach(e => {
    e.addEventListener('click', () => {
        load.classList.remove('invisible')
        stop()
    })
});

an.forEach(e => {
    e.addEventListener('click', () => {
        load.classList.remove('invisible')
    })
});

function stop() {
    setTimeout(() => {
        load.classList.add('invisible')
    }, 2000);
}