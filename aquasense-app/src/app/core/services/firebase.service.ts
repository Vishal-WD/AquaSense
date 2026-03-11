import { Injectable } from '@angular/core';
import { initializeApp, FirebaseApp } from 'firebase/app';
import {
  getAuth,
  Auth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User
} from 'firebase/auth';
import {
  getFirestore,
  Firestore,
  doc,
  setDoc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot
} from 'firebase/firestore';
import {
  getDatabase,
  Database,
  ref,
  onValue,
  query as rtdbQuery,
  orderByKey,
  limitToLast,
  off
} from 'firebase/database';
import { environment } from '../../../environments/environment';
import { BehaviorSubject, Observable } from 'rxjs';

export interface AppUser {
  uid: string;
  email: string;
  name: string;
  role: 'citizen' | 'admin' | 'ngo';
  phone?: string;
  city: string;
  state: string;
  country?: string;
  assigned_device_id?: string;
  created_at: number;
}

export interface SensorReading {
  ph: number;
  ntu: number;
  temp: number;
  light: number;
  server_time: number;
}

export interface PublicStation {
  id?: string;
  name: string;
  type: string;
  lat: number;
  lng: number;
  city: string;
  state: string;
  country: string;
  status: 'safe' | 'warning' | 'critical' | 'offline' | 'maintenance';
  assigned_device_id?: string;
  created_at: number;
  updated_at: number;
}

export interface ManualAlert {
  id?: string;
  message: string;
  city: string;
  state: string;
  severity: 'info' | 'warning' | 'critical';
  timestamp: number;
  authority: 'Gov' | 'NGO' | 'System';
  author_name: string;
  type: 'manual' | 'automatic';
}

@Injectable({ providedIn: 'root' })
export class FirebaseService {
  private app: FirebaseApp;
  private auth: Auth;
  private firestore: Firestore;
  private rtdb: Database;

  private currentUserSubject = new BehaviorSubject<AppUser | null>(null);
  private firebaseUserSubject = new BehaviorSubject<User | null>(null);
  private authLoadedSubject = new BehaviorSubject<boolean>(false);

  currentUser$ = this.currentUserSubject.asObservable();
  firebaseUser$ = this.firebaseUserSubject.asObservable();
  authLoaded$ = this.authLoadedSubject.asObservable();

  constructor() {
    this.app = initializeApp(environment.firebase);
    this.auth = getAuth(this.app);
    this.firestore = getFirestore(this.app);
    this.rtdb = getDatabase(this.app);

    onAuthStateChanged(this.auth, async (user) => {
      this.firebaseUserSubject.next(user);
      if (user) {
        const appUser = await this.getUserProfile(user.uid);
        this.currentUserSubject.next(appUser);
      } else {
        this.currentUserSubject.next(null);
      }
      this.authLoadedSubject.next(true);
    });
  }

  // ──────── AUTH ────────
  private detectRole(email: string): 'admin' | 'ngo' | 'citizen' {
    if (email.endsWith('@gov.in')) return 'admin';
    if (environment.ngoEmails.includes(email.toLowerCase())) return 'ngo';
    return 'citizen';
  }

  async register(name: string, email: string, password: string, city: string, state: string): Promise<AppUser> {
    const cred = await createUserWithEmailAndPassword(this.auth, email, password);
    const role = this.detectRole(email);
    const appUser: AppUser = {
      uid: cred.user.uid,
      name,
      email,
      role,
      city,
      state,
      country: '', // Default to empty string if not provided in register params
      assigned_device_id: '', // Default to empty string
      created_at: Date.now()
    };
    await setDoc(doc(this.firestore, 'users', cred.user.uid), appUser);
    this.currentUserSubject.next(appUser);
    return appUser;
  }

  async login(email: string, password: string): Promise<AppUser> {
    const cred = await signInWithEmailAndPassword(this.auth, email, password);
    const appUser = await this.getUserProfile(cred.user.uid);
    this.currentUserSubject.next(appUser);
    return appUser!;
  }

  async logout(): Promise<void> {
    await signOut(this.auth);
    this.currentUserSubject.next(null);
  }

  // ──────── USER PROFILES ────────
  async getUserProfile(uid: string): Promise<AppUser | null> {
    const snap = await getDoc(doc(this.firestore, 'users', uid));
    return snap.exists() ? (snap.data() as AppUser) : null;
  }

