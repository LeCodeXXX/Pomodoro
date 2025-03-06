import { timerFormats } from './timerData.js';
import { generate } from './timerFunction.js';

//I removed the git practice code from here

let timerFormatingHTML = '';

timerFormats.forEach((timeFormat) =>{
    timerFormatingHTML += `
       <div class="indivitual-pomodoro-container selector-time" data-timer-name = "${timeFormat.name}">
            <div class="show-container-visuals">
                

            </div>
            <div class="option-name">
                <span>${timeFormat.name}</span>
            </div>
        </div>`;

});

document.querySelector('.js-timer-option-container').innerHTML = timerFormatingHTML;

console.log(timerFormatingHTML);

let timerToPick;

document.querySelectorAll('.selector-time')
    .forEach((timers) =>{
        timers.addEventListener('click', () =>{
            console.log('this was clicked');

            document.querySelectorAll('.selector-time')
                    .forEach((elem) => {
                        elem.classList.remove('active');
            });

            const timerName = timers.dataset.timerName;
            
            timerFormats.forEach((times) => {
                if (times.name === timerName)
                    timerToPick = times.id;
            });

            if (timers.classList.contains("active"))
                timers.classList.remove("active");
            else
                timers.classList.add("active");
        });
});

document.querySelector('.start-btn').addEventListener('click',() =>{generate(timerToPick);});



