export interface ArtistEntry {
  name: string;
  language: string;
  genre?: string;
  trending?: boolean;
}

export const ARTISTS_DATABASE: ArtistEntry[] = [
  // --- Tamil ---
  { name: 'Anirudh Ravichander', language: 'Tamil', genre: 'Soundtrack / Pop', trending: true },
  { name: 'A.R. Rahman', language: 'Tamil / Hindi', genre: 'Soundtrack / World', trending: true },
  { name: 'Yuvan Shankar Raja', language: 'Tamil', genre: 'Melody / Lo-Fi', trending: true },
  { name: 'Harris Jayaraj', language: 'Tamil', genre: 'Melody / Romantic', trending: true },
  { name: 'Santhosh Narayanan', language: 'Tamil', genre: 'Indie / Folk / Acoustic', trending: true },
  { name: 'Ilaiyaraaja', language: 'Tamil', genre: 'Classic / Melody', trending: true },
  { name: 'Sid Sriram', language: 'Tamil / Telugu', genre: 'Carnatic / Pop', trending: true },
  { name: 'Dhee', language: 'Tamil', genre: 'Indie / R&B', trending: true },
  { name: 'Pradeep Kumar', language: 'Tamil', genre: 'Acoustic / Soul', trending: true },
  { name: 'Sai Abhyankkar', language: 'Tamil', genre: 'Indie Pop / Viral', trending: true },
  { name: 'Paal Dabba', language: 'Tamil', genre: 'Hip-Hop / Rap', trending: true },
  { name: 'Jonita Gandhi', language: 'Tamil / Hindi', genre: 'Pop / Dance', trending: true },
  { name: 'S.P. Balasubrahmanyam', language: 'Tamil / Telugu', genre: 'Classic Legend', trending: false },
  { name: 'K.S. Chithra', language: 'Tamil / Malayalam', genre: 'Melody Classic', trending: false },
  { name: 'Sean Roldan', language: 'Tamil', genre: 'Acoustic / Folk', trending: false },
  { name: 'G.V. Prakash Kumar', language: 'Tamil', genre: 'Soundtrack / Melody', trending: false },
  { name: 'Hiphop Tamizha', language: 'Tamil', genre: 'Hip-Hop / Pop', trending: false },
  { name: 'Vijay Antony', language: 'Tamil', genre: 'Soundtrack / Beat', trending: false },
  { name: 'Haricharan', language: 'Tamil / Telugu', genre: 'Melody / Classical', trending: false },
  { name: 'Karthik', language: 'Tamil / Telugu', genre: 'Melody', trending: false },
  { name: 'Shakthisree Gopalan', language: 'Tamil', genre: 'Soul / Jazz', trending: false },
  { name: 'Andrea Jeremiah', language: 'Tamil', genre: 'Jazz / Pop', trending: false },
  { name: 'S. Janaki', language: 'Tamil / Telugu', genre: 'Classic', trending: false },
  { name: 'D. Imman', language: 'Tamil', genre: 'Folk / Melody', trending: false },
  { name: 'Vivek-Mervin', language: 'Tamil', genre: 'Dance / Pop', trending: false },

  // --- Hindi / Bollywood ---
  { name: 'Arijit Singh', language: 'Hindi', genre: 'Melody / Soul', trending: true },
  { name: 'Pritam', language: 'Hindi', genre: 'Soundtrack / Pop', trending: true },
  { name: 'Atif Aslam', language: 'Hindi', genre: 'Romantic / Rock', trending: true },
  { name: 'Shreya Ghoshal', language: 'Hindi / Tamil', genre: 'Melody / Classical', trending: true },
  { name: 'KK', language: 'Hindi', genre: 'Rock / Romantic Classic', trending: false },
  { name: 'Sonu Nigam', language: 'Hindi', genre: 'Melody Legend', trending: false },
  { name: 'Mohit Chauhan', language: 'Hindi', genre: 'Folk / Indie', trending: false },
  { name: 'Badshah', language: 'Hindi', genre: 'Hip-Hop / Party', trending: true },
  { name: 'Yo Yo Honey Singh', language: 'Hindi / Punjabi', genre: 'Hip-Hop / Rap', trending: false },
  { name: 'Jubin Nautiyal', language: 'Hindi', genre: 'Romantic / Devotional', trending: true },
  { name: 'Vishal-Shekhar', language: 'Hindi', genre: 'Soundtrack / Dance', trending: false },
  { name: 'Shankar Mahadevan', language: 'Hindi / Tamil', genre: 'Classical / Fusion', trending: false },
  { name: 'Amit Trivedi', language: 'Hindi', genre: 'Indie / Folk', trending: false },
  { name: 'Sachin-Jigar', language: 'Hindi', genre: 'Soundtrack / Pop', trending: true },
  { name: 'Sunidhi Chauhan', language: 'Hindi', genre: 'Dance / Pop', trending: false },
  { name: 'Neha Kakkar', language: 'Hindi', genre: 'Party / Pop', trending: false },
  { name: 'Armaan Malik', language: 'Hindi / English', genre: 'Pop / Romantic', trending: true },
  { name: 'Darshan Raval', language: 'Hindi', genre: 'Romantic Pop', trending: true },
  { name: 'Lucky Ali', language: 'Hindi', genre: 'Indie / Acoustic', trending: false },
  { name: 'Alka Yagnik', language: 'Hindi', genre: '90s Classic', trending: false },
  { name: 'Kumar Sanu', language: 'Hindi', genre: '90s Classic', trending: false },
  { name: 'Udit Narayan', language: 'Hindi', genre: '90s Classic', trending: false },
  { name: 'Kishore Kumar', language: 'Hindi', genre: 'Retro Golden Era', trending: false },
  { name: 'Mohammed Rafi', language: 'Hindi', genre: 'Retro Golden Era', trending: false },
  { name: 'Lata Mangeshkar', language: 'Hindi', genre: 'Retro Golden Era', trending: false },

  // --- Telugu ---
  { name: 'Devi Sri Prasad (DSP)', language: 'Telugu', genre: 'Energetic / Mass', trending: true },
  { name: 'Thaman S', language: 'Telugu', genre: 'EDM / Soundtrack', trending: true },
  { name: 'M.M. Keeravani', language: 'Telugu / Hindi', genre: 'Epic / Classical', trending: true },
  { name: 'Mickey J. Meyer', language: 'Telugu', genre: 'Melody', trending: false },
  { name: 'Ram Miriyala', language: 'Telugu', genre: 'Folk / Indie', trending: true },
  { name: 'Anurag Kulkarni', language: 'Telugu', genre: 'Melody', trending: false },
  { name: 'Mangli', language: 'Telugu', genre: 'Folk / High Energy', trending: true },
  { name: 'Geetha Madhuri', language: 'Telugu', genre: 'Folk / Pop', trending: false },
  { name: 'S.P. Charan', language: 'Telugu / Tamil', genre: 'Melody', trending: false },

  // --- Malayalam ---
  { name: 'Sushin Shyam', language: 'Malayalam', genre: 'Electronic / Indie', trending: true },
  { name: 'Hesham Abdul Wahab', language: 'Malayalam / Telugu', genre: 'Melody / Soul', trending: true },
  { name: 'Vineeth Sreenivasan', language: 'Malayalam', genre: 'Feel Good Pop', trending: false },
  { name: 'Shaan Rahman', language: 'Malayalam', genre: 'Melody', trending: false },
  { name: 'Jassie Gift', language: 'Malayalam', genre: 'Rap / Reggae', trending: false },
  { name: 'Job Kurian', language: 'Malayalam', genre: 'Indie / World', trending: false },
  { name: 'Sithara Krishnakumar', language: 'Malayalam', genre: 'Folk / Classical', trending: false },
  { name: 'K.J. Yesudas', language: 'Malayalam / Tamil', genre: 'Classical Legend', trending: false },
  { name: 'Rex Vijayan', language: 'Malayalam', genre: 'Alternative Rock', trending: false },

  // --- Punjabi ---
  { name: 'Diljit Dosanjh', language: 'Punjabi', genre: 'Pop / Bhangra', trending: true },
  { name: 'AP Dhillon', language: 'Punjabi', genre: 'Hip-Hop / Trap', trending: true },
  { name: 'Karan Aujla', language: 'Punjabi', genre: 'Hip-Hop / Rap', trending: true },
  { name: 'Sidhu Moose Wala', language: 'Punjabi', genre: 'Gangsta Rap / Folk', trending: true },
  { name: 'Shinda Kahlon', language: 'Punjabi', genre: 'Hip-Hop', trending: false },
  { name: 'Gurinder Gill', language: 'Punjabi', genre: 'Hip-Hop', trending: false },
  { name: 'B Praak', language: 'Punjabi / Hindi', genre: 'Emotional / Melody', trending: true },
  { name: 'Jasleen Royal', language: 'Punjabi / Hindi', genre: 'Acoustic / Indie', trending: true },
  { name: 'Hardy Sandhu', language: 'Punjabi', genre: 'Dance / Pop', trending: false },
  { name: 'Guru Randhawa', language: 'Punjabi', genre: 'Pop / Dance', trending: false },
  { name: 'Amrinder Gill', language: 'Punjabi', genre: 'Folk / Melody', trending: false },

  // --- Kannada ---
  { name: 'Charan Raj', language: 'Kannada', genre: 'Soundtrack / Indie', trending: true },
  { name: 'B. Ajaneesh Loknath', language: 'Kannada', genre: 'Folk Fusion / Soundtrack', trending: true },
  { name: 'Raghu Dixit', language: 'Kannada', genre: 'Folk Rock', trending: false },
  { name: 'Sanjith Hegde', language: 'Kannada / Tamil', genre: 'Indie Pop', trending: false },
  { name: 'Vijay Prakash', language: 'Kannada / Tamil', genre: 'Classical / Melody', trending: false },
  { name: 'Arjun Janya', language: 'Kannada', genre: 'Soundtrack / Mass', trending: false },

  // --- English / Global ---
  { name: 'The Weeknd', language: 'English', genre: 'R&B / Synthwave', trending: true },
  { name: 'Taylor Swift', language: 'English', genre: 'Pop / Country', trending: true },
  { name: 'Drake', language: 'English', genre: 'Hip-Hop / Rap', trending: true },
  { name: 'Billie Eilish', language: 'English', genre: 'Alt-Pop / Lo-Fi', trending: true },
  { name: 'Bruno Mars', language: 'English', genre: 'Funk / Soul / Pop', trending: true },
  { name: 'Ed Sheeran', language: 'English', genre: 'Acoustic / Pop', trending: true },
  { name: 'Coldplay', language: 'English', genre: 'Alt-Rock / Ambient', trending: true },
  { name: 'Eminem', language: 'English', genre: 'Hip-Hop / Rap', trending: false },
  { name: 'Post Malone', language: 'English', genre: 'Hip-Hop / Pop Rock', trending: true },
  { name: 'Kendrick Lamar', language: 'English', genre: 'Hip-Hop / Rap', trending: true },
  { name: 'Dua Lipa', language: 'English', genre: 'Nu-Disco / Pop', trending: true },
  { name: 'Justin Bieber', language: 'English', genre: 'Pop / R&B', trending: false },
  { name: 'Ariana Grande', language: 'English', genre: 'Pop / R&B', trending: true },
  { name: 'Imagine Dragons', language: 'English', genre: 'Alt-Rock / Motivation', trending: true },
  { name: 'Queen', language: 'English', genre: 'Classic Rock', trending: false },
  { name: 'Michael Jackson', language: 'English', genre: 'Pop King Legend', trending: false },
  { name: 'Adele', language: 'English', genre: 'Soul / Melody', trending: false },
  { name: 'Travis Scott', language: 'English', genre: 'Trap / Hip-Hop', trending: true },
  { name: 'Rihanna', language: 'English', genre: 'Pop / Dancehall', trending: false },
  { name: 'Linkin Park', language: 'English', genre: 'Nu-Metal / Rock', trending: true },
  { name: 'Daft Punk', language: 'English / French', genre: 'French Electronic / House', trending: false },
  { name: 'Lana Del Rey', language: 'English', genre: 'Sadcore / Vintage Pop', trending: true },
  { name: 'Harry Styles', language: 'English', genre: 'Pop Rock', trending: false },
  { name: 'Maroon 5', language: 'English', genre: 'Pop Rock', trending: false },

  // --- K-Pop / Asian ---
  { name: 'BTS', language: 'Korean', genre: 'K-Pop / Pop', trending: true },
  { name: 'NewJeans', language: 'Korean', genre: 'Y2K Pop / R&B', trending: true },
  { name: 'BLACKPINK', language: 'Korean', genre: 'K-Pop / EDM', trending: true },
  { name: 'Stray Kids', language: 'Korean', genre: 'K-Pop / Hip-Hop', trending: true },
  { name: 'TWICE', language: 'Korean', genre: 'K-Pop / Dance', trending: false },
  { name: 'FIFTY FIFTY', language: 'Korean', genre: 'City Pop / Pop', trending: false },
  { name: 'IU', language: 'Korean', genre: 'K-Ballad / Melody', trending: true },
  { name: 'LE SSERAFIM', language: 'Korean', genre: 'K-Pop / Dance', trending: true }
];

export function searchMatchingArtists(query: string, limit: number = 8): ArtistEntry[] {
  const clean = query.trim().toLowerCase();
  if (!clean) return [];

  return ARTISTS_DATABASE.filter(artist => 
    artist.name.toLowerCase().includes(clean) ||
    artist.language.toLowerCase().includes(clean) ||
    (artist.genre && artist.genre.toLowerCase().includes(clean))
  ).slice(0, limit);
}

