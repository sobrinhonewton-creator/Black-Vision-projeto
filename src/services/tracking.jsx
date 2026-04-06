import { getFirestore, doc, setDoc, getDoc } from "firebase/firestore";
import app from "./firebase";

const db = getFirestore(app);
const docRef = doc(db, "analytics", "global");

const defaultData = {
  pageViews: 0,
  cardClicks: 0,
  whatsappClicks: 0
};

export const trackPageView = async () => {
  try {
    const snap = await getDoc(docRef);
    const data = snap.exists() ? snap.data() : defaultData;

    data.pageViews++;

    await setDoc(docRef, data);
  } catch (e) {
    console.error("Erro pageView:", e);
  }
};

export const trackCardClick = async () => {
  try {
    const snap = await getDoc(docRef);
    const data = snap.exists() ? snap.data() : defaultData;

    data.cardClicks++;

    await setDoc(docRef, data);
  } catch (e) {
    console.error("Erro cardClick:", e);
  }
};

export const getStats = async () => {
  try {
    const snap = await getDoc(docRef);
    return snap.exists() ? snap.data() : defaultData;
  } catch (e) {
    console.error("Erro getStats:", e);
    return defaultData;
  }
};