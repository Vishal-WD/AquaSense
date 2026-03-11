import { Injectable } from '@angular/core';
import { FirebaseService, PublicStation, SensorReading } from './firebase.service';
import { doc, getFirestore, writeBatch, collection, getDocs, deleteDoc } from 'firebase/firestore';
import { getDatabase, ref, set, remove } from 'firebase/database';

export interface ExternalWaterData {
  station_name: string;
  latitude: number;
  longitude: number;
  city: string;
  state: string;
  country: string;
  base_ph: number;
  base_ntu: number;
  base_temp: number;
  base_light: number;
}

@Injectable({ providedIn: 'root' })
export class SeederService {

// Define exact geographical coordinates for major cities/capitals to ensure they map on land
  private regions = {
    USA: [
      { state: 'Alabama', lat: 32.3182, lng: -86.9023 },
      { state: 'Alaska', lat: 58.3019, lng: -134.4197 },
      { state: 'Arizona', lat: 33.4484, lng: -112.0740 },
      { state: 'Arkansas', lat: 34.7465, lng: -92.2896 },
      { state: 'California', lat: 38.5816, lng: -121.4944 },
      { state: 'Colorado', lat: 39.7392, lng: -104.9903 },
      { state: 'Connecticut', lat: 41.7658, lng: -72.6734 },
      { state: 'Delaware', lat: 39.1582, lng: -75.5244 },
      { state: 'Florida', lat: 30.4383, lng: -84.2807 },
      { state: 'Georgia', lat: 33.7490, lng: -84.3880 },
      { state: 'Hawaii', lat: 21.3070, lng: -157.8584 },
      { state: 'Idaho', lat: 43.6150, lng: -116.2023 },
      { state: 'Illinois', lat: 39.7817, lng: -89.6501 },
      { state: 'Indiana', lat: 39.7684, lng: -86.1581 },
      { state: 'Iowa', lat: 41.5868, lng: -93.6250 },
      { state: 'Kansas', lat: 39.0473, lng: -95.6752 },
      { state: 'Kentucky', lat: 38.2009, lng: -84.8733 },
      { state: 'Louisiana', lat: 30.4515, lng: -91.1871 },
      { state: 'Maine', lat: 44.3106, lng: -69.7795 },
      { state: 'Maryland', lat: 38.9784, lng: -76.4922 },
      { state: 'Massachusetts', lat: 42.3601, lng: -71.0589 },
      { state: 'Michigan', lat: 42.7325, lng: -84.5555 },
      { state: 'Minnesota', lat: 44.9537, lng: -93.0900 },
      { state: 'Mississippi', lat: 32.2988, lng: -90.1848 },
      { state: 'Missouri', lat: 38.5739, lng: -92.1790 },
      { state: 'Montana', lat: 46.5891, lng: -112.0391 },
      { state: 'Nebraska', lat: 40.8069, lng: -96.6817 },
      { state: 'Nevada', lat: 39.1638, lng: -119.7674 },
      { state: 'New Hampshire', lat: 43.2081, lng: -71.5376 },
      { state: 'New Jersey', lat: 40.2171, lng: -74.7429 },
      { state: 'New Mexico', lat: 35.6870, lng: -105.9378 },
      { state: 'New York', lat: 42.6526, lng: -73.7562 },
      { state: 'North Carolina', lat: 35.7796, lng: -78.6382 },
      { state: 'North Dakota', lat: 46.8083, lng: -100.7837 },
      { state: 'Ohio', lat: 39.9612, lng: -82.9988 },
      { state: 'Oklahoma', lat: 35.4676, lng: -97.5164 },
      { state: 'Oregon', lat: 44.9429, lng: -123.0351 },
      { state: 'Pennsylvania', lat: 40.2698, lng: -76.8836 },
      { state: 'Rhode Island', lat: 41.8240, lng: -71.4128 },
      { state: 'South Carolina', lat: 34.0007, lng: -81.0348 },
      { state: 'South Dakota', lat: 44.3683, lng: -100.3510 },
      { state: 'Tennessee', lat: 36.1627, lng: -86.7816 },
      { state: 'Texas', lat: 30.2672, lng: -97.7431 },
      { state: 'Utah', lat: 40.7608, lng: -111.8910 },
      { state: 'Vermont', lat: 44.2601, lng: -72.5754 },
      { state: 'Virginia', lat: 37.5407, lng: -77.4360 },
      { state: 'Washington', lat: 47.0379, lng: -122.9007 },
      { state: 'West Virginia', lat: 38.3498, lng: -81.6326 },
      { state: 'Wisconsin', lat: 43.0731, lng: -89.4012 },
      { state: 'Wyoming', lat: 41.1400, lng: -104.8202 }
    ],
    India: [
      { state: 'Andhra Pradesh', lat: 16.5062, lng: 80.6480 },
      { state: 'Arunachal Pradesh', lat: 27.0844, lng: 93.6053 },
      { state: 'Assam', lat: 26.1420, lng: 91.7720 },
      { state: 'Bihar', lat: 25.5941, lng: 85.1376 },
      { state: 'Chhattisgarh', lat: 21.2514, lng: 81.6296 },
      { state: 'Goa', lat: 15.4909, lng: 73.8278 },
      { state: 'Gujarat', lat: 23.2156, lng: 72.6369 },
      { state: 'Haryana', lat: 30.7333, lng: 76.7794 },
      { state: 'Himachal Pradesh', lat: 31.1048, lng: 77.1734 },
      { state: 'Jharkhand', lat: 23.3441, lng: 85.3096 },
      { state: 'Karnataka', lat: 12.9716, lng: 77.5946 },
      { state: 'Kerala', lat: 8.5241, lng: 76.9366 },
      { state: 'Madhya Pradesh', lat: 23.2599, lng: 77.4126 },
      { state: 'Maharashtra', lat: 19.0760, lng: 72.8777 },
      { state: 'Manipur', lat: 24.8170, lng: 93.9368 },
      { state: 'Meghalaya', lat: 25.5788, lng: 91.8933 },
      { state: 'Mizoram', lat: 23.7271, lng: 92.7176 },
      { state: 'Nagaland', lat: 25.6751, lng: 94.1086 },
      { state: 'Odisha', lat: 20.2961, lng: 85.8245 },
      { state: 'Punjab', lat: 30.7333, lng: 76.7794 },
      { state: 'Rajasthan', lat: 26.9124, lng: 75.7873 },
      { state: 'Sikkim', lat: 27.3389, lng: 88.6065 },
      { state: 'Tamil Nadu', lat: 13.0827, lng: 80.2707 },
      { state: 'Telangana', lat: 17.3850, lng: 78.4867 },
      { state: 'Tripura', lat: 23.8315, lng: 91.2868 },
      { state: 'Uttar Pradesh', lat: 26.8467, lng: 80.9462 },
      { state: 'Uttarakhand', lat: 30.3165, lng: 78.0322 },
      { state: 'West Bengal', lat: 22.5726, lng: 88.3639 }
    ],
    UK: [
      { state: 'England', lat: 51.5074, lng: -0.1278 },
      { state: 'Scotland', lat: 55.9533, lng: -3.1883 },
      { state: 'Wales', lat: 51.4816, lng: -3.1791 },
      { state: 'Northern Ireland', lat: 54.5973, lng: -5.9301 }
    ],
    Canada: [
      { state: 'Alberta', lat: 53.5461, lng: -113.4938 },
      { state: 'British Columbia', lat: 48.4284, lng: -123.3656 },
      { state: 'Manitoba', lat: 49.8951, lng: -97.1384 },
      { state: 'New Brunswick', lat: 45.9636, lng: -66.6431 },
      { state: 'Newfoundland and Labrador', lat: 47.5615, lng: -52.7126 },
      { state: 'Nova Scotia', lat: 44.6488, lng: -63.5752 },
      { state: 'Ontario', lat: 43.6532, lng: -79.3832 },
      { state: 'Prince Edward Island', lat: 46.2382, lng: -63.1311 },
      { state: 'Quebec', lat: 46.8139, lng: -71.2080 },
      { state: 'Saskatchewan', lat: 50.4452, lng: -104.6189 }
    ]
  };

