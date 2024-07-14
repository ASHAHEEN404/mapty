'use strict';

/////////////////////////////////////////////

class Workout {
  date = new Date();
  id = (Date.now() + '').slice(-10);

  constructor(distance, duration, coords) {
    this.distance = distance;
    this.duration = duration;
    this.coords = coords;
  }

  _setDescription() {
    // prettier-ignore
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

    this.description = `${this.type[0].toUpperCase()}${this.type.slice(1)} on ${
      months[this.date.getMonth()]
    } ${this.date.getDate()}`;
  }
}

class Running extends Workout {
  type = 'running';
  constructor(distance, duration, coords, cadence, pace) {
    super(distance, duration, coords);
    this.cadence = cadence;
    this.calcPace();
    this._setDescription();
  }

  calcPace() {
    this.pace = this.distance / this.duration;
    return this.pace;
  }
}

class Cycling extends Workout {
  type = 'cycling';

  constructor(distance, duration, coords, elevationGain, speed) {
    super(distance, duration, coords);
    this.elevationGain = elevationGain;
    this.calcSpeend();
    this._setDescription();
  }

  calcSpeend() {
    this.speed = this.distance / (this.duration / 60);
    return this.speed;
  }
}

// const Workout1 = new Running(15, 10, [31, 30], 15, 54);
// const Workout2 = new Cycling(15, 10, [31, 30], 15, 54);
// console.log(Workout1);
// console.log(Workout2);

const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');

class App {
  workouts = [];
  #map;
  #mapZoomLevel = 13;
  #mapEvent;
  constructor() {
    // Get Map position
    this._getPosition();

    // Toggle The Input Type
    inputType.addEventListener('change', this._toggleInputData.bind(this));

    // Submit A New Workout
    form.addEventListener('submit', this._newWorkout.bind(this));
    containerWorkouts.addEventListener('click', this._moveToPopUp.bind(this));

    // Get data from local storge
    this._getLocalStroge();
  }

  _getPosition() {
    navigator.geolocation.getCurrentPosition(
      this._loadMap.bind(this),
      function () {
        alert('Not Correct Input');
      }
    );
  }

  _loadMap(position) {
    // Get latitude and longitude from The geolocation API
    const { latitude } = position.coords;
    const { longitude } = position.coords;
    const coords = [latitude, longitude];
    this.#map = L.map('map').setView(coords, this.#mapZoomLevel);

    // Test
    // console.log(latitude, longitude);

    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#map);

    this.#map.on('click', this._showForm.bind(this));

    this.workouts.forEach(work => this._displayMarker(work));
  }

  _showForm(mapE) {
    this.#mapEvent = mapE;
    console.log(mapE);

    form.classList.remove('hidden');
    inputDistance.focus();
  }

  _toggleInputData() {
    inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
    inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
  }

  _newWorkout(e) {
    e.preventDefault(); // Values
    let type = inputType.value;
    let distance = +inputDistance.value;
    let duration = +inputDuration.value;
    let workout;
    const { lat, lng } = this.#mapEvent.latlng;
    console.log(lat, lng);

    // Validate Data
    const allNumbers = (...inputs) => inputs.every(inp => Number.isFinite(inp));
    const allPostive = (...inputs) => inputs.every(inp => inp > 0);

    // IF Workout is Running
    if (type === 'running') {
      const cadence = +inputCadence.value;
      if (
        !allNumbers(distance, duration, cadence) ||
        !allPostive(distance, duration, cadence)
      )
        return alert('worng Input Data');

      workout = new Running(distance, duration, [lat, lng], cadence);
    }
    // IF Workout is Cycling
    if (type === 'cycling') {
      const elevationGain = +inputElevation.value;
      if (
        !allNumbers(distance, duration, elevationGain) ||
        !allPostive(distance, duration, elevationGain)
      )
        return alert('worng Input Data');
      workout = new Cycling(distance, duration, [lat, lng], elevationGain);
    }
    // Push The Workout to The Workout Array
    this.workouts.push(workout);

    // Render Workout
    this._renderWorkout(workout);

    // Render Workout Marker
    this._displayMarker(workout);

    // Hide Form
    this._hideForm();

    // Save to local storge
    this._setLocalStorge();
  }

  _displayMarker(workout) {
    L.marker(workout.coords)
      .addTo(this.#map)
      .bindPopup(
        L.popup({
          maxWidth: 250,
          maxHeight: 150,
          autoClose: false,
          closeOnClick: false,
          className: `${workout.type}-popup`,
        })
      )
      .openPopup()
      .setPopupContent(`${workout.description}`);
  }

  _hideForm() {
    inputDistance.value =
      inputDuration.value =
      inputCadence.value =
      inputElevation.value =
        '';

    form.style.display = 'none';
    form.classList.add('hidden');
    setTimeout(() => (form.style.display = 'grid'), 1000);
  }

  _renderWorkout(workout) {
    let html = `
    <li class="workout workout--${workout.type}" data-id="${workout.id}">
    <h2 class="workout__title">${workout.description}</h2>
    <div class="workout__details">
      <span class="workout__icon">${
        workout.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'
      }</span>
      <span class="workout__value">${workout.distance}</span>
      <span class="workout__unit">km</span>
    </div>
    <div class="workout__details">
      <span class="workout__icon">⏱</span>
      <span class="workout__value">${workout.duration}</span>
      <span class="workout__unit">min</span>
    </div>
    `;

    if (workout.type == 'running') {
      html += `<div class="workout__details">
      <span class="workout__icon">⚡️</span>
      <span class="workout__value">${workout.pace.toFixed(1)}</span>
      <span class="workout__unit">min/km</span>
    </div>
    <div class="workout__details">
      <span class="workout__icon">🦶🏼</span>
      <span class="workout__value">${workout.cadence}</span>
      <span class="workout__unit">spm</span>
    </div>
  </li>`;
    }

    if (workout.type == 'cycling') {
      html += `<div class="workout__details">
      <span class="workout__icon">⚡️</span>
      <span class="workout__value">${workout.speed.toFixed(1)}</span>
      <span class="workout__unit">km/h</span>
    </div>
    <div class="workout__details">
      <span class="workout__icon">⛰</span>
      <span class="workout__value">${workout.elevationGain}</span>
      <span class="workout__unit">m</span>
    </div>
  </li>`;
    }

    form.insertAdjacentHTML('afterend', html);
  }

  _moveToPopUp(e) {
    if (!this.#map) return;
    const workoutEl = e.target.closest('.workout');
    if (!workoutEl) return;

    const workout = this.workouts.find(work => {
      return (work.id = workoutEl.dataset.id);
    });

    this.#map.setView(workout.coords, this.#mapZoomLevel, {
      animate: true,
      pan: {
        duration: 1,
      },
    });
  }

  _setLocalStorge() {
    // =================> 'KeyName', From This Array
    localStorage.setItem('workouts', JSON.stringify(this.workouts));
  }

  _getLocalStroge() {
    const data = JSON.parse(localStorage.getItem('workouts'));

    if (!data) return;

    this.workouts = data;

    this.workouts.forEach(work => {
      this._renderWorkout(work);
    });
  }
}
const app = new App();
