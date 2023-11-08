//#region Fetch links
// Classes --> "https://api.open5e.com/v1/classes/"
// Races --> "https://api.open5e.com/v1/races/"
// Backgrounds --> "https://api.open5e.com/v1/backgrounds/"
// Feats --> "https://api.open5e.com/v1/feats/"
// Weapons --> "https://api.open5e.com/v1/weapons/"
// Armor --> "https://api.open5e.com/v1/armor/"
// Spells --> "https://api.open5e.com/v1/spells/"
// Spell list --> "https://api.open5e.com/v1/spelllist/?format=api"
//#endregion

//#region FIRESTORE imports and init
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.6/firebase-app.js";
import {
  getAuth,
  signOut,
  signInWithPopup,
  GoogleAuthProvider,
} from "https://www.gstatic.com/firebasejs/9.6.6/firebase-auth.js";
import {
  getFirestore,
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  arrayUnion, 
  arrayRemove,
  Timestamp,
  query,
  where,
} from "https://www.gstatic.com/firebasejs/9.6.6/firebase-firestore.js";
import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL,
  listAll,
} from "https://www.gstatic.com/firebasejs/9.6.6/firebase-storage.js";

const firebaseConfig = {
  apiKey: "AIzaSyCVZEhFGuHbUjH5vzzRTBs7v4Aj2AGfDEM",
  authDomain: "dndproject-9f769.firebaseapp.com",
  projectId: "dndproject-9f769",
  storageBucket: "dndproject-9f769.appspot.com",
  messagingSenderId: "848227809661",
  appId: "1:848227809661:web:353bcca59d6794eda0f414",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
//Initialize Auth
const auth = getAuth();
auth.useDeviceLanguage();
const user = auth.currentUser;
const provider = new GoogleAuthProvider();
//Initialize DDBB
const db = getFirestore(app);
const usersRef = collection(db, "users");
const baseStatsRef = collection(db, "baseStats")
let currentUser;
//Initialize cloudstore
const storage = getStorage();
const pfpRef = ref(storage, "profilePictures");
const classPicsRef = ref(storage, "classes");
//#endregion

//#region Functions
// Sign In with Google
async function googleSign() {
  await signInWithPopup(auth, provider)
    .then(async (result) => {
      let userRef = await getDoc(doc(db, "users", user.email));
      if (userRef._document === null) {
        const user = result.user;
        let userPfp;
        await uploadBytes(
          pfpRef,
          `${user.displayName
            .replace(/\s/g, "_")
            .toLowerCase()}_profile_picture`
        ).then(async (res) => {
          userPfp = await getDownloadURL(
            `${user.displayName
              .replace(/\s/g, "_")
              .toLowerCase()}_profile_picture`
          );
        });
        setDoc(doc(usersRef, user.email), {
          name: user.displayName,
          email: user.email,
          username: "",
          profilePicture: userPfp,
          characters: [],
        });
      }
    })
    .catch((error) => {
      // Handle Errors here.
      const errorCode = error.code;
      const errorMessage = error.message;
    });
}

// Sign Out
function signUserOut() {
  signOut(auth)
    .then(() => {
      window.location.reload();
    })
    .catch((error) => {
      const errorCode = error.code;
      const errorMessage = error.message;
    });
}

// Check current page
function checkPage(route, title) {
  return (window.location.pathname === route || document.title === title);
}

// Change page if no user logged in
function noUser() {
  const signInButton = document.getElementById("signIn");
  const signUpButton = document.getElementById("signUp");
  signInButton.innerHTML = "Sign In";
  signInButton.addEventListener("click", googleSign);
  signUpButton.addEventListener("click", googleSign);
  
  if (checkPage('./index.html', "Home")) {
    const homeDiv = document.getElementById('homeDiv');
    homeDiv.classList.remove('hide')
    const profile = document.getElementById('profDiv');
    profile.classList.add('hide')
  }

  if (checkPage('./pages/character.html', "Character creation")) {
    const sect = document.getElementById('noUserChar');
    sect.classList.remove('hide')
    const start = document.getElementById('start');
    start.style = 'display:none'
  }
}

// Change page if user logged
function userLogged() {
  const signInButton = document.getElementById("signIn");
  const homeNav = document.getElementById('homeNav');
  signInButton.innerHTML = "Sign Out";
  signInButton.addEventListener("click", signUserOut);
  homeNav.innerHTML = 'Profile'
  
  if (checkPage('./index.html', "Home")) {
    const homeDiv = document.getElementById('homeDiv');
    homeDiv.classList.add('hide')
    const profile = document.getElementById('profDiv');
    profile.classList.remove('hide')
  }

  if (checkPage('./pages/character.html', "Character creation")) {
    const sect = document.getElementById('noUserChar');
    sect.classList.add('hide')
    const start = document.getElementById('start');
    start.style = 'display:'
  }
}

// Get classes urls from cloud storage
const getPics = async function(arr) {
  await listAll(classPicsRef).then((res) => {
    res.items.forEach(async (item) => {
      let pic = await getDownloadURL(ref(classPicsRef, item.name));
      arr.push({name: item.name.replace(".png", "").toUpperCase(), src: pic});
    });
  });
}

// Get classes stats from firestore
const getStats = async function(arr) {
  await getDocs(baseStatsRef).then(querySnapshot => {
    querySnapshot.forEach(query => {
      arr.push({name: query.id, stats: query.data()})
    })
  })
}

// Favorite character
// WIP

// Set all characters as not favorite
async function unFav() {
  await getDoc(currentUser).then(async (query) => {
    let array = query.data().characters;
    for (let i = 0; i < array.length; i++) {
      array[i].favorite = false;
    }
    await updateDoc(currentUser, {
      characters: array
    });
  })
}

// Show character
async function showChar(char) {
  let characters;
  const favChar = document.getElementById('favChar');
  await getDoc(currentUser).then(query => {
    characters = query.data().characters;
  })
  let c = characters.find(c => c.name == char);
  favChar.innerHTML = `<div id="imgAndName">
                          <h1>${c.name}</h1> 
                          <img src="${c.class.picture}" alt="${c.class.name} portrait">
                          </div>
                          <div id="charInfo">
                          <h2>Class: ${c.class.name}</h2>
                          <h2>Race: ${c.race}</h2>
                          <h2>Background: ${c.background}</h2>
                          <h2>Hit points: ${c.stats.hp}</h2>
                          <span>Set as favorite</span>
                          <button><img src="./assets/fav.png"></button>
                          <div id="statsDiv">
                          <canvas id="statsChart"></canvas>
                          </div>
                          </div>`
  createChart(c.stats);
}

// Insert class selector on html
async function setClassSelec(array1, array2) {
  let charClass = document.getElementById("charClass");
  let classPic = document.getElementById('classPic');
  let classStats = document.getElementById('classStats');
  array1 = array1.sort((a, b) => (a.name > b.name) ? 1 : ((b.name > a.name) ? -1 : 0));
  array2 = array2.sort((a, b) => (a.name > b.name) ? 1 : ((b.name > a.name) ? -1 : 0));
  for (let i = 0; i < array1.length; i++) {
    charClass.innerHTML += `<option value="${array1[i].name}">${array2[i].name}</option>`;
  }
  classPic.src = array1[0].src;
  classPic.alt = `${array1[0].name} portrait`;
  classStats.innerHTML = `<ul>
                          <li>Hit points: ${array2[0].stats.hp}</li>
                          <li>Strength: ${array2[0].stats.str}</li>
                          <li>Constitution: ${array2[0].stats.con}</li>
                          <li>Dexterity: ${array2[0].stats.dex}</li>
                          <li>Intelligence: ${array2[0].stats.int}</li>
                          <li>Wisdom: ${array2[0].stats.wis}</li>
                          <li>Charisma: ${array2[0].stats.cha}</li>
                          </ul>`
  charClass.addEventListener('change', event => {
    let pics = array1.find(pic => pic.name == event.target.value);
    let s = array2.find(stat => stat.name == event.target.value)
    classPic.src = pics.src;
    classPic.alt = `${pics.name} portrait`;
    classStats.innerHTML = `<ul>
                            <li>Hit points: ${s.stats.hp}</li>
                            <li>Strength: ${s.stats.str}</li>
                            <li>Constitution: ${s.stats.con}</li>
                            <li>Dexterity: ${s.stats.dex}</li>
                            <li>Intelligence: ${s.stats.int}</li>
                            <li>Wisdom: ${s.stats.wis}</li>
                            <li>Charisma: ${s.stats.cha}</li>
                            </ul>`
  })
}

// Insert select input for races and backgrounds
async function setRaceAndBackSelec() {
  let charRace = document.getElementById('charRace');
  let charBack = document.getElementById('charBack');
  let raceDesc = document.getElementById('raceDesc');
  let backDesc = document.getElementById('backDesc');
  let resRace = await fetch('https://api.open5e.com/v1/races/');
  let raceObj = await resRace.json();
  raceObj = raceObj.results.map(race => {
    return {name: race.name, trait: race.traits.replaceAll('**_', '<br><strong>').replaceAll('_**', '</strong>')};
  })
  let resBack = await fetch('https://api.open5e.com/v1/backgrounds/');
  let backObj = await resBack.json();
  backObj = backObj.results.map(race => {
    return {name: race.name, desc: race.desc};
  })
  for (let i = 0; i < raceObj.length; i++) {
    charRace.innerHTML += `<option value="${raceObj[i].name}">${raceObj[i].name}</option>`
  }
  for (let i = 0; i < backObj.length; i++) {
    charBack.innerHTML += `<option value="${backObj[i].name}">${backObj[i].name}</option>`
  }
  raceDesc.innerHTML = raceObj[0].trait;
  backDesc.innerHTML = backObj[0].desc;
  charRace.addEventListener('change', event => {
    let obj = raceObj.find(obj => obj.name == event.target.value);
    raceDesc.innerHTML = obj.trait;
  })
  charBack.addEventListener('change', event => {
    let obj = backObj.find(obj => obj.name == event.target.value);
    backDesc.innerHTML = obj.desc;
  })
}

// Create stats radar chart
function createChart(charStats) {
  const ctx = document.getElementById('statsChart');

  const data = {
    labels: [
      'Strength',
      'Constitution',
      'Dexterity',
      'Intelligence',
      'Wisdom',
      'Charisma'
    ],
    datasets: [{
      label: 'Stats',
      data: [charStats.str, charStats.con, charStats.dex, charStats.int, charStats.wis, charStats.cha],
      fill: true,
      backgroundColor: '#E9444520',
      borderColor: '#A34C50',
      pointBackgroundColor: '#4A2932',
      pointBorderColor: '#E94445',
      pointHoverBackgroundColor: '#CEC2AE',
      pointHoverBorderColor: '#264C5E'
    }]
  };

  const config = {
    type: 'radar',
    data: data,
    options: {
      elements: {
        line: {
          borderWidth: 3
        }
      },
      scales: {
        r: {
            angleLines: {
                display: false
            },
            suggestedMin: 0,
            suggestedMax: 10
        }
      }
    },
  };

  new Chart(ctx, config);
}

// Create table
function createTable(char) {
  for (let i = 0; i < char.length; i++) {
    let id;
    listInfo.innerHTML += `<tr>
                          <td><a id="${char[i].name}" class="changeChar">${char[i].name}</a></td>
                          <td>${char[i].class.name}</td>
                          <td>${char[i].race}</td>
                          <td>${char[i].date}</td>
                          </tr>`;
    id = document.getElementById(char[i].name);
    id.addEventListener('click', () => {
      showChar(char[i].name)
    });
  }
}

// Set profile page
async function setProfile() {
  let username;
  let characters;
  const favChar = document.getElementById('favChar');
  const listInfo = document.getElementById('listInfo');
  await getDoc(currentUser).then(query => {
    username = query.data().name; 
    characters = query.data().characters;
  }).then(res => {
    let mainChar = characters.find(char => char.favorite == true ? char : null);
    if (mainChar == null) {
      let num = Math.floor(Math.random()*characters.length);
      mainChar = characters[num];
    }
    favChar.innerHTML = `<div id="imgAndName">
                        <h1>Welcome<br>${username}</h1>
                        <h1>${mainChar.name}</h1>
                        <img src="${mainChar.class.picture}" alt="${mainChar.class.name} portrait">
                        </div>
                        <div id="charInfo">
                        <h2>Class: ${mainChar.class.name}</h2>
                        <h2>Race: ${mainChar.race}</h2>
                        <h2>Background: ${mainChar.background}</h2>
                        <h2>Hit points: ${mainChar.stats.hp}</h2>
                        <span>Set as favorite</span>
                        <button><img src="./assets/fav.png"></button>
                        <div id="statsDiv">
                        <canvas id="statsChart"></canvas>
                        </div>
                        </div>`
    createChart(mainChar.stats);
    let char = characters.sort((a, b) => (a.name > b.name) ? 1 : ((b.name > a.name) ? -1 : 0));
    createTable(char);
    tableSort();
  })
}

// Set character creation page
async function setCreate() {
  let arrPic = [];
  let arrStats = [];
  getPics(arrPic);
  getStats(arrStats);
  const start = document.getElementById('start');
  const form = document.getElementById('charForm');
  const charCreate = document.getElementById('charCreate');
  start.addEventListener('click', async () => {
    start.style = 'display:none'
    charCreate.classList.remove('hide')
    setClassSelec(arrPic, arrStats);
    setRaceAndBackSelec();  
  });
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const charName = event.target.charName.value;
    const charClass = event.target.charClass.value;
    const charRace = event.target.charRace.value;
    const charBack = event.target.charBack.value;
    let fav = false;
    if (event.target.favorite.checked) {
      fav = true;
      unFav();
    }
    const stats = await getDoc(doc(db, 'baseStats', charClass)).then(query => {
      return query.data();
    })
    const charHP = Number(stats.hp.slice(0, 2));
    await updateDoc(currentUser, {
      characters: arrayUnion({
        name: charName,
        class: {
          name: charClass, 
          picture: await getDownloadURL(ref(classPicsRef, `${charClass.toLowerCase()}.png`)) //${charClass.toLowerCase()}
        },
        race: charRace,
        background: charBack,
        stats: {
          hp: Math.round(charHP + (charHP * (stats.con / 10))), // Hit points
          str: stats.str, // Strenght
          con: stats.con, // Constitution
          dex: stats.dex, // Dexterity
          int: stats.int, // Intelligence
          wis: stats.wis, // Wisdom
          cha: stats.cha // Charisma
        },
        date: new Date().toLocaleString().split(',')[0],
        favorite: fav
      })
    })
    window.location = '/index.html';
    // window.location = 'https://gregoriotsr.github.io/dndProject/';
  })
}