  constructor(private firebase: FirebaseService) {}

  /**
   * Generates a random UID for the simulated hardware device.
   */
  private generateUID(city: string): string {
    const prefix = city.substring(0, 3).toUpperCase();
    const id = Math.floor(Math.random() * 9000) + 1000;
    return `${prefix}-SIM-${id}`;
  }

  /**
   * Add a spike / anomaly to the simulated data randomly.
   */
  private applyNoise(baseValue: number, variance: number, spikeChance: number = 0.05, spikeMultiplier: number = 1.5): number {
    let val = baseValue + (Math.random() * variance * 2 - variance);
    // Introduce random occasional spikes
    if (Math.random() < spikeChance) {
      val *= (Math.random() > 0.5 ? spikeMultiplier : (1 / spikeMultiplier));
    }
    return val;
  }

  /**
   * Simulates 7 days of data with an interval of 1 day (7 records per station).
   */
  private generateHistoricalData(baseData: ExternalWaterData): { [key: string]: SensorReading } {
    const records: { [key: string]: SensorReading } = {};
    const now = Date.now();
    const sevenDaysAgo = now - (7 * 24 * 60 * 60 * 1000);
    const oneDay = 24 * 60 * 60 * 1000;

    let currentPh = baseData.base_ph;
    let currentNtu = baseData.base_ntu;
    let currentTemp = baseData.base_temp;

    for (let timestamp = sevenDaysAgo; timestamp <= now; timestamp += oneDay) {
      currentPh += (Math.random() * 0.04 - 0.02);
      currentNtu += (Math.random() * 0.2 - 0.1);
      currentTemp += (Math.random() * 0.5 - 0.25);

      const reading: SensorReading = {
        ph: parseFloat(this.applyNoise(currentPh, 0.2, 0.1).toFixed(2)),
        ntu: parseFloat(Math.max(0, this.applyNoise(currentNtu, 0.5, 0.1, 2.0)).toFixed(2)),
        temp: parseFloat(this.applyNoise(currentTemp, 1.0).toFixed(1)),
        light: parseFloat(Math.max(0, this.applyNoise(baseData.base_light, 15)).toFixed(0)),
        server_time: timestamp
      };

      const pushId = `sim_${timestamp}`;
      records[pushId] = reading;
    }
    return records;
  }

