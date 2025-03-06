import { timerFormats } from './timerData.js';


export function generate(paramTime){
    let matchingTime;

    timerFormats.forEach((time) => {
        if (time.id === paramTime)
            matchingTime = time;
    });

    const html = `
        <h1>${matchingTime.name}</h1>
        <div class="study-and-break">
            <div class="timer study-part active">
                <p>Study</p>
                <div class="count-down work">
                    <h1 id="w_minutes">${matchingTime.workMinutes}</h1><h1>:</h1><h1 id="w_seconds">00</h1>
                </div>
            </div>
            <div class="timer break-part">
                <p>Break</p>
                <div class="count-down break">
                    <h1 id="b_minutes">${matchingTime.breakMinutes}</h1><h1>:</h1><h1 id="b_seconds">00</h1>
                </div>
            </div>
         </div>`;

    document.querySelector('.timers-container').innerHTML = html;
}


