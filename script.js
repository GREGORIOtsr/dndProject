/* Fetch links */
// Classes --> "https://api.open5e.com/v1/classes/"
// Races --> "https://api.open5e.com/v1/races/"
// Backgrounds --> "https://api.open5e.com/v1/backgrounds/"
// Feats --> "https://api.open5e.com/v1/feats/"
// Weapons --> "https://api.open5e.com/v1/weapons/"
// Armor --> "https://api.open5e.com/v1/armor/"
// Spells --> "https://api.open5e.com/v1/spells/"
// Spell list --> "https://api.open5e.com/v1/spelllist/?format=api"

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

let slideIndex = 1;

// Functions ///////////////////////////////////////////////////////////////

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

// Change page if no user logged in
function noUser() {
  const signInButton = document.getElementById("signIn");
  const signUpButton = document.getElementById("signUp");
  signInButton.innerHTML = "Sign In";
  signInButton.addEventListener("click", googleSign);
  signUpButton.addEventListener("click", googleSign);
}

// Change page if user logged
function userLogged() {
  const signInButton = document.getElementById("signIn");
  signInButton.innerHTML = "Sign Out";
  signInButton.addEventListener("click", signUserOut);
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

// Favorite character


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

// Script to load on character.html
if (window.location.pathname === "/pages/character.html") {
  let arrPic = [];
  let arrStats = [];
  getPics(arrPic);
  getStats(arrStats);
  const start = document.getElementById('start');
  const form = document.getElementById('charForm');
  const charCreate = document.getElementById('charCreate');
  start.addEventListener('click', async () => {
    start.style = 'display:none'
    charCreate.classList.toggle('hide')
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
    window.location.pathname = '/index.html'
  })
}

//Observe the user's state
auth.onAuthStateChanged(async (user) => {
  if (user) {
    currentUser = doc(db, 'users', user.email);
    userLogged();
    // Script to load on index.html
    if (window.location.pathname === "/index.html") {
      const profile = document.getElementById('profDiv');
      const homeNav = document.getElementById('homeNav');
      const home = document.getElementById('home');
      home.style = 'display:none';
      profile.classList.toggle('hide');
      homeNav.innerHTML = 'Profile'
      let username;
      let characters;
      const favChar = document.getElementById('favChar');
      const listInfo = document.getElementById('listInfo');
      await getDoc(currentUser).then(query => {
        username = query.data().name; 
        characters = query.data().characters;
      })
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
                          <h2>Hit points: ${mainChar.stats.hp}</h2>
                          <span>Set as favorite</span>
                          <button><img src="./assets/fav.png"></button>
                          <div id="statsDiv">
                          <canvas id="statsChart"></canvas>
                          </div>
                          </div>`
      createChart(mainChar.stats);
      characters = characters.sort((a, b) => (a.name > b.name) ? 1 : ((b.name > a.name) ? -1 : 0))
      for (let char of characters) {
        listInfo.innerHTML += `<tr>
                              <td>${char.name}</td>
                              <td>${char.class.name}</td>
                              <td>${char.race}</td>
                              <td>${char.date}</td>
                              </tr>`
      }
    }
    if (window.location.pathname === "/pages/character.html") {
      const start = document.getElementById('start');
      start.classList.toggle('hide')
      const sect = document.getElementById('noUserChar');
      sect.style = 'display:none';
    }
    console.log("Logged user");
  } else {
    currentUser = null;
    noUser();
    if (window.location.pathname === "/index.html") {
      const homeNav = document.getElementById('homeNav');
      homeNav.innerHTML = 'Home'
      const homeDiv = document.getElementById('homeDiv');
      homeDiv.classList.toggle('hide');
    }
    if (window.location.pathname === "/pages/character.html") {
      const noUserChar = document.getElementById('noUserChar');
      noUserChar.classList.toggle('hide')
    }
    console.log("No logged user");
  }
});

/* let obj = {
  name: '',
  class: {
    name: '',
    picture: 'url'
  },
  race: '',
  background: '',
  weapons: [{
    name: '',
    icon: 'url'
  }],
  armor: {
    name: '',
    icon: 'url'
  },
  spells: [],
  stats: {
    hp: 0, // Hit points
    str: 0, // Strenght
    con: 0, // Constitution
    dex: 0, // Dexterity
    int: 0, // Intelligence
    wis: 0, // Wisdom
    cha: 0 // Charisma
  },
  date: ''
} */

/* `<img src="${class.picture}" alt="${class.name} image" />
<div>
  <h2>${name}</h2>
  <h4>Set as favorite</h4>
  <h4>Class: ${class.name}</h4>
  <h4>Race: ${race}</h4>
  <h4>Background: ${background}</h4>
  <h4>Feats:</h4>
  -- List
  <h4>Weapons</h4>
  -- Icons with name below
  <h4>Armor:</h4>
  -- Icon with name below
  <h4>Spells:</h4>
  -- List
  <h4>Stats:</h4>
  -- Chart
</div>` */

/* `<tr>
  <td>${name}</td>
  <td>${class.name}</td>
  <td>${race}<td>
  <td>${date}</td>
</tr>` */

{
  /* <span class="dot" onclick="currentSlide(i)"></span> */
}
