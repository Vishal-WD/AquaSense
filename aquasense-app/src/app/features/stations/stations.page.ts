import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FirebaseService, AppUser, PublicStation } from '../../core/services/firebase.service';
import { getFirestore, collection, getDocs } from 'firebase/firestore';

interface GroupedStations {
  [country: string]: {
    [state: string]: PublicStation[]
  }
}

@Component({
  selector: 'app-stations',
  templateUrl: './stations.page.html',
  styleUrls: ['./stations.page.scss'],
  standalone: false
})
export class StationsPage implements OnInit {
  user: AppUser | null = null;
  allStations: PublicStation[] = [];
  
  // Accordion Data
  groupedStations: GroupedStations = {};
  countries: string[] = [];
  
  // Search State
  searchQuery: string = '';
  filteredStations: PublicStation[] = [];
  isSearching: boolean = false;

  // Auto-localization
  userCountry: string = 'India';

  constructor(private firebase: FirebaseService, private router: Router) { }

  ngOnInit() {
    this.firebase.currentUser$.subscribe(user => {
      this.user = user;
      if (user && user.country) {
        this.userCountry = user.country;
      }
      this.loadAndGroupStations();
    });
  }

  async loadAndGroupStations() {
    try {
      const db = getFirestore();
      const snap = await getDocs(collection(db, 'public_stations'));
      this.allStations = snap.docs.map(d => ({ id: d.id, ...d.data() } as PublicStation));
      
      const grouped: GroupedStations = {};
      
      this.allStations.forEach(st => {
        if (!grouped[st.country]) grouped[st.country] = {};
        if (!grouped[st.country][st.state]) grouped[st.country][st.state] = [];
        grouped[st.country][st.state].push(st);
      });

      for (const country of Object.keys(grouped)) {
        for (const state of Object.keys(grouped[country])) {
          grouped[country][state].sort((a, b) => a.name.localeCompare(b.name));
        }
      }

      this.groupedStations = grouped;
      this.countries = Object.keys(grouped).sort();
    } catch (err) {
      console.error('Error fetching stations', err);
    }
  }

  handleSearch(event: any) {
    const query = event.target.value.toLowerCase().trim();
    this.searchQuery = query;

    if (!query) {
      this.isSearching = false;
      this.filteredStations = [];
      return;
    }

    this.isSearching = true;
    this.filteredStations = this.allStations.filter(st => {
      return st.name.toLowerCase().includes(query) || 
             st.state.toLowerCase().includes(query) || 
             st.city.toLowerCase().includes(query);
    });
    
    this.filteredStations.sort((a, b) => a.name.localeCompare(b.name));
  }

  viewStation(station: PublicStation) {
    this.router.navigate(['/reports'], {
      queryParams: { uid: station.assigned_device_id, name: station.name }
    });
  }
}
