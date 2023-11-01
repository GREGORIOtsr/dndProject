/* Fetch links */
// Classes --> "https://api.open5e.com/v1/classes/"
// Races --> "https://api.open5e.com/v1/races/"
// Backgrounds --> "https://api.open5e.com/v1/backgrounds/"
// Feats --> "https://api.open5e.com/v1/feats/"
// Weapons --> "https://api.open5e.com/v1/weapons/"
// Armor --> "https://api.open5e.com/v1/armor/"
// Spells --> "https://api.open5e.com/v1/spells/"
// Spell list --> "https://api.open5e.com/v1/spelllist/?format=api"

// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.6/firebase-app.js";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
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
  query,
  where,
} from "https://www.gstatic.com/firebasejs/9.6.6/firebase-firestore.js";
import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL,
} from "https://www.gstatic.com/firebasejs/9.6.6/firebase-storage.js";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
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
const usersRef = collection(db, 'users');
//Initialize cloudstore
const storage = getStorage();

//Observe the user's state
let userCheck = false;
auth.onAuthStateChanged((user) => {
  if (user) {
    userCheck = true;
    console.log("Logged user");
    console.log(user);
  } else {
    userCheck = false;
    console.log("No logged user");
  }
});

// Functions ///////////////////////////////////////////////////////////////

// Sign In with Google
async function googleSign() {
  signInWithPopup(auth, provider)
    .then((result) => {
      const user = result.user;
      setDoc(doc(usersRef, user.email), {
        name: user.displayName,
        email: user.email,
        username: '',
        profilePicture: '',
        characters: []})
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

function setHome() {
  const signInButton = document.getElementById("signIn");
  const signUpButton = document.getElementById('signUp');
  signInButton.innerHTML = "Sign In";
  signInButton.addEventListener("click", googleSign);
  signUpButton.addEventListener('click', googleSign);
}

function setProfile() {
  const signInButton = document.getElementById("signIn");
  const profileContent = 
  signInButton.innerHTML = "Sign Out";
  signInButton.addEventListener("click", signUserOut);
}






/* let obj = {
  name: '',
  class: {
    name: '',
    picture: 'url'
  },
  race: '',
  background: '',
  feats: [],
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