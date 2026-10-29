export type FilmLanguage = "Hindi" | "Telugu" | "Tamil" | "Other";
export type FilmStatus = "Released" | "Upcoming" | "To Be Confirmed";

export interface FilmEntry {
  id: string;
  title: string;
  year: number;
  displayYear: string;
  language: FilmLanguage;
  status: FilmStatus;
  role: string;
  director?: string;
  cast?: string[];
  description: string;
  pageUrl?: string;
  highlights?: string[];
}

export const FILMOGRAPHY_DATA: FilmEntry[] = [
  {
    id: "lenin",
    title: "Lenin",
    year: 2026,
    displayYear: "To Be Confirmed",
    language: "Telugu",
    status: "To Be Confirmed",
    role: "Bharathi",
    director: "Murali Kishor Abburu",
    cast: ["Akhil Akkineni", "Bhagyashri Borse"],
    description:
      "A rustic period action drama set against the rugged backdrop of Rayalaseema, exploring themes of resilience, justice, and devotion with Bhagyashri portraying the central role of Bharathi.",
    pageUrl: "/movies/lenin",
    highlights: ["Dedicated tribute archive available", "High-intensity period drama"],
  },
  {
    id: "andhra-king-taluka",
    title: "Andhra King Taluka",
    year: 2025,
    displayYear: "2025",
    language: "Telugu",
    status: "Upcoming",
    role: "Mahalaxmi",
    director: "Mahesh Babu P",
    cast: ["Ram Pothineni", "Bhagyashri Borse"],
    description:
      "A high-energy mass commercial entertainer pairing Ram Pothineni and Bhagyashri Borse in vibrant, charismatic lead roles filled with romance, music, and dramatic action.",
    highlights: ["Female Lead Role", "Mass Commercial Entertainer"],
  },
  {
    id: "kaantha",
    title: "Kaantha",
    year: 2025,
    displayYear: "2025",
    language: "Tamil",
    status: "Upcoming",
    role: "Kumari / Saantha",
    director: "Selvamani Selvaraj",
    cast: ["Dulquer Salmaan", "Bhagyashri Borse", "Rana Daggubati", "Samuthirakani"],
    description:
      "A 1950s period crime drama produced jointly by Spirit Media and Wayfarer Films. The project marks Bhagyashri's Tamil cinema debut in a nuanced, atmospheric storyline with Dulquer Salmaan.",
    highlights: ["Tamil Cinema Debut", "1950s Period Setting", "Spirit Media & Wayfarer Films"],
  },
  {
    id: "kingdom",
    title: "Kingdom",
    year: 2025,
    displayYear: "2025",
    language: "Telugu",
    status: "Upcoming",
    role: "Dr. Madhu",
    director: "Gowtam Tinnanuri",
    cast: ["Vijay Deverakonda", "Bhagyashri Borse", "Satyadev"],
    description:
      "A large-scale period action thriller directed by National Award-winning filmmaker Gowtam Tinnanuri, featuring an intense cinematic canvas starring Vijay Deverakonda.",
    highlights: ["Directed by Gowtam Tinnanuri", "Period Action Thriller"],
  },
  {
    id: "mr-bachchan",
    title: "Mr. Bachchan",
    year: 2024,
    displayYear: "2024",
    language: "Telugu",
    status: "Released",
    role: "Jikki",
    director: "Harish Shankar",
    cast: ["Ravi Teja", "Bhagyashri Borse", "Jagapathi Babu", "Sachin Khedekar"],
    description:
      "Her sensational debut in South Indian cinema as the female lead Jikki opposite Mass Maharaja Ravi Teja. Directed by Harish Shankar, the film features memorable dance performances and the chartbuster song 'Reppal Dappul'.",
    highlights: ["Telugu Leading Debut", "SIIMA Best Female Debut Recognition", "Chartbuster 'Reppal Dappul'"],
  },
  {
    id: "chandu-champion",
    title: "Chandu Champion",
    year: 2024,
    displayYear: "2024",
    language: "Hindi",
    status: "Released",
    role: "Nayanthara (Journalist - Special Appearance)",
    director: "Kabir Khan",
    cast: ["Kartik Aaryan", "Vijay Raaz", "Bhuvan Arora", "Bhagyashri Borse"],
    description:
      "Kabir Khan's biographical sports drama chronicling the inspiring journey of India's first Paralympic gold medalist Murlikant Petkar, featuring Bhagyashri in a memorable appearance as journalist Nayanthara.",
    highlights: ["Directed by Kabir Khan", "Special Appearance", "Biographical Sports Drama"],
  },
  {
    id: "yaariyan-2",
    title: "Yaariyan 2",
    year: 2023,
    displayYear: "2023",
    language: "Hindi",
    status: "Released",
    role: "Rajyalakshmi 'Raji' Cariappa",
    director: "Radhika Rao, Vinay Sapru",
    cast: ["Divya Khosla Kumar", "Yash Daasguptaa", "Meezaan Jafri", "Pearl V Puri", "Bhagyashri Borse"],
    description:
      "Her silver screen debut in Hindi cinema as Rajyalakshmi 'Raji' Cariappa. A vibrant coming-of-age musical romance drama celebrating the bonds of cousinhood, love, and self-discovery.",
    highlights: ["Feature Film Acting Debut", "Hindi Musical Romance"],
  },
];