  async updateUserProfile(uid: string, data: Partial<AppUser>): Promise<void> {
    await updateDoc(doc(this.firestore, 'users', uid), data as any);
    const current = this.currentUserSubject.value;
    if (current && current.uid === uid) {
      this.currentUserSubject.next({ ...current, ...data });
    }
  }

  async getUsersByCity(city: string): Promise<AppUser[]> {
    const q = query(collection(this.firestore, 'users'), where('city', '==', city));
    const snap = await getDocs(q);
    return snap.docs.map(d => d.data() as AppUser);
  }

  async getAllUsers(): Promise<AppUser[]> {
    const snap = await getDocs(collection(this.firestore, 'users'));
    return snap.docs.map(d => d.data() as AppUser);
  }

  // ──────── REALTIME SENSOR DATA ────────
  subscribeSensorData(deviceId: string, callback: (readings: SensorReading[]) => void): () => void {
    const dbRef = rtdbQuery(ref(this.rtdb, `WaterHistory/${deviceId}`), orderByKey(), limitToLast(100));
    const unsubscribe = onValue(dbRef, (snapshot) => {
      const data = snapshot.val();
      if (!data) {
        callback([]);
        return;
      }
      const readings: SensorReading[] = Object.values(data);
      readings.sort((a, b) => a.server_time - b.server_time);
      callback(readings);
    });
    return () => off(dbRef);
  }

  subscribeLatestReading(deviceId: string, callback: (reading: SensorReading | null) => void): () => void {
    const dbRef = rtdbQuery(ref(this.rtdb, `WaterHistory/${deviceId}`), orderByKey(), limitToLast(1));
    const unsubscribe = onValue(dbRef, (snapshot) => {
      const data = snapshot.val();
      if (!data) {
        callback(null);
        return;
      }
      const readings: SensorReading[] = Object.values(data);
      callback(readings[0] || null);
    });
    return () => off(dbRef);
  }

  // ──────── PUBLIC STATIONS ────────
  async getPublicStations(): Promise<PublicStation[]> {
    const snap = await getDocs(collection(this.firestore, 'public_stations'));
    return snap.docs.map(d => ({ id: d.id, ...d.data() }) as PublicStation);
  }

  async getStationsByCity(city: string): Promise<PublicStation[]> {
    const q = query(collection(this.firestore, 'public_stations'), where('city', '==', city));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }) as PublicStation);
  }

  async addStation(station: Omit<PublicStation, 'id'>): Promise<string> {
    const docRef = await addDoc(collection(this.firestore, 'public_stations'), station);
    return docRef.id;
  }

  async updateStation(id: string, data: Partial<PublicStation>): Promise<void> {
    await updateDoc(doc(this.firestore, 'public_stations', id), data as any);
  }

  async deleteStation(id: string): Promise<void> {
    await deleteDoc(doc(this.firestore, 'public_stations', id));
  }

  // ──────── ALERTS ────────
  async getAlerts(city?: string): Promise<ManualAlert[]> {
    let q;
    if (city) {
      q = query(collection(this.firestore, 'manual_alerts'), where('city', '==', city));
    } else {
      q = collection(this.firestore, 'manual_alerts');
    }
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }) as ManualAlert);
  }

  subscribeAlerts(city: string | null, callback: (alerts: ManualAlert[]) => void): () => void {
    let q;
    if (city) {
      q = query(collection(this.firestore, 'manual_alerts'), where('city', '==', city));
    } else {
      q = collection(this.firestore, 'manual_alerts');
    }
    const unsub = onSnapshot(q, (snap) => {
      const alerts = snap.docs.map(d => ({ id: d.id, ...d.data() }) as ManualAlert);
      alerts.sort((a, b) => b.timestamp - a.timestamp);
      callback(alerts);
    });
    return unsub;
  }

  async issueAlert(alert: Omit<ManualAlert, 'id'>): Promise<string> {
    const docRef = await addDoc(collection(this.firestore, 'manual_alerts'), alert);
    return docRef.id;
  }

  // ──────── UID REGISTRATION (Admin) ────────
  async registerDeviceUID(citizenUid: string, deviceId: string): Promise<void> {
    await updateDoc(doc(this.firestore, 'users', citizenUid), { assigned_device_id: deviceId });
  }

  getCurrentUser(): AppUser | null {
    return this.currentUserSubject.value;
  }

  isAuthenticated(): boolean {
    return !!this.firebaseUserSubject.value;
  }
}