// Add sort events to table
async function tableSort() {
  let nameNum, classNum, raceNum, dateNum = 0;
  const names = document.querySelector('thead tr th:nth-child(1)');
  const classes = document.querySelector('thead tr th:nth-child(2)');
  const races = document.querySelector('thead tr th:nth-child(3)');
  const dates = document.querySelector('thead tr th:nth-child(4)');
  const listInfo = document.getElementById('listInfo');
  let characters;
  await getDoc(currentUser).then(query => {
    characters = query.data().characters;
  }).then(res => {
    names.addEventListener('click', () => {
      if (nameNum == 0) {
        nameNum = 1;
        let char = characters.sort((a, b) => (a.name > b.name) ? 1 : ((b.name > a.name) ? -1 : 0));
        listInfo.innerHTML = '';
        createTable(char);
      } else {
        nameNum = 0;
        let char = characters.sort((a, b) => (a.name < b.name) ? 1 : ((b.name < a.name) ? -1 : 0));
        listInfo.innerHTML = '';
        createTable(char);
      }
    })
    classes.addEventListener('click', () => {
      if (classNum == 0) {
        classNum = 1;
        let char = characters.sort((a, b) => (a.class.name > b.class.name) ? 1 : ((b.class.name > a.class.name) ? -1 : 0));
        listInfo.innerHTML = '';
        createTable(char);
      } else {
        classNum = 0;
        let char = characters.sort((a, b) => (a.class.name < b.name) ? 1 : ((b.class.name < a.class.name) ? -1 : 0));
        listInfo.innerHTML = '';
        createTable(char);
      }
    })
    races.addEventListener('click', () => {
      if (raceNum == 0) {
        raceNum = 1;
        let char = characters.sort((a, b) => (a.race > b.race) ? 1 : ((b.race > a.race) ? -1 : 0));
        listInfo.innerHTML = '';
        createTable(char);
      } else {
        raceNum = 0;
        let char = characters.sort((a, b) => (a.race < b.race) ? 1 : ((b.race < a.race) ? -1 : 0));
        listInfo.innerHTML = '';
        createTable(char);
      }
    })
    dates.addEventListener('click', () => {
      if (dateNum == 0) {
        dateNum = 1;
        let char = characters.sort((a, b) => new Date(b.date) - new Date(a.date));
        listInfo.innerHTML = '';
        createTable(char);
      } else {
        dateNum = 0;
        let char = characters.sort((a, b) => new Date(a.date) - new Date(b.date));
        listInfo.innerHTML = '';
        createTable(char);
      }
    })
  })
}
//#endregion

// Nav button event
document.getElementById('navButton').addEventListener('click', () => {
  const navDiv = document.getElementById('navDiv');
  navDiv.classList.toggle('navSlideIn');
  navDiv.classList.toggle('hide');
});

//Observe the user's state
auth.onAuthStateChanged(async (user) => {
  if (user) {
    currentUser = doc(db, 'users', user.email);
    userLogged();
    // Script to load on index.html
    if (checkPage('./index.html', "Home")) {
      await setProfile();
    }
    if (checkPage('./pages/character.html', "Character creation")) {
      await setCreate();
    }
    console.log("Logged user");
  } else {
    currentUser = null;
    noUser();
    console.log("No logged user");
  }
});
