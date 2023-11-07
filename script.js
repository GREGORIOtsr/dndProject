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
      // The email of the user's account used.
      const email = error.customData.email;
    });
}

// Sign Out
function signUserOut() {
  signOut(auth)
    .then(() => {
      // alert("Sign-out successful");
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
  if (window.location.pathname === "/index.html") {
    const home = document.getElementById('home');
    home.classList.toggle('hide');
  }
  if (window.location.pathname === "/pages/character.html") {
    const noUserChar = document.getElementById('noUserChar');
    noUserChar.classList.toggle('hide')
  }
}

// Change page if user logged
function userLogged() {
  const signInButton = document.getElementById("signIn");
  signInButton.innerHTML = "Sign Out";
  signInButton.addEventListener("click", signUserOut);
  if (window.location.pathname === "/index.html") {
    const profile = document.getElementById('profile');
    profile.classList.toggle('hide');
  }
  if (window.location.pathname === "/pages/character.html") {
    const start = document.getElementById('start');
    start.classList.toggle('hide')
  }
}

// Get classes urls from cloud storage
const getPics = async function(arr) {
  let classPics = [];
  let classNames = [];
  await listAll(classPicsRef).then((res) => {
    res.items.forEach(async (item) => {
      let pic = await getDownloadURL(ref(classPicsRef, item.name));
      classPics.push(pic);
      classNames.push(item.name.replace(".png", "").toUpperCase());
    });
    arr.push(classPics, classNames);
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
    let array = [query.data().characters];
    for (let i = 0; i < array.length; i++) {
      array[i].favorite = false;
    }
    await updateDoc(currentUser, {
      characters: array
    });
  })
}

// Photo slider functions
function showSlide(n) {
  let i;
  let slides = document.getElementsByClassName("slides");
  let dots = document.getElementsByClassName("dot");
  if (n > slides.length) {
    slideIndex = 1;
  }
  if (n < 1) {
    slideIndex = slides.length;
  }
  for (i = 0; i < slides.length; i++) {
    slides[i].style.display = "none";
  }
  for (i = 0; i < dots.length; i++) {
    dots[i].className = dots[i].className.replace(" active", "");
  }
  slides[slideIndex - 1].style.display = "block";
  dots[slideIndex - 1].className += " active";
}

function changeSlide(n) {
  showSlide((slideIndex += n));
}

function toSlide(n) {
  showSlide((slideIndex = n));
}

// Insert class selector on html
function setClassSelec(array1, array2) {
  let slidePics = document.getElementById("slidePics");
  let dotSelector = document.getElementById("dotSelector");
  for (let i = 0; i < array1[0].length; i++) {
    let obj = array2.find(arr => arr.name == array1[1][i])
    slidePics.innerHTML += `<div class="slides fade">
                            <label for="charClass"><img src="${array1[0][i]}" class="classSelec" alt="${array1[1][i]} portrait"></label>
                            <input type="radio" name="charClass" style="display:none">
                            <div>${array1[1][i]}</div>
                            <h2>Base Stats</h2>
                            <ul class="classStats">
                            <li>Hit points: ${obj.stats.hp}</li>
                            <li>Strenght: ${obj.stats.str}</li>
                            <li>Constitution: ${obj.stats.con}</li>
                            <li>Dextery: ${obj.stats.dex}</li>
                            <li>Intelligence: ${obj.stats.int}</li>
                            <li>Wisdom: ${obj.stats.wis}</li>
                            <li>Charisma: ${obj.stats.cha}</li>
                            </ul>
                            </div>`;
    dotSelector.innerHTML += `<span class="dot" onclick="toSlide(${i + 1})"></span>`;
  }
  slidePics.innerHTML += `<a id="prev" onclick="changeSlide(-1)">&#10094;</a>
                          <a id="next" onclick="changeSlide(1)">&#10095;</a>`
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

// Script to load on index.html
if (window.location.pathname === "/index.html") {
  let user;
  let characters;
  const profile = document.getElementById('profile');
  await getDoc(currentUser).then(query => {
    let username;
    if (query.data().username != '') {
      user = query.data().username;
    } else {
      user = query.data().name;
    }
    characters = query.data().characters;
  })
  
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
    start.classList.toggle('hide')
    charCreate.classList.toggle('hide')
    setClassSelec(arrPic, arrStats);
    showSlide(slideIndex);
    setRaceAndBackSelec();  
  });
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const charName = event.target.charName.value;
    const charClass = event.target.charClass.value;
    const charRace = event.target.charRace.value;
    const charBack = event.target.charBack.value;
    const fav = false;
    if (event.target.favorite.checked) {
      fav = true;
      unFav();
    }
    const stats = await getDoc(doc(db, 'baseStats', 'BARD')).then(query => {
      return query.data();
    })
    const charHP = Number(stats.hp.slice(0, 2));
    await updateDoc(currentUser, {
      characters: arrayUnion({
        name: charName,
        class: {
          name: charClass, 
          picture: await getDownloadURL(ref(classPicsRef, `bard.png`)) //${charClass.toLowerCase()}
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
  })
}

//Observe the user's state
auth.onAuthStateChanged(async (user) => {
  if (user) {
    currentUser = doc(db, 'users', user.email);
    userLogged();
    console.log("Logged user");
  } else {
    currentUser = null;
    noUser();
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