  private getRandom(min: number, max: number): number {
    return Math.random() * (max - min) + min;
  }

  /**
   * Generates synthetic stations for every state/province
   */
  private buildStationList(): ExternalWaterData[] {
    const generated: ExternalWaterData[] = [];
    
    // Names for variety
    const prefixes = ['Gov', 'Public', 'EPA', 'Env', 'Central', 'Regional'];
    const suffixes = ['Water Monitor', 'Sensor Node', 'Testing Station', 'Reservoir Hub', 'Basin Relay'];

    const addStations = (countryName: string, stateList: {state: string, lat: number, lng: number}[]) => {
      for (const st of stateList) {
        
        // Generate realistic baseline water params
        const base_ph = parseFloat(this.getRandom(6.5, 8.5).toFixed(1));
        const base_ntu = parseFloat(this.getRandom(0.5, 6.0).toFixed(1));
        const base_temp = parseFloat(this.getRandom(8, 28).toFixed(1));
        const base_light = parseFloat(this.getRandom(20, 90).toFixed(0));

        const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
        const suffix = suffixes[Math.floor(Math.random() * suffixes.length)];

        generated.push({
          station_name: `${prefix} ${st.state} ${suffix}`,
          latitude: st.lat,
          longitude: st.lng,
          city: st.state, // using state as city descriptor
          state: st.state,
          country: countryName,
          base_ph,
          base_ntu,
          base_temp,
          base_light
        });
      }
    };

    addStations('USA', this.regions.USA);
    addStations('India', this.regions.India);
    addStations('UK', this.regions.UK);
    addStations('Canada', this.regions.Canada);

    return generated;
  }

  /**
   * Cleans the database of all existing stations and history, then seeds the fresh optimized batch.
   */
  async seedExternalStations(): Promise<number> {
    const rtdb = getDatabase();
    const firestore = getFirestore();
    let count = 0;

    console.log('Starting data seeding process...');
    
    // --- 1. CLEANUP PHASE ---
    try {
      console.log('Cleaning up old stations from Firestore...');
      const stationsSnap = await getDocs(collection(firestore, 'public_stations'));
      const deletePromises = stationsSnap.docs.map(d => deleteDoc(doc(firestore, 'public_stations', d.id)));
      await Promise.all(deletePromises);
      
      console.log('Wiping old history from Realtime Database...');
      await remove(ref(rtdb, 'WaterHistory'));
    } catch (err) {
      console.warn('Cleanup phase encountered an issue, continuing to seed...', err);
    }

    // --- 2. SEEDING PHASE ---
    const allStations = this.buildStationList();
    console.log(`Prepared to seed ${allStations.length} optimized stations.`);

    for (const external of allStations) {
      try {
        const deviceUid = this.generateUID(external.city);

        // 1. Create Public Station Metadata in Firestore
        const firestoreStation: PublicStation = {
          name: `[${external.country}] ${external.station_name}`,
          lat: external.latitude,
          lng: external.longitude,
          city: external.city,
          state: external.state,
          country: external.country,
          status: 'safe', // Changed from 'active' to match interface
          type: 'river',
          assigned_device_id: deviceUid,
          created_at: Date.now(),
          updated_at: Date.now()
        };

        const docId = await this.firebase.addStation(firestoreStation);

        // 2. Generate and Push 30-Days of Historical Data to RTDB
        const historyData = this.generateHistoricalData(external);
        const historyRef = ref(rtdb, `WaterHistory/${deviceUid}`);
        
        await set(historyRef, historyData);

        count++;
      } catch (err) {
        console.error(`Failed to seed station: ${external.station_name}`, err);
      }
    }
    return count;
  }
}
