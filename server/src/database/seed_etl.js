import dotenv from "dotenv";
import mongoose from "mongoose";
import dns from "node:dns";
import User from "../models/userModel.js";
import { Institution, Faculty, Department, Program } from "../models/universityModel.js";
import { Scholarship } from "../models/scholarshipModel.js";
import { Application } from "../models/applicationModel.js";
import Recommendation from "../models/recommendationModel.js";
import { ETLService } from "../services/etlService.js";

dotenv.config();

const rawInstitutions = [
  { name: "Abubakar Tafawa Balewa University", institutionType: "university", ownershipType: "federal", state: "Bauchi", city: "Bauchi", logo: "🎓", ranking: 1, tuition: "₦90,000/yr", acceptanceRate: 10, studentPopulation: 10000, tags: ['Federal', 'NUC', 'University'], coordinates: [3.3, 6.2] },
  { name: "Adeyemi Federal University of Education", institutionType: "university", ownershipType: "federal", state: "Ondo", city: "Ondo", logo: "🏛️", ranking: 2, tuition: "₦91,357/yr", acceptanceRate: 17, studentPopulation: 10739, tags: ['Federal', 'NUC', 'University'], coordinates: [3.3531, 6.2471] },
  { name: "Admiralty University Ibusa", institutionType: "university", ownershipType: "federal", state: "Delta", city: "Ibusa", logo: "⚙️", ranking: 3, tuition: "₦92,714/yr", acceptanceRate: 24, studentPopulation: 11478, tags: ['Federal', 'NUC', 'University'], coordinates: [3.4062, 6.2942] },
  { name: "Ahmadu Bello University", institutionType: "university", ownershipType: "federal", state: "Kaduna", city: "Zaria", logo: "📚", ranking: 4, tuition: "₦94,071/yr", acceptanceRate: 31, studentPopulation: 12217, tags: ['Federal', 'NUC', 'University'], coordinates: [3.4593, 6.3413] },
  { name: "Air Force Institute of Technology", institutionType: "university", ownershipType: "federal", state: "Kaduna", city: "Kaduna", logo: "⚡", ranking: 5, tuition: "₦95,428/yr", acceptanceRate: 13, studentPopulation: 12956, tags: ['Federal', 'NUC', 'University'], coordinates: [3.5124, 6.3884] },
  { name: "Alex Ekwueme Federal University Ndufu Alike Ikwo", institutionType: "university", ownershipType: "federal", state: "Ebonyi", city: "Ikwo", logo: "🏫", ranking: 6, tuition: "₦96,785/yr", acceptanceRate: 20, studentPopulation: 13695, tags: ['Federal', 'NUC', 'University'], coordinates: [3.5655, 6.4355] },
  { name: "Alvan Ikoku Federal University of Education", institutionType: "university", ownershipType: "federal", state: "Imo", city: "Owerri", logo: "🦅", ranking: 7, tuition: "₦98,142/yr", acceptanceRate: 27, studentPopulation: 14434, tags: ['Federal', 'NUC', 'University'], coordinates: [3.6186, 6.4826] },
  { name: "Bayero University", institutionType: "university", ownershipType: "federal", state: "Kano", city: "Kano", logo: "💡", ranking: 8, tuition: "₦99,499/yr", acceptanceRate: 34, studentPopulation: 15173, tags: ['Federal', 'NUC', 'University'], coordinates: [3.6717, 6.5297] },
  { name: "Federal University Birnin Kebbi", institutionType: "university", ownershipType: "federal", state: "Kebbi", city: "Birnin Kebbi", logo: "🌾", ranking: 9, tuition: "₦100,856/yr", acceptanceRate: 16, studentPopulation: 15912, tags: ['Federal', 'NUC', 'University'], coordinates: [3.7248, 6.5768] },
  { name: "Federal University Dutse", institutionType: "university", ownershipType: "federal", state: "Jigawa", city: "Dutse", logo: "⛰️", ranking: 10, tuition: "₦102,213/yr", acceptanceRate: 23, studentPopulation: 16651, tags: ['Federal', 'NUC', 'University'], coordinates: [3.7779, 6.6239] },
  { name: "Federal University Dutsin-Ma", institutionType: "university", ownershipType: "federal", state: "Katsina", city: "Dutsin-Ma", logo: "🏗️", ranking: 11, tuition: "₦103,570/yr", acceptanceRate: 30, studentPopulation: 17390, tags: ['Federal', 'NUC', 'University'], coordinates: [3.831, 6.671] },
  { name: "Federal University Gashua", institutionType: "university", ownershipType: "federal", state: "Yobe", city: "Gashua", logo: "🏜️", ranking: 12, tuition: "₦104,927/yr", acceptanceRate: 12, studentPopulation: 18129, tags: ['Federal', 'NUC', 'University'], coordinates: [3.8841, 6.7181] },
  { name: "Federal University Gusau", institutionType: "university", ownershipType: "federal", state: "Zamfara", city: "Gusau", logo: "🍂", ranking: 13, tuition: "₦106,284/yr", acceptanceRate: 19, studentPopulation: 18868, tags: ['Federal', 'NUC', 'University'], coordinates: [3.9372, 6.7652] },
  { name: "Federal University Kashere", institutionType: "university", ownershipType: "federal", state: "Gombe", city: "Kashere", logo: "💧", ranking: 14, tuition: "₦107,641/yr", acceptanceRate: 26, studentPopulation: 19607, tags: ['Federal', 'NUC', 'University'], coordinates: [3.9903, 6.8123] },
  { name: "Federal University Lokoja", institutionType: "university", ownershipType: "federal", state: "Kogi", city: "Lokoja", logo: "🌇", ranking: 15, tuition: "₦108,998/yr", acceptanceRate: 33, studentPopulation: 20346, tags: ['Federal', 'NUC', 'University'], coordinates: [4.0434, 6.8594] },
  { name: "Federal University Lafia", institutionType: "university", ownershipType: "federal", state: "Nasarawa", city: "Lafia", logo: "⛪", ranking: 16, tuition: "₦110,355/yr", acceptanceRate: 15, studentPopulation: 21085, tags: ['Federal', 'NUC', 'University'], coordinates: [4.0965, 6.9065] },
  { name: "Federal University of Agriculture, Abeokuta", institutionType: "university", ownershipType: "federal", state: "Ogun", city: "Abeokuta", logo: "🚜", ranking: 17, tuition: "₦111,712/yr", acceptanceRate: 22, studentPopulation: 21824, tags: ['Federal', 'NUC', 'University'], coordinates: [4.1496, 6.9536] },
  { name: "Federal University of Agriculture, Mubi", institutionType: "university", ownershipType: "federal", state: "Adamawa", city: "Mubi", logo: "🏥", ranking: 18, tuition: "₦113,069/yr", acceptanceRate: 29, studentPopulation: 22563, tags: ['Federal', 'NUC', 'University'], coordinates: [4.2027, 7.0007] },
  { name: "Federal University of Agriculture, Zuru", institutionType: "university", ownershipType: "federal", state: "Kebbi", city: "Zuru", logo: "🏢", ranking: 19, tuition: "₦114,426/yr", acceptanceRate: 11, studentPopulation: 23302, tags: ['Federal', 'NUC', 'University'], coordinates: [4.2558, 7.0478] },
  { name: "Federal University of Applied Sciences Kachia", institutionType: "university", ownershipType: "federal", state: "Kaduna", city: "Kachia", logo: "🌊", ranking: 20, tuition: "₦115,783/yr", acceptanceRate: 18, studentPopulation: 24041, tags: ['Federal', 'NUC', 'University'], coordinates: [4.3089, 7.0949] },
  { name: "Federal University of Education, Pankshi", institutionType: "university", ownershipType: "federal", state: "Plateau", city: "Pankshin", logo: "🎓", ranking: 21, tuition: "₦117,140/yr", acceptanceRate: 25, studentPopulation: 24780, tags: ['Federal', 'NUC', 'University'], coordinates: [4.362, 7.142] },
  { name: "Federal University of Education, Zaria", institutionType: "university", ownershipType: "federal", state: "Kaduna", city: "Zaria", logo: "🏛️", ranking: 22, tuition: "₦118,497/yr", acceptanceRate: 32, studentPopulation: 25519, tags: ['Federal', 'NUC', 'University'], coordinates: [4.4151, 7.1891] },
  { name: "Federal University of Health Sciences, Azare", institutionType: "university", ownershipType: "federal", state: "Bauchi", city: "Azare", logo: "⚙️", ranking: 23, tuition: "₦119,854/yr", acceptanceRate: 14, studentPopulation: 26258, tags: ['Federal', 'NUC', 'University'], coordinates: [4.4682, 7.2362] },
  { name: "Federal University of Petroleum Resources Effurun", institutionType: "university", ownershipType: "federal", state: "Delta", city: "Effurun", logo: "📚", ranking: 24, tuition: "₦121,211/yr", acceptanceRate: 21, studentPopulation: 26997, tags: ['Federal', 'NUC', 'University'], coordinates: [4.5213, 7.2833] },
  { name: "Federal University of Technology Akure", institutionType: "university", ownershipType: "federal", state: "Ondo", city: "Akure", logo: "⚡", ranking: 25, tuition: "₦122,568/yr", acceptanceRate: 28, studentPopulation: 27736, tags: ['Federal', 'NUC', 'University'], coordinates: [4.5744, 7.3304] },
  { name: "Federal University of Technology Minna", institutionType: "university", ownershipType: "federal", state: "Niger", city: "Minna", logo: "🏫", ranking: 26, tuition: "₦123,925/yr", acceptanceRate: 10, studentPopulation: 28475, tags: ['Federal', 'NUC', 'University'], coordinates: [4.6275, 7.3775] },
  { name: "Federal University of Technology Owerri", institutionType: "university", ownershipType: "federal", state: "Imo", city: "Owerri", logo: "🦅", ranking: 27, tuition: "₦90,282/yr", acceptanceRate: 17, studentPopulation: 29214, tags: ['Federal', 'NUC', 'University'], coordinates: [4.6806, 7.4246] },
  { name: "Federal University of Transportation, Daura", institutionType: "university", ownershipType: "federal", state: "Katsina", city: "Daura", logo: "💡", ranking: 28, tuition: "₦91,639/yr", acceptanceRate: 24, studentPopulation: 29953, tags: ['Federal', 'NUC', 'University'], coordinates: [4.7337, 7.4717] },
  { name: "Federal University Otuoke", institutionType: "university", ownershipType: "federal", state: "Bayelsa", city: "Otuoke", logo: "🌾", ranking: 29, tuition: "₦92,996/yr", acceptanceRate: 31, studentPopulation: 30692, tags: ['Federal', 'NUC', 'University'], coordinates: [4.7868, 7.5188] },
  { name: "Federal University Oye-Ekiti", institutionType: "university", ownershipType: "federal", state: "Ekiti", city: "Oye-Ekiti", logo: "⛰️", ranking: 30, tuition: "₦94,353/yr", acceptanceRate: 13, studentPopulation: 31431, tags: ['Federal', 'NUC', 'University'], coordinates: [4.8399, 7.5659] },
  { name: "Federal University Wukari", institutionType: "university", ownershipType: "federal", state: "Taraba", city: "Wukari", logo: "🏗️", ranking: 31, tuition: "₦95,710/yr", acceptanceRate: 20, studentPopulation: 32170, tags: ['Federal', 'NUC', 'University'], coordinates: [4.893, 7.613] },
  { name: "Joseph Sarwuan Tarka University", institutionType: "university", ownershipType: "federal", state: "Benue", city: "Makurdi", logo: "🏜️", ranking: 32, tuition: "₦97,067/yr", acceptanceRate: 27, studentPopulation: 32909, tags: ['Federal', 'NUC', 'University'], coordinates: [4.9461, 7.6601] },
  { name: "Michael Okpara University of Agriculture, Umudike", institutionType: "university", ownershipType: "federal", state: "Abia", city: "Umudike", logo: "🍂", ranking: 33, tuition: "₦98,424/yr", acceptanceRate: 34, studentPopulation: 33648, tags: ['Federal', 'NUC', 'University'], coordinates: [4.9992, 7.7072] },
  { name: "Modibbo Adama University, Yola", institutionType: "university", ownershipType: "federal", state: "Adamawa", city: "Yola", logo: "💧", ranking: 34, tuition: "₦99,781/yr", acceptanceRate: 16, studentPopulation: 34387, tags: ['Federal', 'NUC', 'University'], coordinates: [5.0523, 7.7543] },
  { name: "National Open University of Nigeria", institutionType: "university", ownershipType: "federal", state: "Lagos", city: "Victoria Island", logo: "🌇", ranking: 35, tuition: "₦101,138/yr", acceptanceRate: 23, studentPopulation: 35126, tags: ['Federal', 'NUC', 'University'], coordinates: [5.1054, 7.8014] },
  { name: "Nigeria Police Academy, Wudil", institutionType: "university", ownershipType: "federal", state: "Kano", city: "Wudil", logo: "⛪", ranking: 36, tuition: "₦102,495/yr", acceptanceRate: 30, studentPopulation: 35865, tags: ['Federal', 'NUC', 'University'], coordinates: [5.1585, 7.8485] },
  { name: "Nigerian Army University, Biu", institutionType: "university", ownershipType: "federal", state: "Borno", city: "Biu", logo: "🚜", ranking: 37, tuition: "₦103,852/yr", acceptanceRate: 12, studentPopulation: 36604, tags: ['Federal', 'NUC', 'University'], coordinates: [5.2116, 7.8956] },
  { name: "Nigerian Defense Academy", institutionType: "university", ownershipType: "federal", state: "Kaduna", city: "Kaduna", logo: "🏥", ranking: 38, tuition: "₦105,209/yr", acceptanceRate: 19, studentPopulation: 37343, tags: ['Federal', 'NUC', 'University'], coordinates: [5.2647, 7.9427] },
  { name: "Nigerian Maritime University", institutionType: "university", ownershipType: "federal", state: "Delta", city: "Okerenkoko", logo: "🏢", ranking: 39, tuition: "₦106,566/yr", acceptanceRate: 26, studentPopulation: 38082, tags: ['Federal', 'NUC', 'University'], coordinates: [5.3178, 7.9898] },
  { name: "Nnamdi Azikiwe University", institutionType: "university", ownershipType: "federal", state: "Anambra", city: "Awka", logo: "🌊", ranking: 40, tuition: "₦107,923/yr", acceptanceRate: 33, studentPopulation: 38821, tags: ['Federal', 'NUC', 'University'], coordinates: [5.3709, 8.0369] },
  { name: "Obafemi Awolowo University", institutionType: "university", ownershipType: "federal", state: "Osun", city: "Ile Ife", logo: "🎓", ranking: 41, tuition: "₦109,280/yr", acceptanceRate: 15, studentPopulation: 39560, tags: ['Federal', 'NUC', 'University'], coordinates: [5.424, 8.084] },
  { name: "Tai Solarin Federal University of Education", institutionType: "university", ownershipType: "federal", state: "Ogun", city: "Ijebu-Ode", logo: "🏛️", ranking: 42, tuition: "₦110,637/yr", acceptanceRate: 22, studentPopulation: 10299, tags: ['Federal', 'NUC', 'University'], coordinates: [5.4771, 8.1311] },
  { name: "University of Abuja", institutionType: "university", ownershipType: "federal", state: "FCT", city: "Gwagwalada", logo: "⚙️", ranking: 43, tuition: "₦111,994/yr", acceptanceRate: 29, studentPopulation: 11038, tags: ['Federal', 'NUC', 'University'], coordinates: [5.5302, 8.1782] },
  { name: "University of Benin", institutionType: "university", ownershipType: "federal", state: "Edo", city: "Benin City", logo: "📚", ranking: 44, tuition: "₦113,351/yr", acceptanceRate: 11, studentPopulation: 11777, tags: ['Federal', 'NUC', 'University'], coordinates: [5.5833, 8.2253] },
  { name: "University of Calabar", institutionType: "university", ownershipType: "federal", state: "Cross River", city: "Calabar", logo: "⚡", ranking: 45, tuition: "₦114,708/yr", acceptanceRate: 18, studentPopulation: 12516, tags: ['Federal', 'NUC', 'University'], coordinates: [5.6364, 8.2724] },
  { name: "University of Ibadan", institutionType: "university", ownershipType: "federal", state: "Oyo", city: "Ibadan", logo: "🏫", ranking: 46, tuition: "₦116,065/yr", acceptanceRate: 25, studentPopulation: 13255, tags: ['Federal', 'NUC', 'University'], coordinates: [5.6895, 8.3195] },
  { name: "University of Ilorin", institutionType: "university", ownershipType: "federal", state: "Kwara", city: "Ilorin", logo: "🦅", ranking: 47, tuition: "₦117,422/yr", acceptanceRate: 32, studentPopulation: 13994, tags: ['Federal', 'NUC', 'University'], coordinates: [5.7426, 8.3666] },
  { name: "University of Jos", institutionType: "university", ownershipType: "federal", state: "Plateau", city: "Jos", logo: "💡", ranking: 48, tuition: "₦118,779/yr", acceptanceRate: 14, studentPopulation: 14733, tags: ['Federal', 'NUC', 'University'], coordinates: [5.7957, 8.4137] },
  { name: "University of Lagos", institutionType: "university", ownershipType: "federal", state: "Lagos", city: "Akoka", logo: "🌾", ranking: 49, tuition: "₦120,136/yr", acceptanceRate: 21, studentPopulation: 15472, tags: ['Federal', 'NUC', 'University'], coordinates: [5.8488, 8.4608] },
  { name: "University of Maiduguri", institutionType: "university", ownershipType: "federal", state: "Borno", city: "Maiduguri", logo: "⛰️", ranking: 50, tuition: "₦121,493/yr", acceptanceRate: 28, studentPopulation: 16211, tags: ['Federal', 'NUC', 'University'], coordinates: [5.9019, 8.5079] },
  { name: "University of Nigeria, Nsukka", institutionType: "university", ownershipType: "federal", state: "Enugu", city: "Nsukka", logo: "🏗️", ranking: 51, tuition: "₦122,850/yr", acceptanceRate: 10, studentPopulation: 16950, tags: ['Federal', 'NUC', 'University'], coordinates: [5.955, 8.555] },
  { name: "University of Port Harcourt", institutionType: "university", ownershipType: "federal", state: "Rivers", city: "Port Harcourt", logo: "🏜️", ranking: 52, tuition: "₦124,207/yr", acceptanceRate: 17, studentPopulation: 17689, tags: ['Federal', 'NUC', 'University'], coordinates: [6.0081, 8.6021] },
  { name: "University of Uyo", institutionType: "university", ownershipType: "federal", state: "Akwa Ibom", city: "Uyo", logo: "🍂", ranking: 53, tuition: "₦90,564/yr", acceptanceRate: 24, studentPopulation: 18428, tags: ['Federal', 'NUC', 'University'], coordinates: [6.0612, 8.6492] },
  { name: "Usmanu Danfodiyo University", institutionType: "university", ownershipType: "federal", state: "Sokoto", city: "Sokoto", logo: "💧", ranking: 54, tuition: "₦91,921/yr", acceptanceRate: 31, studentPopulation: 19167, tags: ['Federal', 'NUC', 'University'], coordinates: [6.1143, 8.6963] },
  { name: "Yusuf Maitama Sule Federal University of Education, Kano", institutionType: "university", ownershipType: "federal", state: "Kano", city: "Kano", logo: "🌇", ranking: 55, tuition: "₦93,278/yr", acceptanceRate: 13, studentPopulation: 19906, tags: ['Federal', 'NUC', 'University'], coordinates: [6.1674, 8.7434] },
  { name: "Abdulkadir Kure University", institutionType: "university", ownershipType: "state", state: "Niger", city: "Minna", logo: "⛪", ranking: 56, tuition: "₦147,645/yr", acceptanceRate: 30, studentPopulation: 16215, tags: ['NUC', 'State', 'University'], coordinates: [6.2205, 8.7905] },
  { name: "Abia State University", institutionType: "university", ownershipType: "state", state: "Abia", city: "Uturu", logo: "🚜", ranking: 57, tuition: "₦149,784/yr", acceptanceRate: 39, studentPopulation: 16728, tags: ['NUC', 'State', 'University'], coordinates: [6.2736, 8.8376] },
  { name: "Abiola Ajimobi Technical University", institutionType: "university", ownershipType: "state", state: "Oyo", city: "Ibadan", logo: "🏥", ranking: 58, tuition: "₦151,923/yr", acceptanceRate: 18, studentPopulation: 17241, tags: ['NUC', 'State', 'University'], coordinates: [6.3267, 8.8847] },
  { name: "Adamawa State University", institutionType: "university", ownershipType: "state", state: "Adamawa", city: "Mubi", logo: "🏢", ranking: 59, tuition: "₦154,062/yr", acceptanceRate: 27, studentPopulation: 17754, tags: ['NUC', 'State', 'University'], coordinates: [6.3798, 8.9318] },
  { name: "Adekunle Ajasin University", institutionType: "university", ownershipType: "state", state: "Ondo", city: "Akungba-Akoko", logo: "🌊", ranking: 60, tuition: "₦156,201/yr", acceptanceRate: 36, studentPopulation: 18267, tags: ['NUC', 'State', 'University'], coordinates: [6.4329, 8.9789] },
  { name: "Akwa Ibom State University", institutionType: "university", ownershipType: "state", state: "Akwa Ibom", city: "Uyo", logo: "🎓", ranking: 61, tuition: "₦158,340/yr", acceptanceRate: 15, studentPopulation: 18780, tags: ['NUC', 'State', 'University'], coordinates: [6.486, 9.026] },
  { name: "Aliko Dangote University of Science and Technology", institutionType: "university", ownershipType: "state", state: "Kano", city: "Wudil", logo: "🏛️", ranking: 62, tuition: "₦160,479/yr", acceptanceRate: 24, studentPopulation: 19293, tags: ['NUC', 'State', 'University'], coordinates: [6.5391, 9.0731] },
  { name: "Ambrose Alli University", institutionType: "university", ownershipType: "state", state: "Edo", city: "Ekpoma", logo: "⚙️", ranking: 63, tuition: "₦162,618/yr", acceptanceRate: 33, studentPopulation: 19806, tags: ['NUC', 'State', 'University'], coordinates: [6.5922, 9.1202] },
  { name: "Bauchi State University", institutionType: "university", ownershipType: "state", state: "Bauchi", city: "Gadau", logo: "📚", ranking: 64, tuition: "₦164,757/yr", acceptanceRate: 42, studentPopulation: 20319, tags: ['NUC', 'State', 'University'], coordinates: [6.6453, 9.1673] },
  { name: "Bayelsa Medical University", institutionType: "university", ownershipType: "state", state: "Bayelsa", city: "Yenagoa", logo: "⚡", ranking: 65, tuition: "₦121,896/yr", acceptanceRate: 21, studentPopulation: 20832, tags: ['NUC', 'State', 'University'], coordinates: [6.6984, 9.2144] },
  { name: "Benue State University", institutionType: "university", ownershipType: "state", state: "Benue", city: "Makurdi", logo: "🏫", ranking: 66, tuition: "₦124,035/yr", acceptanceRate: 30, studentPopulation: 21345, tags: ['NUC', 'State', 'University'], coordinates: [6.7515, 9.2615] },
  { name: "Borno State University", institutionType: "university", ownershipType: "state", state: "Borno", city: "Maiduguri", logo: "🦅", ranking: 67, tuition: "₦126,174/yr", acceptanceRate: 39, studentPopulation: 21858, tags: ['NUC', 'State', 'University'], coordinates: [6.8046, 9.3086] },
  { name: "Chukwuemeka Odumegwu Ojukwu University", institutionType: "university", ownershipType: "state", state: "Anambra", city: "Uli", logo: "💡", ranking: 68, tuition: "₦128,313/yr", acceptanceRate: 18, studentPopulation: 22371, tags: ['NUC', 'State', 'University'], coordinates: [6.8577, 9.3557] },
  { name: "Delta State University, Abraka", institutionType: "university", ownershipType: "state", state: "Delta", city: "Abraka", logo: "🌾", ranking: 69, tuition: "₦130,452/yr", acceptanceRate: 27, studentPopulation: 22884, tags: ['NUC', 'State', 'University'], coordinates: [6.9108, 9.4028] },
  { name: "Delta State University of Science and Technology", institutionType: "university", ownershipType: "state", state: "Delta", city: "Ozoro", logo: "⛰️", ranking: 70, tuition: "₦132,591/yr", acceptanceRate: 36, studentPopulation: 23397, tags: ['NUC', 'State', 'University'], coordinates: [6.9639, 9.4499] },
  { name: "Dennis Osadebay University", institutionType: "university", ownershipType: "state", state: "Delta", city: "Asaba", logo: "🏗️", ranking: 71, tuition: "₦134,730/yr", acceptanceRate: 15, studentPopulation: 23910, tags: ['NUC', 'State', 'University'], coordinates: [7.017, 9.497] },
  { name: "Ebonyi State University", institutionType: "university", ownershipType: "state", state: "Ebonyi", city: "Abakaliki", logo: "🏜️", ranking: 72, tuition: "₦136,869/yr", acceptanceRate: 24, studentPopulation: 24423, tags: ['NUC', 'State', 'University'], coordinates: [7.0701, 9.5441] },
  { name: "Edo State University, Uzairue", institutionType: "university", ownershipType: "state", state: "Edo", city: "Iyamho", logo: "🍂", ranking: 73, tuition: "₦139,008/yr", acceptanceRate: 33, studentPopulation: 24936, tags: ['NUC', 'State', 'University'], coordinates: [7.1232, 9.5912] },
  { name: "Ekiti State University", institutionType: "university", ownershipType: "state", state: "Ekiti", city: "Ado Ekiti", logo: "💧", ranking: 74, tuition: "₦141,147/yr", acceptanceRate: 42, studentPopulation: 25449, tags: ['NUC', 'State', 'University'], coordinates: [7.1763, 9.6383] },
  { name: "Emmanuel Ayande University of Education", institutionType: "university", ownershipType: "state", state: "Oyo", city: "Oyo", logo: "🌇", ranking: 75, tuition: "₦143,286/yr", acceptanceRate: 21, studentPopulation: 25962, tags: ['NUC', 'State', 'University'], coordinates: [7.2294, 9.6854] },
  { name: "Enugu State University of Science and Technology", institutionType: "university", ownershipType: "state", state: "Enugu", city: "Enugu", logo: "⛪", ranking: 76, tuition: "₦145,425/yr", acceptanceRate: 30, studentPopulation: 26475, tags: ['NUC', 'State', 'University'], coordinates: [7.2825, 9.7325] },
  { name: "Gombe State University", institutionType: "university", ownershipType: "state", state: "Gombe", city: "Gombe", logo: "🚜", ranking: 77, tuition: "₦147,564/yr", acceptanceRate: 39, studentPopulation: 26988, tags: ['NUC', 'State', 'University'], coordinates: [7.3356, 9.7796] },
  { name: "Gombe State University of Science and Technology", institutionType: "university", ownershipType: "state", state: "Gombe", city: "Kumo", logo: "🏥", ranking: 78, tuition: "₦149,703/yr", acceptanceRate: 18, studentPopulation: 27501, tags: ['NUC', 'State', 'University'], coordinates: [7.3887, 9.8267] },
  { name: "Ibrahim Badamasi Babangasi University", institutionType: "university", ownershipType: "state", state: "Niger", city: "Lapai", logo: "🏢", ranking: 79, tuition: "₦151,842/yr", acceptanceRate: 27, studentPopulation: 8014, tags: ['NUC', 'State', 'University'], coordinates: [7.4418, 9.8738] },
  { name: "Ignatius Ajuru University of Education", institutionType: "university", ownershipType: "state", state: "Rivers", city: "Port Harcourt", logo: "🌊", ranking: 80, tuition: "₦153,981/yr", acceptanceRate: 36, studentPopulation: 8527, tags: ['NUC', 'State', 'University'], coordinates: [7.4949, 9.9209] },
  { name: "Imo State University", institutionType: "university", ownershipType: "state", state: "Imo", city: "Owerri", logo: "🎓", ranking: 81, tuition: "₦156,120/yr", acceptanceRate: 15, studentPopulation: 9040, tags: ['NUC', 'State', 'University'], coordinates: [7.548, 9.968] },
  { name: "Kaduna State University", institutionType: "university", ownershipType: "state", state: "Kaduna", city: "Kaduna", logo: "🏛️", ranking: 82, tuition: "₦158,259/yr", acceptanceRate: 24, studentPopulation: 9553, tags: ['NUC', 'State', 'University'], coordinates: [7.6011, 10.0151] },
  { name: "Kebbi State University of Science and Technology", institutionType: "university", ownershipType: "state", state: "Kebbi", city: "Aliero", logo: "⚙️", ranking: 83, tuition: "₦160,398/yr", acceptanceRate: 33, studentPopulation: 10066, tags: ['NUC', 'State', 'University'], coordinates: [7.6542, 10.0622] },
  { name: "Kingsley Ozumba Mbadiwe University", institutionType: "university", ownershipType: "state", state: "Imo", city: "Ideato South", logo: "📚", ranking: 84, tuition: "₦162,537/yr", acceptanceRate: 42, studentPopulation: 10579, tags: ['NUC', 'State', 'University'], coordinates: [7.7073, 10.1093] },
  { name: "Kwara State University", institutionType: "university", ownershipType: "state", state: "Kwara", city: "Malete", logo: "⚡", ranking: 85, tuition: "₦164,676/yr", acceptanceRate: 21, studentPopulation: 11092, tags: ['NUC', 'State', 'University'], coordinates: [7.7604, 10.1564] },
  { name: "Prince Abubakar Audu University", institutionType: "university", ownershipType: "state", state: "Kogi", city: "Anyigba", logo: "🏫", ranking: 86, tuition: "₦121,815/yr", acceptanceRate: 30, studentPopulation: 11605, tags: ['NUC', 'State', 'University'], coordinates: [7.8135, 10.2035] },
  { name: "Ladoke Akintola University of Technology", institutionType: "university", ownershipType: "state", state: "Oyo", city: "Ogbomoso", logo: "🦅", ranking: 87, tuition: "₦123,954/yr", acceptanceRate: 39, studentPopulation: 12118, tags: ['NUC', 'State', 'University'], coordinates: [7.8666, 10.2506] },
  { name: "Lagos State University", institutionType: "university", ownershipType: "state", state: "Lagos", city: "Ojo", logo: "💡", ranking: 88, tuition: "₦126,093/yr", acceptanceRate: 18, studentPopulation: 12631, tags: ['NUC', 'State', 'University'], coordinates: [7.9197, 10.2977] },
  { name: "Lagos State University of Education", institutionType: "university", ownershipType: "state", state: "Lagos", city: "Ijanikin", logo: "🌾", ranking: 89, tuition: "₦128,232/yr", acceptanceRate: 27, studentPopulation: 13144, tags: ['NUC', 'State', 'University'], coordinates: [7.9728, 10.3448] },
  { name: "Lagos State University of Science and Technology", institutionType: "university", ownershipType: "state", state: "Lagos", city: "Ikorodu", logo: "⛰️", ranking: 90, tuition: "₦105,000/yr", acceptanceRate: 36, studentPopulation: 13657, tags: ['NUC', 'State', 'University'], coordinates: [8.0259, 10.3919] },
  { name: "Nasarawa State University", institutionType: "university", ownershipType: "state", state: "Nasarawa", city: "Keffi", logo: "🏗️", ranking: 91, tuition: "₦132,510/yr", acceptanceRate: 15, studentPopulation: 14170, tags: ['NUC', 'State', 'University'], coordinates: [8.079, 10.439] },
  { name: "Niger Delta University", institutionType: "university", ownershipType: "state", state: "Bayelsa", city: "Amassoma", logo: "🏜️", ranking: 92, tuition: "₦134,649/yr", acceptanceRate: 24, studentPopulation: 14683, tags: ['NUC', 'State', 'University'], coordinates: [8.1321, 10.4861] },
  { name: "Olabisi Onabanjo University", institutionType: "university", ownershipType: "state", state: "Ogun", city: "Ago-Iwoye", logo: "🍂", ranking: 93, tuition: "₦136,788/yr", acceptanceRate: 33, studentPopulation: 15196, tags: ['NUC', 'State', 'University'], coordinates: [8.1852, 10.5332] },
  { name: "Olusegun Agagu University of Science and Technology", institutionType: "university", ownershipType: "state", state: "Ondo", city: "Okitipupa", logo: "💧", ranking: 94, tuition: "₦138,927/yr", acceptanceRate: 42, studentPopulation: 15709, tags: ['NUC', 'State', 'University'], coordinates: [8.2383, 10.5803] },
  { name: "Osun State University", institutionType: "university", ownershipType: "state", state: "Osun", city: "Osogbo", logo: "🌇", ranking: 95, tuition: "₦141,066/yr", acceptanceRate: 21, studentPopulation: 16222, tags: ['NUC', 'State', 'University'], coordinates: [8.2914, 10.6274] },
  { name: "Plateau State University", institutionType: "university", ownershipType: "state", state: "Plateau", city: "Bokkos", logo: "⛪", ranking: 96, tuition: "₦143,205/yr", acceptanceRate: 30, studentPopulation: 16735, tags: ['NUC', 'State', 'University'], coordinates: [8.3445, 10.6745] },
  { name: "Rivers State University", institutionType: "university", ownershipType: "state", state: "Rivers", city: "Port Harcourt", logo: "🚜", ranking: 97, tuition: "₦145,344/yr", acceptanceRate: 39, studentPopulation: 17248, tags: ['NUC', 'State', 'University'], coordinates: [8.3976, 10.7216] },
  { name: "Sule Lamido University", institutionType: "university", ownershipType: "state", state: "Jigawa", city: "Kafin-Hausa", logo: "🏥", ranking: 98, tuition: "₦147,483/yr", acceptanceRate: 18, studentPopulation: 17761, tags: ['NUC', 'State', 'University'], coordinates: [8.4507, 10.7687] },
  { name: "Taraba State University", institutionType: "university", ownershipType: "state", state: "Taraba", city: "Jalingo", logo: "🏢", ranking: 99, tuition: "₦149,622/yr", acceptanceRate: 27, studentPopulation: 18274, tags: ['NUC', 'State', 'University'], coordinates: [3.3038, 10.8158] },
  { name: "Umaru Musa Yar'adua University", institutionType: "university", ownershipType: "state", state: "Katsina", city: "Katsina", logo: "🌊", ranking: 100, tuition: "₦151,761/yr", acceptanceRate: 36, studentPopulation: 18787, tags: ['NUC', 'State', 'University'], coordinates: [3.3569, 10.8629] },
  { name: "University of Cross River State", institutionType: "university", ownershipType: "state", state: "Cross River", city: "Calabar", logo: "🎓", ranking: 101, tuition: "₦153,900/yr", acceptanceRate: 15, studentPopulation: 19300, tags: ['NUC', 'State', 'University'], coordinates: [3.41, 10.91] },
  { name: "Sokoto State University", institutionType: "university", ownershipType: "state", state: "Sokoto", city: "Sokoto", logo: "🏛️", ranking: 102, tuition: "₦156,039/yr", acceptanceRate: 24, studentPopulation: 19813, tags: ['NUC', 'State', 'University'], coordinates: [3.4631, 10.9571] },
  { name: "University of Delta", institutionType: "university", ownershipType: "state", state: "Delta", city: "Agbor", logo: "⚙️", ranking: 103, tuition: "₦158,178/yr", acceptanceRate: 33, studentPopulation: 20326, tags: ['NUC', 'State', 'University'], coordinates: [3.5162, 11.0042] },
  { name: "Yobe State University", institutionType: "university", ownershipType: "state", state: "Yobe", city: "Damaturu", logo: "📚", ranking: 104, tuition: "₦160,317/yr", acceptanceRate: 42, studentPopulation: 20839, tags: ['NUC', 'State', 'University'], coordinates: [3.5693, 11.0513] },
  { name: "Yusuf Maitama Sule University Kano", institutionType: "university", ownershipType: "state", state: "Kano", city: "Kano", logo: "⚡", ranking: 105, tuition: "₦162,456/yr", acceptanceRate: 21, studentPopulation: 21352, tags: ['NUC', 'State', 'University'], coordinates: [3.6224, 11.0984] },
  { name: "Zamfara State University", institutionType: "university", ownershipType: "state", state: "Zamfara", city: "Talata Mafara", logo: "🏫", ranking: 106, tuition: "₦164,595/yr", acceptanceRate: 30, studentPopulation: 21865, tags: ['NUC', 'State', 'University'], coordinates: [3.6755, 11.1455] },
  { name: "Achievers University", institutionType: "university", ownershipType: "private", state: "Ondo", city: "Owo", logo: "🦅", ranking: 107, tuition: "₦766,310/yr", acceptanceRate: 31, studentPopulation: 10214, tags: ['NUC', 'University', 'Private'], coordinates: [3.7286, 11.1926] },
  { name: "Adeleke University", institutionType: "university", ownershipType: "private", state: "Osun", city: "Ede", logo: "💡", ranking: 108, tuition: "₦783,445/yr", acceptanceRate: 42, studentPopulation: 10433, tags: ['NUC', 'University', 'Private'], coordinates: [3.7817, 11.2397] },
  { name: "Afe Babalola University", institutionType: "university", ownershipType: "private", state: "Ekiti", city: "Ado-Ekiti", logo: "🌾", ranking: 109, tuition: "₦800,580/yr", acceptanceRate: 53, studentPopulation: 10652, tags: ['NUC', 'University', 'Private'], coordinates: [3.8348, 11.2868] },
  { name: "African University of Science and Technology", institutionType: "university", ownershipType: "private", state: "FCT", city: "Abuja", logo: "⛰️", ranking: 110, tuition: "₦817,715/yr", acceptanceRate: 64, studentPopulation: 10871, tags: ['NUC', 'University', 'Private'], coordinates: [3.8879, 11.3339] },
  { name: "Ahman Pategi University", institutionType: "university", ownershipType: "private", state: "Kwara", city: "Pategi", logo: "🏗️", ranking: 111, tuition: "₦834,850/yr", acceptanceRate: 35, studentPopulation: 3090, tags: ['NUC', 'University', 'Private'], coordinates: [3.941, 11.381] },
  { name: "Ajayi Crowther University", institutionType: "university", ownershipType: "private", state: "Oyo", city: "Oyo", logo: "🏜️", ranking: 112, tuition: "₦851,985/yr", acceptanceRate: 46, studentPopulation: 3309, tags: ['NUC', 'University', 'Private'], coordinates: [3.9941, 11.4281] },
  { name: "Al-Ansar University Maiduguri", institutionType: "university", ownershipType: "private", state: "Borno", city: "Maiduguri", logo: "🍂", ranking: 113, tuition: "₦869,120/yr", acceptanceRate: 57, studentPopulation: 3528, tags: ['NUC', 'University', 'Private'], coordinates: [4.0472, 11.4752] },
  { name: "Al-Hikmah University", institutionType: "university", ownershipType: "private", state: "Kwara", city: "Ilorin", logo: "💧", ranking: 114, tuition: "₦886,255/yr", acceptanceRate: 28, studentPopulation: 3747, tags: ['NUC', 'University', 'Private'], coordinates: [4.1003, 11.5223] },
  { name: "Al-Qalam University", institutionType: "university", ownershipType: "private", state: "Katsina", city: "Katsina", logo: "🌇", ranking: 115, tuition: "₦903,390/yr", acceptanceRate: 39, studentPopulation: 3966, tags: ['NUC', 'University', 'Private'], coordinates: [4.1534, 11.5694] },
  { name: "American University of Nigeria", institutionType: "university", ownershipType: "private", state: "Adamawa", city: "Yola", logo: "⛪", ranking: 116, tuition: "₦920,525/yr", acceptanceRate: 50, studentPopulation: 4185, tags: ['NUC', 'University', 'Private'], coordinates: [4.2065, 11.6165] },
  { name: "Anchor University", institutionType: "university", ownershipType: "private", state: "Lagos", city: "Ayobo", logo: "🚜", ranking: 117, tuition: "₦937,660/yr", acceptanceRate: 61, studentPopulation: 4404, tags: ['NUC', 'University', 'Private'], coordinates: [4.2596, 11.6636] },
  { name: "Arthur Jarvis University", institutionType: "university", ownershipType: "private", state: "Cross River", city: "Akpabuyo", logo: "🏥", ranking: 118, tuition: "₦954,795/yr", acceptanceRate: 32, studentPopulation: 4623, tags: ['NUC', 'University', 'Private'], coordinates: [4.3127, 11.7107] },
  { name: "Ave Maria University", institutionType: "university", ownershipType: "private", state: "Nasarawa", city: "Piyanko", logo: "🏢", ranking: 119, tuition: "₦971,930/yr", acceptanceRate: 43, studentPopulation: 4842, tags: ['NUC', 'University', 'Private'], coordinates: [4.3658, 11.7578] },
  { name: "Babcock University", institutionType: "university", ownershipType: "private", state: "Ogun", city: "Ilishan-Remo", logo: "🌊", ranking: 120, tuition: "₦989,065/yr", acceptanceRate: 54, studentPopulation: 5061, tags: ['NUC', 'University', 'Private'], coordinates: [4.4189, 11.8049] },
  { name: "Baze University", institutionType: "university", ownershipType: "private", state: "FCT", city: "Abuja", logo: "🎓", ranking: 121, tuition: "₦1,006,200/yr", acceptanceRate: 25, studentPopulation: 5280, tags: ['NUC', 'University', 'Private'], coordinates: [4.472, 11.852] },
  { name: "Bells University of Technology", institutionType: "university", ownershipType: "private", state: "Ogun", city: "Ota", logo: "🏛️", ranking: 122, tuition: "₦1,023,335/yr", acceptanceRate: 36, studentPopulation: 5499, tags: ['NUC', 'University', 'Private'], coordinates: [4.5251, 11.8991] },
  { name: "Benson Idahosa University", institutionType: "university", ownershipType: "private", state: "Edo", city: "Benin City", logo: "⚙️", ranking: 123, tuition: "₦1,040,470/yr", acceptanceRate: 47, studentPopulation: 5718, tags: ['NUC', 'University', 'Private'], coordinates: [4.5782, 11.9462] },
  { name: "Bowen University", institutionType: "university", ownershipType: "private", state: "Osun", city: "Iwo", logo: "📚", ranking: 124, tuition: "₦1,057,605/yr", acceptanceRate: 58, studentPopulation: 5937, tags: ['NUC', 'University', 'Private'], coordinates: [4.6313, 11.9933] },
  { name: "Bingham University", institutionType: "university", ownershipType: "private", state: "Nasarawa", city: "Karu", logo: "⚡", ranking: 125, tuition: "₦1,074,740/yr", acceptanceRate: 29, studentPopulation: 6156, tags: ['NUC', 'University', 'Private'], coordinates: [4.6844, 12.0404] },
  { name: "Caleb University", institutionType: "university", ownershipType: "private", state: "Lagos", city: "Ikorodu", logo: "🏫", ranking: 126, tuition: "₦1,091,875/yr", acceptanceRate: 40, studentPopulation: 6375, tags: ['NUC', 'University', 'Private'], coordinates: [4.7375, 12.0875] },
  { name: "Caritas University", institutionType: "university", ownershipType: "private", state: "Enugu", city: "Enugu", logo: "🦅", ranking: 127, tuition: "₦1,109,010/yr", acceptanceRate: 51, studentPopulation: 6594, tags: ['NUC', 'University', 'Private'], coordinates: [4.7906, 12.1346] },
  { name: "CETEP City University", institutionType: "university", ownershipType: "private", state: "Lagos", city: "Yaba", logo: "💡", ranking: 128, tuition: "₦1,126,145/yr", acceptanceRate: 62, studentPopulation: 6813, tags: ['NUC', 'University', 'Private'], coordinates: [4.8437, 12.1817] },
  { name: "Claretian University", institutionType: "university", ownershipType: "private", state: "Imo", city: "Nekede", logo: "🌾", ranking: 129, tuition: "₦1,143,280/yr", acceptanceRate: 33, studentPopulation: 7032, tags: ['NUC', 'University', 'Private'], coordinates: [4.8968, 12.2288] },
  { name: "Chrisland University", institutionType: "university", ownershipType: "private", state: "Ogun", city: "Abeokuta", logo: "⛰️", ranking: 130, tuition: "₦1,160,415/yr", acceptanceRate: 44, studentPopulation: 7251, tags: ['NUC', 'University', 'Private'], coordinates: [4.9499, 12.2759] },
  { name: "Christopher University", institutionType: "university", ownershipType: "private", state: "Ogun", city: "Mowe", logo: "🏗️", ranking: 131, tuition: "₦1,177,550/yr", acceptanceRate: 55, studentPopulation: 7470, tags: ['NUC', 'University', 'Private'], coordinates: [5.003, 12.323] },
  { name: "Clifford University", institutionType: "university", ownershipType: "private", state: "Abia", city: "Owerrinta", logo: "🏜️", ranking: 132, tuition: "₦1,194,685/yr", acceptanceRate: 26, studentPopulation: 7689, tags: ['NUC', 'University', 'Private'], coordinates: [5.0561, 12.3701] },
  { name: "Coal City University", institutionType: "university", ownershipType: "private", state: "Enugu", city: "Enugu", logo: "🍂", ranking: 133, tuition: "₦1,211,820/yr", acceptanceRate: 37, studentPopulation: 7908, tags: ['NUC', 'University', 'Private'], coordinates: [5.1092, 12.4172] },
  { name: "Covenant University", institutionType: "university", ownershipType: "private", state: "Ogun", city: "Ota", logo: "💧", ranking: 134, tuition: "₦1,228,955/yr", acceptanceRate: 48, studentPopulation: 8127, tags: ['NUC', 'University', 'Private'], coordinates: [5.1623, 12.4643] },
  { name: "Crawford University", institutionType: "university", ownershipType: "private", state: "Ogun", city: "Igbesa", logo: "🌇", ranking: 135, tuition: "₦1,246,090/yr", acceptanceRate: 59, studentPopulation: 8346, tags: ['NUC', 'University', 'Private'], coordinates: [5.2154, 12.5114] },
  { name: "Crescent University", institutionType: "university", ownershipType: "private", state: "Ogun", city: "Abeokuta", logo: "⛪", ranking: 136, tuition: "₦1,263,225/yr", acceptanceRate: 30, studentPopulation: 8565, tags: ['NUC', 'University', 'Private'], coordinates: [5.2685, 12.5585] },
  { name: "Dominican University Ibadan", institutionType: "university", ownershipType: "private", state: "Oyo", city: "Ibadan", logo: "🚜", ranking: 137, tuition: "₦1,280,360/yr", acceptanceRate: 41, studentPopulation: 8784, tags: ['NUC', 'University', 'Private'], coordinates: [5.3216, 12.6056] },
  { name: "Edwin Clark University", institutionType: "university", ownershipType: "private", state: "Delta", city: "Kiagbodo", logo: "🏥", ranking: 138, tuition: "₦1,297,495/yr", acceptanceRate: 52, studentPopulation: 9003, tags: ['NUC', 'University', 'Private'], coordinates: [5.3747, 12.6527] },
  { name: "Elizade University", institutionType: "university", ownershipType: "private", state: "Ondo", city: "Ilara-Mokin", logo: "🏢", ranking: 139, tuition: "₦1,314,630/yr", acceptanceRate: 63, studentPopulation: 9222, tags: ['NUC', 'University', 'Private'], coordinates: [5.4278, 12.6998] },
  { name: "Evangel University, Akaeze", institutionType: "university", ownershipType: "private", state: "Ebonyi", city: "Akaeze", logo: "🌊", ranking: 140, tuition: "₦1,331,765/yr", acceptanceRate: 34, studentPopulation: 9441, tags: ['NUC', 'University', 'Private'], coordinates: [5.4809, 12.7469] },
  { name: "Fountain University", institutionType: "university", ownershipType: "private", state: "Osun", city: "Osogbo", logo: "🎓", ranking: 141, tuition: "₦1,348,900/yr", acceptanceRate: 45, studentPopulation: 9660, tags: ['NUC', 'University', 'Private'], coordinates: [5.534, 12.794] },
  { name: "Godfrey Okoye University", institutionType: "university", ownershipType: "private", state: "Enugu", city: "Enugu", logo: "🏛️", ranking: 142, tuition: "₦1,366,035/yr", acceptanceRate: 56, studentPopulation: 9879, tags: ['NUC', 'University', 'Private'], coordinates: [5.5871, 12.8411] },
  { name: "Greenfield University", institutionType: "university", ownershipType: "private", state: "Kaduna", city: "Kaduna", logo: "⚙️", ranking: 143, tuition: "₦1,383,170/yr", acceptanceRate: 27, studentPopulation: 10098, tags: ['NUC', 'University', 'Private'], coordinates: [5.6402, 12.8882] },
  { name: "Gregory University", institutionType: "university", ownershipType: "private", state: "Abia", city: "Uturu", logo: "📚", ranking: 144, tuition: "₦1,400,305/yr", acceptanceRate: 38, studentPopulation: 10317, tags: ['NUC', 'University', 'Private'], coordinates: [5.6933, 12.9353] },
  { name: "Hallmark University", institutionType: "university", ownershipType: "private", state: "Ogun", city: "Ijebu-Itele", logo: "⚡", ranking: 145, tuition: "₦1,417,440/yr", acceptanceRate: 49, studentPopulation: 10536, tags: ['NUC', 'University', 'Private'], coordinates: [5.7464, 12.9824] },
  { name: "Hezekiah University", institutionType: "university", ownershipType: "private", state: "Imo", city: "Umudi", logo: "🏫", ranking: 146, tuition: "₦1,434,575/yr", acceptanceRate: 60, studentPopulation: 10755, tags: ['NUC', 'University', 'Private'], coordinates: [5.7995, 6.2295] },
  { name: "Igbinedion University", institutionType: "university", ownershipType: "private", state: "Edo", city: "Okada", logo: "🦅", ranking: 147, tuition: "₦1,451,710/yr", acceptanceRate: 31, studentPopulation: 10974, tags: ['NUC', 'University', 'Private'], coordinates: [5.8526, 6.2766] },
  { name: "Joseph Ayo Babalola University", institutionType: "university", ownershipType: "private", state: "Osun", city: "Ikeji-Arakeji", logo: "💡", ranking: 148, tuition: "₦1,468,845/yr", acceptanceRate: 42, studentPopulation: 3193, tags: ['NUC', 'University', 'Private'], coordinates: [5.9057, 6.3237] },
  { name: "Khadija University", institutionType: "university", ownershipType: "private", state: "Jigawa", city: "Majia", logo: "🌾", ranking: 149, tuition: "₦1,485,980/yr", acceptanceRate: 53, studentPopulation: 3412, tags: ['NUC', 'University', 'Private'], coordinates: [5.9588, 6.3708] },
  { name: "Kings University", institutionType: "university", ownershipType: "private", state: "Osun", city: "Odeomu", logo: "⛰️", ranking: 150, tuition: "₦653,115/yr", acceptanceRate: 64, studentPopulation: 3631, tags: ['NUC', 'University', 'Private'], coordinates: [6.0119, 6.4179] },
  { name: "Koladaisi University", institutionType: "university", ownershipType: "private", state: "Oyo", city: "Ibadan", logo: "🏗️", ranking: 151, tuition: "₦670,250/yr", acceptanceRate: 35, studentPopulation: 3850, tags: ['NUC', 'University', 'Private'], coordinates: [6.065, 6.465] },
  { name: "Kwararafa University", institutionType: "university", ownershipType: "private", state: "Taraba", city: "Wukari", logo: "🏜️", ranking: 152, tuition: "₦687,385/yr", acceptanceRate: 46, studentPopulation: 4069, tags: ['NUC', 'University', 'Private'], coordinates: [6.1181, 6.5121] },
  { name: "Landmark University", institutionType: "university", ownershipType: "private", state: "Kwara", city: "Omu-Aran", logo: "🍂", ranking: 153, tuition: "₦704,520/yr", acceptanceRate: 57, studentPopulation: 4288, tags: ['NUC', 'University', 'Private'], coordinates: [6.1712, 6.5592] },
  { name: "Lead City University", institutionType: "university", ownershipType: "private", state: "Oyo", city: "Ibadan", logo: "💧", ranking: 154, tuition: "₦721,655/yr", acceptanceRate: 28, studentPopulation: 4507, tags: ['NUC', 'University', 'Private'], coordinates: [6.2243, 6.6063] },
  { name: "Madonna University", institutionType: "university", ownershipType: "private", state: "Rivers", city: "Elele", logo: "🌇", ranking: 155, tuition: "₦738,790/yr", acceptanceRate: 39, studentPopulation: 4726, tags: ['NUC', 'University', 'Private'], coordinates: [6.2774, 6.6534] },
  { name: "McPherson University", institutionType: "university", ownershipType: "private", state: "Ogun", city: "Seriki-Setayo", logo: "⛪", ranking: 156, tuition: "₦755,925/yr", acceptanceRate: 50, studentPopulation: 4945, tags: ['NUC', 'University', 'Private'], coordinates: [6.3305, 6.7005] },
  { name: "Mewar University", institutionType: "university", ownershipType: "private", state: "Nasarawa", city: "Masaka", logo: "🚜", ranking: 157, tuition: "₦773,060/yr", acceptanceRate: 61, studentPopulation: 5164, tags: ['NUC', 'University', 'Private'], coordinates: [6.3836, 6.7476] },
  { name: "Michael and Cecilia Ibru University", institutionType: "university", ownershipType: "private", state: "Delta", city: "Agbara-Otor", logo: "🏥", ranking: 158, tuition: "₦790,195/yr", acceptanceRate: 32, studentPopulation: 5383, tags: ['NUC', 'University', 'Private'], coordinates: [6.4367, 6.7947] },
  { name: "Mountain Top University", institutionType: "university", ownershipType: "private", state: "Ogun", city: "Makogi Oba", logo: "🏢", ranking: 159, tuition: "₦807,330/yr", acceptanceRate: 43, studentPopulation: 5602, tags: ['NUC', 'University', 'Private'], coordinates: [6.4898, 6.8418] },
  { name: "Mudiame University", institutionType: "university", ownershipType: "private", state: "Edo", city: "Irrua", logo: "🌊", ranking: 160, tuition: "₦824,465/yr", acceptanceRate: 54, studentPopulation: 5821, tags: ['NUC', 'University', 'Private'], coordinates: [6.5429, 6.8889] },
  { name: "Nigerian University of Technology and Management", institutionType: "university", ownershipType: "private", state: "Lagos", city: "Apapa", logo: "🎓", ranking: 161, tuition: "₦841,600/yr", acceptanceRate: 25, studentPopulation: 6040, tags: ['NUC', 'University', 'Private'], coordinates: [6.596, 6.936] },
  { name: "Nile University of Nigeria", institutionType: "university", ownershipType: "private", state: "FCT", city: "Abuja", logo: "🏛️", ranking: 162, tuition: "₦858,735/yr", acceptanceRate: 36, studentPopulation: 6259, tags: ['NUC', 'University', 'Private'], coordinates: [6.6491, 6.9831] },
  { name: "Nok University Kachia", institutionType: "university", ownershipType: "private", state: "Kaduna", city: "Kachia", logo: "⚙️", ranking: 163, tuition: "₦875,870/yr", acceptanceRate: 47, studentPopulation: 6478, tags: ['NUC', 'University', 'Private'], coordinates: [6.7022, 7.0302] },
  { name: "Novena University", institutionType: "university", ownershipType: "private", state: "Delta", city: "Ogume", logo: "📚", ranking: 164, tuition: "₦893,005/yr", acceptanceRate: 58, studentPopulation: 6697, tags: ['NUC', 'University', 'Private'], coordinates: [6.7553, 7.0773] },
  { name: "Obong University", institutionType: "university", ownershipType: "private", state: "Akwa Ibom", city: "Obong Ntak", logo: "⚡", ranking: 165, tuition: "₦910,140/yr", acceptanceRate: 29, studentPopulation: 6916, tags: ['NUC', 'University', 'Private'], coordinates: [6.8084, 7.1244] },
  { name: "Oduduwa University", institutionType: "university", ownershipType: "private", state: "Osun", city: "Ipetumodu", logo: "🏫", ranking: 166, tuition: "₦927,275/yr", acceptanceRate: 40, studentPopulation: 7135, tags: ['NUC', 'University', 'Private'], coordinates: [6.8615, 7.1715] },
  { name: "PAMO University of Medical Sciences", institutionType: "university", ownershipType: "private", state: "Rivers", city: "Port Harcourt", logo: "🦅", ranking: 167, tuition: "₦944,410/yr", acceptanceRate: 51, studentPopulation: 7354, tags: ['NUC', 'University', 'Private'], coordinates: [6.9146, 7.2186] },
  { name: "Pan-Atlantic University", institutionType: "university", ownershipType: "private", state: "Lagos", city: "Lekki", logo: "💡", ranking: 168, tuition: "₦961,545/yr", acceptanceRate: 62, studentPopulation: 7573, tags: ['NUC', 'University', 'Private'], coordinates: [6.9677, 7.2657] },
  { name: "Paul University", institutionType: "university", ownershipType: "private", state: "Anambra", city: "Awka", logo: "🌾", ranking: 169, tuition: "₦978,680/yr", acceptanceRate: 33, studentPopulation: 7792, tags: ['NUC', 'University', 'Private'], coordinates: [7.0208, 7.3128] },
  { name: "Peaceland University", institutionType: "university", ownershipType: "private", state: "Enugu", city: "Enugu", logo: "⛰️", ranking: 170, tuition: "₦995,815/yr", acceptanceRate: 44, studentPopulation: 8011, tags: ['NUC', 'University', 'Private'], coordinates: [7.0739, 7.3599] },
  { name: "Precious Cornerstone University", institutionType: "university", ownershipType: "private", state: "Oyo", city: "Ibadan", logo: "🏗️", ranking: 171, tuition: "₦1,012,950/yr", acceptanceRate: 55, studentPopulation: 8230, tags: ['NUC', 'University', 'Private'], coordinates: [7.127, 7.407] },
  { name: "Redeemer's University Nigeria", institutionType: "university", ownershipType: "private", state: "Osun", city: "Ede", logo: "🏜️", ranking: 172, tuition: "₦1,030,085/yr", acceptanceRate: 26, studentPopulation: 8449, tags: ['NUC', 'University', 'Private'], coordinates: [7.1801, 7.4541] },
  { name: "Renaissance University", institutionType: "university", ownershipType: "private", state: "Enugu", city: "Ugbawka", logo: "🍂", ranking: 173, tuition: "₦1,047,220/yr", acceptanceRate: 37, studentPopulation: 8668, tags: ['NUC', 'University', 'Private'], coordinates: [7.2332, 7.5012] },
  { name: "Rhema University", institutionType: "university", ownershipType: "private", state: "Abia", city: "Aba", logo: "💧", ranking: 174, tuition: "₦1,064,355/yr", acceptanceRate: 48, studentPopulation: 8887, tags: ['NUC', 'University', 'Private'], coordinates: [7.2863, 7.5483] },
  { name: "Ritman University", institutionType: "university", ownershipType: "private", state: "Akwa Ibom", city: "Ikot Ekpene", logo: "🌇", ranking: 175, tuition: "₦1,081,490/yr", acceptanceRate: 59, studentPopulation: 9106, tags: ['NUC', 'University', 'Private'], coordinates: [7.3394, 7.5954] },
  { name: "Salem University", institutionType: "university", ownershipType: "private", state: "Kogi", city: "Lokoja", logo: "⛪", ranking: 176, tuition: "₦1,098,625/yr", acceptanceRate: 30, studentPopulation: 9325, tags: ['NUC', 'University', 'Private'], coordinates: [7.3925, 7.6425] },
  { name: "Sam Maris University", institutionType: "university", ownershipType: "private", state: "Ondo", city: "Supare", logo: "🚜", ranking: 177, tuition: "₦1,115,760/yr", acceptanceRate: 41, studentPopulation: 9544, tags: ['NUC', 'University', 'Private'], coordinates: [7.4456, 7.6896] },
  { name: "Samuel Adegboyega University", institutionType: "university", ownershipType: "private", state: "Edo", city: "Ogwa", logo: "🏥", ranking: 178, tuition: "₦1,132,895/yr", acceptanceRate: 52, studentPopulation: 9763, tags: ['NUC', 'University', 'Private'], coordinates: [7.4987, 7.7367] },
  { name: "Skyline University", institutionType: "university", ownershipType: "private", state: "Kano", city: "Kano", logo: "🏢", ranking: 179, tuition: "₦1,150,030/yr", acceptanceRate: 63, studentPopulation: 9982, tags: ['NUC', 'University', 'Private'], coordinates: [7.5518, 7.7838] },
  { name: "Summit University", institutionType: "university", ownershipType: "private", state: "Kwara", city: "Offa", logo: "🌊", ranking: 180, tuition: "₦1,167,165/yr", acceptanceRate: 34, studentPopulation: 10201, tags: ['NUC', 'University', 'Private'], coordinates: [7.6049, 7.8309] },
  { name: "Veritas University", institutionType: "university", ownershipType: "private", state: "FCT", city: "Bwari", logo: "🎓", ranking: 181, tuition: "₦1,184,300/yr", acceptanceRate: 45, studentPopulation: 10420, tags: ['NUC', 'University', 'Private'], coordinates: [7.658, 7.878] },
  { name: "Wesley University", institutionType: "university", ownershipType: "private", state: "Ondo", city: "Ondo", logo: "🏛️", ranking: 182, tuition: "₦1,201,435/yr", acceptanceRate: 56, studentPopulation: 10639, tags: ['NUC', 'University', 'Private'], coordinates: [7.7111, 7.9251] },
  { name: "Western Delta University", institutionType: "university", ownershipType: "private", state: "Delta", city: "Oghara", logo: "⚙️", ranking: 183, tuition: "₦1,218,570/yr", acceptanceRate: 27, studentPopulation: 10858, tags: ['NUC', 'University', 'Private'], coordinates: [7.7642, 7.9722] },
  { name: "Westland University", institutionType: "university", ownershipType: "private", state: "Osun", city: "Iwo", logo: "📚", ranking: 184, tuition: "₦1,235,705/yr", acceptanceRate: 38, studentPopulation: 3077, tags: ['NUC', 'University', 'Private'], coordinates: [7.8173, 8.0193] },
  { name: "University of Mkar", institutionType: "university", ownershipType: "private", state: "Benue", city: "Mkar", logo: "⚡", ranking: 185, tuition: "₦1,252,840/yr", acceptanceRate: 49, studentPopulation: 3296, tags: ['NUC', 'University', 'Private'], coordinates: [7.8704, 8.0664] },
  { name: "James Hope University, Lagos", institutionType: "university", ownershipType: "private", state: "Lagos", city: "Lekki", logo: "🏫", ranking: 186, tuition: "₦1,269,975/yr", acceptanceRate: 60, studentPopulation: 3515, tags: ['NUC', 'University', 'Private'], coordinates: [7.9235, 8.1135] },
  { name: "Legacy University Okija", institutionType: "university", ownershipType: "private", state: "Anambra", city: "Okija", logo: "🦅", ranking: 187, tuition: "₦1,287,110/yr", acceptanceRate: 31, studentPopulation: 3734, tags: ['NUC', 'University', 'Private'], coordinates: [7.9766, 8.1606] },
  { name: "Air Force Institute of Technology", institutionType: "polytechnic", ownershipType: "federal", state: "Kaduna", city: "Airforce Base, Kaduna", logo: "💡", ranking: 188, tuition: "₦84,097/yr", acceptanceRate: 19, studentPopulation: 28193, tags: ['Polytechnic', 'Federal', 'NBTE'], coordinates: [8.0297, 8.2077] },
  { name: "Akanu Ibiam Federal Polytechnic", institutionType: "polytechnic", ownershipType: "federal", state: "Ebonyi", city: "Unwana", logo: "🌾", ranking: 189, tuition: "₦85,028/yr", acceptanceRate: 26, studentPopulation: 28932, tags: ['Polytechnic', 'Federal', 'NBTE'], coordinates: [8.0828, 8.2548] },
  { name: "Auchi Polytechnic", institutionType: "polytechnic", ownershipType: "federal", state: "Edo", city: "Auchi", logo: "⛰️", ranking: 190, tuition: "₦85,959/yr", acceptanceRate: 33, studentPopulation: 29671, tags: ['Polytechnic', 'Federal', 'NBTE'], coordinates: [8.1359, 8.3019] },
  { name: "Federal Polytechnic Ekowe", institutionType: "polytechnic", ownershipType: "federal", state: "Bayelsa", city: "Ekowe", logo: "🏗️", ranking: 191, tuition: "₦86,890/yr", acceptanceRate: 15, studentPopulation: 30410, tags: ['Polytechnic', 'Federal', 'NBTE'], coordinates: [8.189, 8.349] },
  { name: "Federal Polytechnic Idah", institutionType: "polytechnic", ownershipType: "federal", state: "Kogi", city: "Idah", logo: "🏜️", ranking: 192, tuition: "₦87,821/yr", acceptanceRate: 22, studentPopulation: 31149, tags: ['Polytechnic', 'Federal', 'NBTE'], coordinates: [8.2421, 8.3961] },
  { name: "Federal Polytechnic Ile-Oluji", institutionType: "polytechnic", ownershipType: "federal", state: "Ondo", city: "Ile Oluji", logo: "🍂", ranking: 193, tuition: "₦88,752/yr", acceptanceRate: 29, studentPopulation: 31888, tags: ['Polytechnic', 'Federal', 'NBTE'], coordinates: [8.2952, 8.4432] },
  { name: "Federal Polytechnic Kabo", institutionType: "polytechnic", ownershipType: "federal", state: "Kano", city: "Kabo", logo: "💧", ranking: 194, tuition: "₦89,683/yr", acceptanceRate: 11, studentPopulation: 32627, tags: ['Polytechnic', 'Federal', 'NBTE'], coordinates: [8.3483, 8.4903] },
  { name: "Federal Polytechnic Kaltungo", institutionType: "polytechnic", ownershipType: "federal", state: "Gombe", city: "Kaltungo", logo: "🌇", ranking: 195, tuition: "₦45,614/yr", acceptanceRate: 18, studentPopulation: 33366, tags: ['Polytechnic', 'Federal', 'NBTE'], coordinates: [8.4014, 8.5374] },
  { name: "Federal Polytechnic Kaura-Namoda", institutionType: "polytechnic", ownershipType: "federal", state: "Zamfara", city: "Kaura Namoda", logo: "⛪", ranking: 196, tuition: "₦46,545/yr", acceptanceRate: 25, studentPopulation: 34105, tags: ['Polytechnic', 'Federal', 'NBTE'], coordinates: [8.4545, 8.5845] },
  { name: "Federal Polytechnic Ngodo Isuochi", institutionType: "polytechnic", ownershipType: "federal", state: "Abia", city: "Aba North", logo: "🚜", ranking: 197, tuition: "₦47,476/yr", acceptanceRate: 32, studentPopulation: 34844, tags: ['Polytechnic', 'Federal', 'NBTE'], coordinates: [3.3076, 8.6316] },
  { name: "Federal Polytechnic of Oil and Gas Bonny", institutionType: "polytechnic", ownershipType: "federal", state: "Rivers", city: "Bonny", logo: "🏥", ranking: 198, tuition: "₦48,407/yr", acceptanceRate: 14, studentPopulation: 35583, tags: ['Polytechnic', 'Federal', 'NBTE'], coordinates: [3.3607, 8.6787] },
  { name: "Federal Polytechnic Oko", institutionType: "polytechnic", ownershipType: "federal", state: "Anambra", city: "Aguata", logo: "🏢", ranking: 199, tuition: "₦49,338/yr", acceptanceRate: 21, studentPopulation: 36322, tags: ['Polytechnic', 'Federal', 'NBTE'], coordinates: [3.4138, 8.7258] },
  { name: "Federal Polytechnic, Ado-Ekiti", institutionType: "polytechnic", ownershipType: "federal", state: "Ekiti", city: "Ado Ekiti", logo: "🌊", ranking: 200, tuition: "₦50,269/yr", acceptanceRate: 28, studentPopulation: 37061, tags: ['Polytechnic', 'Federal', 'NBTE'], coordinates: [3.4669, 8.7729] },
  { name: "Federal Polytechnic Ayede", institutionType: "polytechnic", ownershipType: "federal", state: "Oyo", city: "Ayede", logo: "🎓", ranking: 201, tuition: "₦51,200/yr", acceptanceRate: 10, studentPopulation: 37800, tags: ['Polytechnic', 'Federal', 'NBTE'], coordinates: [3.52, 8.82] },
  { name: "Federal Polytechnic Bali", institutionType: "polytechnic", ownershipType: "federal", state: "Taraba", city: "Bali", logo: "🏛️", ranking: 202, tuition: "₦52,131/yr", acceptanceRate: 17, studentPopulation: 38539, tags: ['Polytechnic', 'Federal', 'NBTE'], coordinates: [3.5731, 8.8671] },
  { name: "Federal Polytechnic, Bauchi", institutionType: "polytechnic", ownershipType: "federal", state: "Bauchi", city: "Bauchi", logo: "⚙️", ranking: 203, tuition: "₦53,062/yr", acceptanceRate: 24, studentPopulation: 39278, tags: ['Polytechnic', 'Federal', 'NBTE'], coordinates: [3.6262, 8.9142] },
  { name: "Federal Polytechnic, Bida", institutionType: "polytechnic", ownershipType: "federal", state: "Niger", city: "Bida", logo: "📚", ranking: 204, tuition: "₦53,993/yr", acceptanceRate: 31, studentPopulation: 10017, tags: ['Polytechnic', 'Federal', 'NBTE'], coordinates: [3.6793, 8.9613] },
  { name: "Federal Polytechnic Damaturu", institutionType: "polytechnic", ownershipType: "federal", state: "Yobe", city: "Damaturu", logo: "⚡", ranking: 205, tuition: "₦54,924/yr", acceptanceRate: 13, studentPopulation: 10756, tags: ['Polytechnic', 'Federal', 'NBTE'], coordinates: [3.7324, 9.0084] },
  { name: "Federal Polytechnic Daura", institutionType: "polytechnic", ownershipType: "federal", state: "Katsina", city: "Daura", logo: "🏫", ranking: 206, tuition: "₦55,855/yr", acceptanceRate: 20, studentPopulation: 11495, tags: ['Polytechnic', 'Federal', 'NBTE'], coordinates: [3.7855, 9.0555] },
  { name: "Federal Polytechnic Ede", institutionType: "polytechnic", ownershipType: "federal", state: "Osun", city: "Ede", logo: "🦅", ranking: 207, tuition: "₦56,786/yr", acceptanceRate: 27, studentPopulation: 12234, tags: ['Polytechnic', 'Federal', 'NBTE'], coordinates: [3.8386, 9.1026] },
  { name: "Federal Polytechnic, Ilaro", institutionType: "polytechnic", ownershipType: "federal", state: "Ogun", city: "Ilaro", logo: "💡", ranking: 208, tuition: "₦57,717/yr", acceptanceRate: 34, studentPopulation: 12973, tags: ['Polytechnic', 'Federal', 'NBTE'], coordinates: [3.8917, 9.1497] },
  { name: "Federal Polytechnic Monguno", institutionType: "polytechnic", ownershipType: "federal", state: "Borno", city: "Monguno", logo: "🌾", ranking: 209, tuition: "₦58,648/yr", acceptanceRate: 16, studentPopulation: 13712, tags: ['Polytechnic', 'Federal', 'NBTE'], coordinates: [3.9448, 9.1968] },
  { name: "Federal Polytechnic, Mubi", institutionType: "polytechnic", ownershipType: "federal", state: "Adamawa", city: "Mubi", logo: "⛰️", ranking: 210, tuition: "₦59,579/yr", acceptanceRate: 23, studentPopulation: 14451, tags: ['Polytechnic', 'Federal', 'NBTE'], coordinates: [3.9979, 9.2439] },
  { name: "Federal Polytechnic Nasarawa", institutionType: "polytechnic", ownershipType: "federal", state: "Nasarawa", city: "Nasarawa", logo: "🏗️", ranking: 211, tuition: "₦60,510/yr", acceptanceRate: 30, studentPopulation: 15190, tags: ['Polytechnic', 'Federal', 'NBTE'], coordinates: [4.051, 9.291] },
  { name: "Federal Polytechnic, Nekede", institutionType: "polytechnic", ownershipType: "federal", state: "Imo", city: "Nekede", logo: "🏜️", ranking: 212, tuition: "₦61,441/yr", acceptanceRate: 12, studentPopulation: 15929, tags: ['Polytechnic', 'Federal', 'NBTE'], coordinates: [4.1041, 9.3381] },
  { name: "Federal Polytechnic Nyak Shendam", institutionType: "polytechnic", ownershipType: "federal", state: "Plateau", city: "Shendam", logo: "🍂", ranking: 213, tuition: "₦62,372/yr", acceptanceRate: 19, studentPopulation: 16668, tags: ['Polytechnic', 'Federal', 'NBTE'], coordinates: [4.1572, 9.3852] },
  { name: "Federal Polytechnic, Offa", institutionType: "polytechnic", ownershipType: "federal", state: "Kwara", city: "Offa", logo: "💧", ranking: 214, tuition: "₦63,303/yr", acceptanceRate: 26, studentPopulation: 17407, tags: ['Polytechnic', 'Federal', 'NBTE'], coordinates: [4.2103, 9.4323] },
  { name: "Federal Polytechnic Ohodo", institutionType: "polytechnic", ownershipType: "federal", state: "Enugu", city: "Ohodo", logo: "🌇", ranking: 215, tuition: "₦64,234/yr", acceptanceRate: 33, studentPopulation: 18146, tags: ['Polytechnic', 'Federal', 'NBTE'], coordinates: [4.2634, 9.4794] },
  { name: "Federal Polytechnic Orogun", institutionType: "polytechnic", ownershipType: "federal", state: "Delta", city: "Orogun", logo: "⛪", ranking: 216, tuition: "₦65,165/yr", acceptanceRate: 15, studentPopulation: 18885, tags: ['Polytechnic', 'Federal', 'NBTE'], coordinates: [4.3165, 9.5265] },
  { name: "Federal Polytechnic Ugep", institutionType: "polytechnic", ownershipType: "federal", state: "Cross River", city: "Ugep", logo: "🚜", ranking: 217, tuition: "₦66,096/yr", acceptanceRate: 22, studentPopulation: 19624, tags: ['Polytechnic', 'Federal', 'NBTE'], coordinates: [4.3696, 9.5736] },
  { name: "Federal Polytechnic Ukana", institutionType: "polytechnic", ownershipType: "federal", state: "Akwa Ibom", city: "Ukana", logo: "🏥", ranking: 218, tuition: "₦67,027/yr", acceptanceRate: 29, studentPopulation: 20363, tags: ['Polytechnic', 'Federal', 'NBTE'], coordinates: [4.4227, 9.6207] },
  { name: "Federal Polytechnic Wannune", institutionType: "polytechnic", ownershipType: "federal", state: "Benue", city: "Tarka", logo: "🏢", ranking: 219, tuition: "₦67,958/yr", acceptanceRate: 11, studentPopulation: 21102, tags: ['Polytechnic', 'Federal', 'NBTE'], coordinates: [4.4758, 9.6678] },
  { name: "Hussaini Adamu Federal Polytechnic", institutionType: "polytechnic", ownershipType: "federal", state: "Jigawa", city: "Kazaure", logo: "🌊", ranking: 220, tuition: "₦68,889/yr", acceptanceRate: 18, studentPopulation: 21841, tags: ['Polytechnic', 'Federal', 'NBTE'], coordinates: [4.5289, 9.7149] },
  { name: "Kaduna Polytechnic", institutionType: "polytechnic", ownershipType: "federal", state: "Kaduna", city: "Kaduna", logo: "🎓", ranking: 221, tuition: "₦69,820/yr", acceptanceRate: 25, studentPopulation: 22580, tags: ['Polytechnic', 'Federal', 'NBTE'], coordinates: [4.582, 9.762] },
  { name: "Maritime Academy of Nigeria", institutionType: "polytechnic", ownershipType: "federal", state: "Akwa Ibom", city: "Oron", logo: "🏛️", ranking: 222, tuition: "₦70,751/yr", acceptanceRate: 32, studentPopulation: 23319, tags: ['Polytechnic', 'Federal', 'NBTE'], coordinates: [4.6351, 9.8091] },
  { name: "National Institute of Construction Technology and Management", institutionType: "polytechnic", ownershipType: "federal", state: "Edo", city: "Uromi", logo: "⚙️", ranking: 223, tuition: "₦71,682/yr", acceptanceRate: 14, studentPopulation: 24058, tags: ['Polytechnic', 'Federal', 'NBTE'], coordinates: [4.6882, 9.8562] },
  { name: "Nigerian Army College of Environmental Science and Technology", institutionType: "polytechnic", ownershipType: "federal", state: "Benue", city: "Makurdi", logo: "📚", ranking: 224, tuition: "₦72,613/yr", acceptanceRate: 21, studentPopulation: 24797, tags: ['Polytechnic', 'Federal', 'NBTE'], coordinates: [4.7413, 9.9033] },
  { name: "Nigerian College of Aviation Technology", institutionType: "polytechnic", ownershipType: "federal", state: "Kaduna", city: "Zaria", logo: "⚡", ranking: 225, tuition: "₦73,544/yr", acceptanceRate: 28, studentPopulation: 25536, tags: ['Polytechnic', 'Federal', 'NBTE'], coordinates: [4.7944, 9.9504] },
  { name: "Petroleum Training Institute", institutionType: "polytechnic", ownershipType: "federal", state: "Delta", city: "Effurun", logo: "🏫", ranking: 226, tuition: "₦74,475/yr", acceptanceRate: 10, studentPopulation: 26275, tags: ['Polytechnic', 'Federal', 'NBTE'], coordinates: [4.8475, 9.9975] },
  { name: "Waziri Umaru Federal Polytechnic", institutionType: "polytechnic", ownershipType: "federal", state: "Kebbi", city: "Birnin Kebbi", logo: "🦅", ranking: 227, tuition: "₦75,406/yr", acceptanceRate: 17, studentPopulation: 27014, tags: ['Polytechnic', 'Federal', 'NBTE'], coordinates: [4.9006, 10.0446] },
  { name: "Yaba College of Technology", institutionType: "polytechnic", ownershipType: "federal", state: "Lagos", city: "Yaba", logo: "💡", ranking: 228, tuition: "₦76,337/yr", acceptanceRate: 24, studentPopulation: 27753, tags: ['Polytechnic', 'Federal', 'NBTE'], coordinates: [4.9537, 10.0917] },
  { name: "Abdu Gusau Polytechnic", institutionType: "polytechnic", ownershipType: "state", state: "Zamfara", city: "Talata Mafara", logo: "🌾", ranking: 229, tuition: "₦92,492/yr", acceptanceRate: 27, studentPopulation: 24964, tags: ['Polytechnic', 'State', 'NBTE'], coordinates: [5.0068, 10.1388] },
  { name: "Ogbonnaya Onu Polytechnic (Abia State Polytechnic)", institutionType: "polytechnic", ownershipType: "state", state: "Abia", city: "Aba", logo: "⛰️", ranking: 230, tuition: "₦93,731/yr", acceptanceRate: 36, studentPopulation: 25477, tags: ['Polytechnic', 'State', 'NBTE'], coordinates: [5.0599, 10.1859] },
  { name: "Abraham Adesanya Polytechnic", institutionType: "polytechnic", ownershipType: "state", state: "Ogun", city: "Ijebu-Igbo", logo: "🏗️", ranking: 231, tuition: "₦94,970/yr", acceptanceRate: 15, studentPopulation: 25990, tags: ['Polytechnic', 'State', 'NBTE'], coordinates: [5.113, 10.233] },
  { name: "Abubakar Tatari Polytechnic", institutionType: "polytechnic", ownershipType: "state", state: "Bauchi", city: "Bauchi", logo: "🏜️", ranking: 232, tuition: "₦96,209/yr", acceptanceRate: 24, studentPopulation: 26503, tags: ['Polytechnic', 'State', 'NBTE'], coordinates: [5.1661, 10.2801] },
  { name: "Adamawa State Polytechnic", institutionType: "polytechnic", ownershipType: "state", state: "Adamawa", city: "Yola", logo: "🍂", ranking: 233, tuition: "₦97,448/yr", acceptanceRate: 33, studentPopulation: 27016, tags: ['Polytechnic', 'State', 'NBTE'], coordinates: [5.2192, 10.3272] },
  { name: "Adeseun Ogundoyin Polytechnic", institutionType: "polytechnic", ownershipType: "state", state: "Oyo", city: "Eruwa", logo: "💧", ranking: 234, tuition: "₦98,687/yr", acceptanceRate: 42, studentPopulation: 27529, tags: ['Polytechnic', 'State', 'NBTE'], coordinates: [5.2723, 10.3743] },
  { name: "Akawe Torkula Polytechnic", institutionType: "polytechnic", ownershipType: "state", state: "Benue", city: "Makurdi", logo: "🌇", ranking: 235, tuition: "₦99,926/yr", acceptanceRate: 21, studentPopulation: 8042, tags: ['Polytechnic', 'State', 'NBTE'], coordinates: [5.3254, 10.4214] },
  { name: "Akwa Ibom State College of Arts and Science", institutionType: "polytechnic", ownershipType: "state", state: "Akwa Ibom", city: "Ikono", logo: "⛪", ranking: 236, tuition: "₦101,165/yr", acceptanceRate: 30, studentPopulation: 8555, tags: ['Polytechnic', 'State', 'NBTE'], coordinates: [5.3785, 10.4685] },
  { name: "Akwa Ibom State Polytechnic", institutionType: "polytechnic", ownershipType: "state", state: "Akwa Ibom", city: "Ikot Ekpene", logo: "🚜", ranking: 237, tuition: "₦102,404/yr", acceptanceRate: 39, studentPopulation: 9068, tags: ['Polytechnic', 'State', 'NBTE'], coordinates: [5.4316, 10.5156] },
  { name: "Anambra State Polytechnic", institutionType: "polytechnic", ownershipType: "state", state: "Anambra", city: "Awka North", logo: "🏥", ranking: 238, tuition: "₦103,643/yr", acceptanceRate: 18, studentPopulation: 9581, tags: ['Polytechnic', 'State', 'NBTE'], coordinates: [5.4847, 10.5627] },
  { name: "Bayelsa State Polytechnic", institutionType: "polytechnic", ownershipType: "state", state: "Bayelsa", city: "Ekeremor", logo: "🏢", ranking: 239, tuition: "₦104,882/yr", acceptanceRate: 27, studentPopulation: 10094, tags: ['Polytechnic', 'State', 'NBTE'], coordinates: [5.5378, 10.6098] },
  { name: "Benue State Polytechnic", institutionType: "polytechnic", ownershipType: "state", state: "Benue", city: "ugbokolo", logo: "🌊", ranking: 240, tuition: "₦106,121/yr", acceptanceRate: 36, studentPopulation: 10607, tags: ['Polytechnic', 'State', 'NBTE'], coordinates: [5.5909, 10.6569] },
  { name: "Binyamu Usman Polytechnic", institutionType: "polytechnic", ownershipType: "state", state: "Jigawa", city: "Hadejia", logo: "🎓", ranking: 241, tuition: "₦107,360/yr", acceptanceRate: 15, studentPopulation: 11120, tags: ['Polytechnic', 'State', 'NBTE'], coordinates: [5.644, 10.704] },
  { name: "College of Administration, Management and Technology, Potiskum", institutionType: "polytechnic", ownershipType: "state", state: "Yobe", city: "Potiskum", logo: "🏛️", ranking: 242, tuition: "₦108,599/yr", acceptanceRate: 24, studentPopulation: 11633, tags: ['Polytechnic', 'State', 'NBTE'], coordinates: [5.6971, 10.7511] },
  { name: "College of Agriculture, Science and Technology, Gujba", institutionType: "polytechnic", ownershipType: "state", state: "Yobe", city: "Gujba", logo: "⚙️", ranking: 243, tuition: "₦109,838/yr", acceptanceRate: 33, studentPopulation: 12146, tags: ['Polytechnic', 'State', 'NBTE'], coordinates: [5.7502, 10.7982] },
  { name: "College of Agriculture, Science and Technology, Lafia", institutionType: "polytechnic", ownershipType: "state", state: "Nasarawa", city: "Lafia", logo: "📚", ranking: 244, tuition: "₦61,077/yr", acceptanceRate: 42, studentPopulation: 12659, tags: ['Polytechnic', 'State', 'NBTE'], coordinates: [5.8033, 10.8453] },
  { name: "Cross River Institute of Technology and Management", institutionType: "polytechnic", ownershipType: "state", state: "Cross River", city: "Ugep", logo: "⚡", ranking: 245, tuition: "₦62,316/yr", acceptanceRate: 21, studentPopulation: 13172, tags: ['Polytechnic', 'State', 'NBTE'], coordinates: [5.8564, 10.8924] },
  { name: "D.S Agbenro ICT Polytechnic, Itori-Ewekoro", institutionType: "polytechnic", ownershipType: "state", state: "Ogun", city: "Ewekoro", logo: "🏫", ranking: 246, tuition: "₦63,555/yr", acceptanceRate: 30, studentPopulation: 13685, tags: ['Polytechnic', 'State', 'NBTE'], coordinates: [5.9095, 10.9395] },
  { name: "Delta State Maritime Polytechnic", institutionType: "polytechnic", ownershipType: "state", state: "Delta", city: "Burutu", logo: "🦅", ranking: 247, tuition: "₦64,794/yr", acceptanceRate: 39, studentPopulation: 14198, tags: ['Polytechnic', 'State', 'NBTE'], coordinates: [5.9626, 10.9866] },
  { name: "Delta State Polytechnic, Ogwashi-Uku", institutionType: "polytechnic", ownershipType: "state", state: "Delta", city: "Aniocha South", logo: "💡", ranking: 248, tuition: "₦66,033/yr", acceptanceRate: 18, studentPopulation: 14711, tags: ['Polytechnic', 'State', 'NBTE'], coordinates: [6.0157, 11.0337] },
  { name: "Delta State Polytechnic, Otefe-Oghara", institutionType: "polytechnic", ownershipType: "state", state: "Delta", city: "Ethiope West", logo: "🌾", ranking: 249, tuition: "₦67,272/yr", acceptanceRate: 27, studentPopulation: 15224, tags: ['Polytechnic', 'State', 'NBTE'], coordinates: [6.0688, 11.0808] },
  { name: "Edo State Polytechnic Usen", institutionType: "polytechnic", ownershipType: "state", state: "Edo", city: "Ovia South West", logo: "⛰️", ranking: 250, tuition: "₦68,511/yr", acceptanceRate: 36, studentPopulation: 15737, tags: ['Polytechnic', 'State', 'NBTE'], coordinates: [6.1219, 11.1279] },
  { name: "Ekiti State College of Agriculture and Technology", institutionType: "polytechnic", ownershipType: "state", state: "Ekiti", city: "Ado-Ekiti", logo: "🏗️", ranking: 251, tuition: "₦69,750/yr", acceptanceRate: 15, studentPopulation: 16250, tags: ['Polytechnic', 'State', 'NBTE'], coordinates: [6.175, 11.175] },
  { name: "Gateway Polytechnic, Saapade", institutionType: "polytechnic", ownershipType: "state", state: "Ogun", city: "Saapade", logo: "🏜️", ranking: 252, tuition: "₦70,989/yr", acceptanceRate: 24, studentPopulation: 16763, tags: ['Polytechnic', 'State', 'NBTE'], coordinates: [6.2281, 11.2221] },
  { name: "Gombe State Polytechnic", institutionType: "polytechnic", ownershipType: "state", state: "Gombe", city: "Bajoga", logo: "🍂", ranking: 253, tuition: "₦72,228/yr", acceptanceRate: 33, studentPopulation: 17276, tags: ['Polytechnic', 'State', 'NBTE'], coordinates: [6.2812, 11.2692] },
  { name: "Hassan Usman Katsina Polytechnic", institutionType: "polytechnic", ownershipType: "state", state: "Katsina", city: "Katsina", logo: "💧", ranking: 254, tuition: "₦73,467/yr", acceptanceRate: 42, studentPopulation: 17789, tags: ['Polytechnic', 'State', 'NBTE'], coordinates: [6.3343, 11.3163] },
  { name: "Imo State Polytechnic", institutionType: "polytechnic", ownershipType: "state", state: "Imo", city: "Oru East", logo: "🌇", ranking: 255, tuition: "₦74,706/yr", acceptanceRate: 21, studentPopulation: 18302, tags: ['Polytechnic', 'State', 'NBTE'], coordinates: [6.3874, 11.3634] },
  { name: "Institute of Management and Technology, Enugu", institutionType: "polytechnic", ownershipType: "state", state: "Enugu", city: "Enugu East", logo: "⛪", ranking: 256, tuition: "₦75,945/yr", acceptanceRate: 30, studentPopulation: 18815, tags: ['Polytechnic', 'State', 'NBTE'], coordinates: [6.4405, 11.4105] },
  { name: "Isa Mustapha Agwai Polytechnic, Lafia", institutionType: "polytechnic", ownershipType: "state", state: "Nasarawa", city: "Lafia", logo: "🚜", ranking: 257, tuition: "₦77,184/yr", acceptanceRate: 39, studentPopulation: 19328, tags: ['Polytechnic', 'State', 'NBTE'], coordinates: [6.4936, 11.4576] },
  { name: "Jigawa State Polytechnic", institutionType: "polytechnic", ownershipType: "state", state: "Jigawa", city: "Dutse", logo: "🏥", ranking: 258, tuition: "₦78,423/yr", acceptanceRate: 18, studentPopulation: 19841, tags: ['Polytechnic', 'State', 'NBTE'], coordinates: [6.5467, 11.5047] },
  { name: "Kano State Polytechnic", institutionType: "polytechnic", ownershipType: "state", state: "Kano", city: "Kano", logo: "🏢", ranking: 259, tuition: "₦79,662/yr", acceptanceRate: 27, studentPopulation: 20354, tags: ['Polytechnic', 'State', 'NBTE'], coordinates: [6.5998, 11.5518] },
  { name: "Katsina Institute of Technology and Management", institutionType: "polytechnic", ownershipType: "state", state: "Katsina", city: "Katsina", logo: "🌊", ranking: 260, tuition: "₦80,901/yr", acceptanceRate: 36, studentPopulation: 20867, tags: ['Polytechnic', 'State', 'NBTE'], coordinates: [6.6529, 11.5989] },
  { name: "Kebbi State Polytechnic", institutionType: "polytechnic", ownershipType: "state", state: "Kebbi", city: "Dakingari", logo: "🎓", ranking: 261, tuition: "₦82,140/yr", acceptanceRate: 15, studentPopulation: 21380, tags: ['Polytechnic', 'State', 'NBTE'], coordinates: [6.706, 11.646] },
  { name: "Kenule Beeson Saro-Wiwa Polytechnic, Bori", institutionType: "polytechnic", ownershipType: "state", state: "Rivers", city: "Bori", logo: "🏛️", ranking: 262, tuition: "₦83,379/yr", acceptanceRate: 24, studentPopulation: 21893, tags: ['Polytechnic', 'State', 'NBTE'], coordinates: [6.7591, 11.6931] },
  { name: "Kogi State Polytechnic", institutionType: "polytechnic", ownershipType: "state", state: "Kogi", city: "Lokoja", logo: "⚙️", ranking: 263, tuition: "₦84,618/yr", acceptanceRate: 33, studentPopulation: 22406, tags: ['Polytechnic', 'State', 'NBTE'], coordinates: [6.8122, 11.7402] },
  { name: "Kwara State Polytechnic", institutionType: "polytechnic", ownershipType: "state", state: "Kwara", city: "Ilorin", logo: "📚", ranking: 264, tuition: "₦85,857/yr", acceptanceRate: 42, studentPopulation: 22919, tags: ['Polytechnic', 'State', 'NBTE'], coordinates: [6.8653, 11.7873] },
  { name: "Mai-Idris Alooma Polytechnic, Geidam", institutionType: "polytechnic", ownershipType: "state", state: "Yobe", city: "Geidam", logo: "⚡", ranking: 265, tuition: "₦87,096/yr", acceptanceRate: 21, studentPopulation: 23432, tags: ['Polytechnic', 'State', 'NBTE'], coordinates: [6.9184, 11.8344] },
  { name: "Moshood Abiola Polytechnic", institutionType: "polytechnic", ownershipType: "state", state: "Ogun", city: "Abeokuta", logo: "🏫", ranking: 266, tuition: "₦88,335/yr", acceptanceRate: 30, studentPopulation: 23945, tags: ['Polytechnic', 'State', 'NBTE'], coordinates: [6.9715, 11.8815] },
  { name: "Niger State Polytechnic", institutionType: "polytechnic", ownershipType: "state", state: "Niger", city: "Zungeru", logo: "🦅", ranking: 267, tuition: "₦89,574/yr", acceptanceRate: 39, studentPopulation: 24458, tags: ['Polytechnic', 'State', 'NBTE'], coordinates: [7.0246, 11.9286] },
  { name: "Nuhu Bamalli Polytechnic", institutionType: "polytechnic", ownershipType: "state", state: "Kaduna", city: "Zaria", logo: "💡", ranking: 268, tuition: "₦90,813/yr", acceptanceRate: 18, studentPopulation: 24971, tags: ['Polytechnic', 'State', 'NBTE'], coordinates: [7.0777, 11.9757] },
  { name: "Ogun State Institute of technology", institutionType: "polytechnic", ownershipType: "state", state: "Ogun", city: "Igbesa", logo: "🌾", ranking: 269, tuition: "₦92,052/yr", acceptanceRate: 27, studentPopulation: 25484, tags: ['Polytechnic', 'State', 'NBTE'], coordinates: [7.1308, 12.0228] },
  { name: "Osun State College of Technology", institutionType: "polytechnic", ownershipType: "state", state: "Osun", city: "Esa-Oke", logo: "⛰️", ranking: 270, tuition: "₦93,291/yr", acceptanceRate: 36, studentPopulation: 25997, tags: ['Polytechnic', 'State', 'NBTE'], coordinates: [7.1839, 12.0699] },
  { name: "Osun State Polytechnic", institutionType: "polytechnic", ownershipType: "state", state: "Osun", city: "Iree", logo: "🏗️", ranking: 271, tuition: "₦94,530/yr", acceptanceRate: 15, studentPopulation: 26510, tags: ['Polytechnic', 'State', 'NBTE'], coordinates: [7.237, 12.117] },
  { name: "Oyo State College of Agriculture and Technology", institutionType: "polytechnic", ownershipType: "state", state: "Oyo", city: "Igboora", logo: "🏜️", ranking: 272, tuition: "₦95,769/yr", acceptanceRate: 24, studentPopulation: 27023, tags: ['Polytechnic', 'State', 'NBTE'], coordinates: [7.2901, 12.1641] },
  { name: "Plateau State Polytechnic", institutionType: "polytechnic", ownershipType: "state", state: "Plateau", city: "Barkin-Ladi", logo: "🍂", ranking: 273, tuition: "₦97,008/yr", acceptanceRate: 33, studentPopulation: 27536, tags: ['Polytechnic', 'State', 'NBTE'], coordinates: [7.3432, 12.2112] },
  { name: "Captain Elechi Amadi Polytechnic", institutionType: "polytechnic", ownershipType: "state", state: "Rivers", city: "Port-Harcourt", logo: "💧", ranking: 274, tuition: "₦98,247/yr", acceptanceRate: 42, studentPopulation: 8049, tags: ['Polytechnic', 'State', 'NBTE'], coordinates: [7.3963, 12.2583] },
  { name: "Ramat Polytechnic", institutionType: "polytechnic", ownershipType: "state", state: "Borno", city: "Maiduguri", logo: "🌇", ranking: 275, tuition: "₦99,486/yr", acceptanceRate: 21, studentPopulation: 8562, tags: ['Polytechnic', 'State', 'NBTE'], coordinates: [7.4494, 12.3054] },
  { name: "Rufus Giwa Polytechnic", institutionType: "polytechnic", ownershipType: "state", state: "Ondo", city: "Owo", logo: "⛪", ranking: 276, tuition: "₦100,725/yr", acceptanceRate: 30, studentPopulation: 9075, tags: ['Polytechnic', 'State', 'NBTE'], coordinates: [7.5025, 12.3525] },
  { name: "Taraba State Polytechnic", institutionType: "polytechnic", ownershipType: "state", state: "Taraba", city: "Suntai", logo: "🚜", ranking: 277, tuition: "₦101,964/yr", acceptanceRate: 39, studentPopulation: 9588, tags: ['Polytechnic', 'State', 'NBTE'], coordinates: [7.5556, 12.3996] },
  { name: "The Oke-Ogun Polytechnic", institutionType: "polytechnic", ownershipType: "state", state: "Oyo", city: "Saki", logo: "🏥", ranking: 278, tuition: "₦103,203/yr", acceptanceRate: 18, studentPopulation: 10101, tags: ['Polytechnic', 'State', 'NBTE'], coordinates: [7.6087, 12.4467] },
  { name: "The Polytechnic Ibadan", institutionType: "polytechnic", ownershipType: "state", state: "Oyo", city: "Ibadan", logo: "🏢", ranking: 279, tuition: "₦104,442/yr", acceptanceRate: 27, studentPopulation: 10614, tags: ['Polytechnic', 'State', 'NBTE'], coordinates: [7.6618, 12.4938] },
  { name: "The Polytechnic Iresi", institutionType: "polytechnic", ownershipType: "state", state: "Osun", city: "Iresi", logo: "🌊", ranking: 280, tuition: "₦105,681/yr", acceptanceRate: 36, studentPopulation: 11127, tags: ['Polytechnic', 'State', 'NBTE'], coordinates: [7.7149, 12.5409] },
  { name: "Umaru Ali Shinkafi Polytechnic", institutionType: "polytechnic", ownershipType: "state", state: "Sokoto", city: "Wamako", logo: "🎓", ranking: 281, tuition: "₦106,920/yr", acceptanceRate: 15, studentPopulation: 11640, tags: ['Polytechnic', 'State', 'NBTE'], coordinates: [7.768, 12.588] },
  { name: "Ajayi Polytechnic", institutionType: "polytechnic", ownershipType: "private", state: "Ekiti", city: "Ikere", logo: "🏛️", ranking: 282, tuition: "₦378,935/yr", acceptanceRate: 36, studentPopulation: 8539, tags: ['Polytechnic', 'NBTE', 'Private'], coordinates: [7.8211, 12.6351] },
  { name: "Al-Hikmah", institutionType: "polytechnic", ownershipType: "private", state: "Nasarawa", city: "Karu", logo: "⚙️", ranking: 283, tuition: "₦390,070/yr", acceptanceRate: 47, studentPopulation: 8758, tags: ['Polytechnic', 'NBTE', 'Private'], coordinates: [7.8742, 12.6822] },
  { name: "Allover Central Polytechnic", institutionType: "polytechnic", ownershipType: "private", state: "Ogun", city: "Sango-Ota", logo: "📚", ranking: 284, tuition: "₦401,205/yr", acceptanceRate: 58, studentPopulation: 8977, tags: ['Polytechnic', 'NBTE', 'Private'], coordinates: [7.9273, 12.7293] },
  { name: "American Polytechnic", institutionType: "polytechnic", ownershipType: "private", state: "Oyo", city: "Wasimi", logo: "⚡", ranking: 285, tuition: "₦412,340/yr", acceptanceRate: 29, studentPopulation: 9196, tags: ['Polytechnic', 'NBTE', 'Private'], coordinates: [7.9804, 12.7764] },
  { name: "Ashi Polytechnic", institutionType: "polytechnic", ownershipType: "private", state: "Benue", city: "Anyin", logo: "🏫", ranking: 286, tuition: "₦423,475/yr", acceptanceRate: 40, studentPopulation: 9415, tags: ['Polytechnic', 'NBTE', 'Private'], coordinates: [8.0335, 12.8235] },
  { name: "Bellarks Polytechnic", institutionType: "polytechnic", ownershipType: "private", state: "Benue", city: "Kwale", logo: "🦅", ranking: 287, tuition: "₦434,610/yr", acceptanceRate: 51, studentPopulation: 9634, tags: ['Polytechnic', 'NBTE', 'Private'], coordinates: [8.0866, 12.8706] },
  { name: "Best Solution Polytechnic", institutionType: "polytechnic", ownershipType: "private", state: "Ondo", city: "Akure", logo: "💡", ranking: 288, tuition: "₦445,745/yr", acceptanceRate: 62, studentPopulation: 9853, tags: ['Polytechnic', 'NBTE', 'Private'], coordinates: [8.1397, 12.9177] },
  { name: "Bolmor Polytechnic", institutionType: "polytechnic", ownershipType: "private", state: "Oyo", city: "Ibadan", logo: "🌾", ranking: 289, tuition: "₦456,880/yr", acceptanceRate: 33, studentPopulation: 10072, tags: ['Polytechnic', 'NBTE', 'Private'], coordinates: [8.1928, 12.9648] },
  { name: "Brainfill Polytechnic", institutionType: "polytechnic", ownershipType: "private", state: "Akwa Ibom", city: "Ikot-Ekpene", logo: "⛰️", ranking: 290, tuition: "₦468,015/yr", acceptanceRate: 44, studentPopulation: 10291, tags: ['Polytechnic', 'NBTE', 'Private'], coordinates: [8.2459, 6.2119] },
  { name: "British Transatlantic Polytechnic", institutionType: "polytechnic", ownershipType: "private", state: "Ondo", city: "Akure", logo: "🏗️", ranking: 291, tuition: "₦479,150/yr", acceptanceRate: 55, studentPopulation: 10510, tags: ['Polytechnic', 'NBTE', 'Private'], coordinates: [8.299, 6.259] },
  { name: "Calvary Polytechnic", institutionType: "polytechnic", ownershipType: "private", state: "Delta", city: "Ika North East", logo: "🏜️", ranking: 292, tuition: "₦490,285/yr", acceptanceRate: 26, studentPopulation: 10729, tags: ['Polytechnic', 'NBTE', 'Private'], coordinates: [8.3521, 6.3061] },
  { name: "Citi Polytechnic", institutionType: "polytechnic", ownershipType: "private", state: "FCT", city: "Bwari", logo: "🍂", ranking: 293, tuition: "₦501,420/yr", acceptanceRate: 37, studentPopulation: 10948, tags: ['Polytechnic', 'NBTE', 'Private'], coordinates: [8.4052, 6.3532] },
  { name: "Coastal Polytechnic", institutionType: "polytechnic", ownershipType: "private", state: "Lagos", city: "Badagry", logo: "💧", ranking: 294, tuition: "₦512,555/yr", acceptanceRate: 48, studentPopulation: 3167, tags: ['Polytechnic', 'NBTE', 'Private'], coordinates: [8.4583, 6.4003] },
  { name: "Covenant Polytechnic", institutionType: "polytechnic", ownershipType: "private", state: "Abia", city: "Aba", logo: "🌇", ranking: 295, tuition: "₦523,690/yr", acceptanceRate: 59, studentPopulation: 3386, tags: ['Polytechnic', 'NBTE', 'Private'], coordinates: [3.3114, 6.4474] },
  { name: "Crown Polytechnic", institutionType: "polytechnic", ownershipType: "private", state: "Ekiti", city: "Ado-Ekiti", logo: "⛪", ranking: 296, tuition: "₦534,825/yr", acceptanceRate: 30, studentPopulation: 3605, tags: ['Polytechnic', 'NBTE', 'Private'], coordinates: [3.3645, 6.4945] },
  { name: "Daboss Polytechnic", institutionType: "polytechnic", ownershipType: "private", state: "Osun", city: "Idominasi", logo: "🚜", ranking: 297, tuition: "₦545,960/yr", acceptanceRate: 41, studentPopulation: 3824, tags: ['Polytechnic', 'NBTE', 'Private'], coordinates: [3.4176, 6.5416] },
  { name: "Distinct Polytechnic", institutionType: "polytechnic", ownershipType: "private", state: "Osun", city: "Ekosin", logo: "🏥", ranking: 298, tuition: "₦257,095/yr", acceptanceRate: 52, studentPopulation: 4043, tags: ['Polytechnic', 'NBTE', 'Private'], coordinates: [3.4707, 6.5887] },
  { name: "Dorben Polytechnic", institutionType: "polytechnic", ownershipType: "private", state: "FCT", city: "Bwari", logo: "🏢", ranking: 299, tuition: "₦268,230/yr", acceptanceRate: 63, studentPopulation: 4262, tags: ['Polytechnic', 'NBTE', 'Private'], coordinates: [3.5238, 6.6358] },
  { name: "Eastern Polytechnic", institutionType: "polytechnic", ownershipType: "private", state: "Rivers", city: "Port-Harcourt", logo: "🌊", ranking: 300, tuition: "₦279,365/yr", acceptanceRate: 34, studentPopulation: 4481, tags: ['Polytechnic', 'NBTE', 'Private'], coordinates: [3.5769, 6.6829] },
  { name: "Edward Olaseni Polytechnic", institutionType: "polytechnic", ownershipType: "private", state: "Ondo", city: "Akoko", logo: "🎓", ranking: 301, tuition: "₦290,500/yr", acceptanceRate: 45, studentPopulation: 4700, tags: ['Polytechnic', 'NBTE', 'Private'], coordinates: [3.63, 6.73] },
  { name: "Ekiti City Polytechnic", institutionType: "polytechnic", ownershipType: "private", state: "Ekiti", city: "Umuooke", logo: "🏛️", ranking: 302, tuition: "₦301,635/yr", acceptanceRate: 56, studentPopulation: 4919, tags: ['Polytechnic', 'NBTE', 'Private'], coordinates: [3.6831, 6.7771] },
  { name: "Eko College of Management and Technology(Ekocity)", institutionType: "polytechnic", ownershipType: "private", state: "Lagos", city: "Ikotun", logo: "⚙️", ranking: 303, tuition: "₦312,770/yr", acceptanceRate: 27, studentPopulation: 5138, tags: ['Polytechnic', 'NBTE', 'Private'], coordinates: [3.7362, 6.8242] },
  { name: "El-thomp Polytechnic", institutionType: "polytechnic", ownershipType: "private", state: "Akwa Ibom", city: "Abak", logo: "📚", ranking: 304, tuition: "₦323,905/yr", acceptanceRate: 38, studentPopulation: 5357, tags: ['Polytechnic', 'NBTE', 'Private'], coordinates: [3.7893, 6.8713] },
  { name: "Enville Polytechnic", institutionType: "polytechnic", ownershipType: "private", state: "Lagos", city: "Ikeja", logo: "⚡", ranking: 305, tuition: "₦335,040/yr", acceptanceRate: 49, studentPopulation: 5576, tags: ['Polytechnic', 'NBTE', 'Private'], coordinates: [3.8424, 6.9184] },
  { name: "Fidei Polytechnic", institutionType: "polytechnic", ownershipType: "private", state: "Benue", city: "Gboko", logo: "🏫", ranking: 306, tuition: "₦346,175/yr", acceptanceRate: 60, studentPopulation: 5795, tags: ['Polytechnic', 'NBTE', 'Private'], coordinates: [3.8955, 6.9655] },
  { name: "First City Polytechnic", institutionType: "polytechnic", ownershipType: "private", state: "Ogun", city: "Abeokuta", logo: "🦅", ranking: 307, tuition: "₦357,310/yr", acceptanceRate: 31, studentPopulation: 6014, tags: ['Polytechnic', 'NBTE', 'Private'], coordinates: [3.9486, 7.0126] },
  { name: "Foundation Polytechnic", institutionType: "polytechnic", ownershipType: "private", state: "Akwa Ibom", city: "Ikot-Ekpene", logo: "💡", ranking: 308, tuition: "₦368,445/yr", acceptanceRate: 42, studentPopulation: 6233, tags: ['Polytechnic', 'NBTE', 'Private'], coordinates: [4.0017, 7.0597] },
  { name: "Gboko Polytechnic", institutionType: "polytechnic", ownershipType: "private", state: "Benue", city: "Gboko", logo: "🌾", ranking: 309, tuition: "₦379,580/yr", acceptanceRate: 53, studentPopulation: 6452, tags: ['Polytechnic', 'NBTE', 'Private'], coordinates: [4.0548, 7.1068] },
  { name: "Global Polytechnic", institutionType: "polytechnic", ownershipType: "private", state: "Edo", city: "Benin", logo: "⛰️", ranking: 310, tuition: "₦390,715/yr", acceptanceRate: 64, studentPopulation: 6671, tags: ['Polytechnic', 'NBTE', 'Private'], coordinates: [4.1079, 7.1539] },
  { name: "Gloryland Polytechnic", institutionType: "polytechnic", ownershipType: "private", state: "Kogi", city: "Ankpa", logo: "🏗️", ranking: 311, tuition: "₦401,850/yr", acceptanceRate: 35, studentPopulation: 6890, tags: ['Polytechnic', 'NBTE', 'Private'], coordinates: [4.161, 7.201] },
  { name: "Gozie Anyachebelu Oragram Polytechnic", institutionType: "polytechnic", ownershipType: "private", state: "Anambra", city: "Oraukwu", logo: "🏜️", ranking: 312, tuition: "₦412,985/yr", acceptanceRate: 46, studentPopulation: 7109, tags: ['Polytechnic', 'NBTE', 'Private'], coordinates: [4.2141, 7.2481] },
  { name: "Grace Polytechnic", institutionType: "polytechnic", ownershipType: "private", state: "Lagos", city: "Surulere", logo: "🍂", ranking: 313, tuition: "₦424,120/yr", acceptanceRate: 57, studentPopulation: 7328, tags: ['Polytechnic', 'NBTE', 'Private'], coordinates: [4.2672, 7.2952] },
  { name: "Federal College of Education (Special), Oyo", institutionType: "college_of_education", ownershipType: "federal", state: "Oyo", city: "Oyo", logo: "💧", ranking: 314, tuition: "₦66,403/yr", acceptanceRate: 26, studentPopulation: 31307, tags: ['Federal', 'NCCE', 'College Of Education'], coordinates: [4.3203, 7.3423] },
  { name: "Adeyemi College of Education", institutionType: "college_of_education", ownershipType: "federal", state: "Ondo", city: "Ondo", logo: "🌇", ranking: 315, tuition: "₦67,334/yr", acceptanceRate: 33, studentPopulation: 32046, tags: ['Federal', 'NCCE', 'College Of Education'], coordinates: [4.3734, 7.3894] },
  { name: "Federal College of Education, Iwo", institutionType: "college_of_education", ownershipType: "federal", state: "Osun", city: "Iwo", logo: "⛪", ranking: 316, tuition: "₦68,265/yr", acceptanceRate: 15, studentPopulation: 32785, tags: ['Federal', 'NCCE', 'College Of Education'], coordinates: [4.4265, 7.4365] },
  { name: "Federal College of Education, Ididep", institutionType: "college_of_education", ownershipType: "federal", state: "Akwa Ibom", city: "Ididep", logo: "🚜", ranking: 317, tuition: "₦69,196/yr", acceptanceRate: 22, studentPopulation: 33524, tags: ['Federal', 'NCCE', 'College Of Education'], coordinates: [4.4796, 7.4836] },
  { name: "Federal College of Education (Technical), Asaba", institutionType: "college_of_education", ownershipType: "federal", state: "Delta", city: "Asaba", logo: "🏥", ranking: 318, tuition: "₦70,127/yr", acceptanceRate: 29, studentPopulation: 34263, tags: ['Federal', 'NCCE', 'College Of Education'], coordinates: [4.5327, 7.5307] },
  { name: "Federal College of Education, Abeokuta", institutionType: "college_of_education", ownershipType: "federal", state: "Ogun", city: "Osiele-Abeokuta", logo: "🏢", ranking: 319, tuition: "₦71,058/yr", acceptanceRate: 11, studentPopulation: 35002, tags: ['Federal', 'NCCE', 'College Of Education'], coordinates: [4.5858, 7.5778] },
  { name: "Federal College of Education, Kano", institutionType: "college_of_education", ownershipType: "federal", state: "Kano", city: "Kano City", logo: "🌊", ranking: 320, tuition: "₦71,989/yr", acceptanceRate: 18, studentPopulation: 35741, tags: ['Federal', 'NCCE', 'College Of Education'], coordinates: [4.6389, 7.6249] },
  { name: "Federal College of Education, Eha-Amufu", institutionType: "college_of_education", ownershipType: "federal", state: "Enugu", city: "Eha-Amufu", logo: "🎓", ranking: 321, tuition: "₦72,920/yr", acceptanceRate: 25, studentPopulation: 36480, tags: ['Federal', 'NCCE', 'College Of Education'], coordinates: [4.692, 7.672] },
  { name: "Federal College of Education, Okene", institutionType: "college_of_education", ownershipType: "federal", state: "Kogi", city: "Okene", logo: "🏛️", ranking: 322, tuition: "₦73,851/yr", acceptanceRate: 32, studentPopulation: 37219, tags: ['Federal', 'NCCE', 'College Of Education'], coordinates: [4.7451, 7.7191] },
  { name: "Federal College of Education (Technical), Gombe", institutionType: "college_of_education", ownershipType: "federal", state: "Gombe", city: "Gombe", logo: "⚙️", ranking: 323, tuition: "₦74,782/yr", acceptanceRate: 14, studentPopulation: 37958, tags: ['Federal', 'NCCE', 'College Of Education'], coordinates: [4.7982, 7.7662] },
  { name: "Federal College of Education (Technical), Omoku", institutionType: "college_of_education", ownershipType: "federal", state: "Rivers", city: "Omoku", logo: "📚", ranking: 324, tuition: "₦75,713/yr", acceptanceRate: 21, studentPopulation: 38697, tags: ['Federal', 'NCCE', 'College Of Education'], coordinates: [4.8513, 7.8133] },
  { name: "Federal College of Education, Kontagora", institutionType: "college_of_education", ownershipType: "federal", state: "Niger", city: "Kontagora", logo: "⚡", ranking: 325, tuition: "₦76,644/yr", acceptanceRate: 28, studentPopulation: 39436, tags: ['Federal', 'NCCE', 'College Of Education'], coordinates: [4.9044, 7.8604] },
  { name: "Federal College of Education, Zaria", institutionType: "college_of_education", ownershipType: "federal", state: "Kaduna", city: "Zaria", logo: "🏫", ranking: 326, tuition: "₦77,575/yr", acceptanceRate: 10, studentPopulation: 10175, tags: ['Federal', 'NCCE', 'College Of Education'], coordinates: [4.9575, 7.9075] },
  { name: "Federal College of Education, Pankshin", institutionType: "college_of_education", ownershipType: "federal", state: "Plateau", city: "Pankshin", logo: "🦅", ranking: 327, tuition: "₦78,506/yr", acceptanceRate: 17, studentPopulation: 10914, tags: ['Federal', 'NCCE', 'College Of Education'], coordinates: [5.0106, 7.9546] },
  { name: "Alvan Ikoku Federal College of Education", institutionType: "college_of_education", ownershipType: "federal", state: "Imo", city: "Owerri", logo: "💡", ranking: 328, tuition: "₦79,437/yr", acceptanceRate: 24, studentPopulation: 11653, tags: ['Federal', 'NCCE', 'College Of Education'], coordinates: [5.0637, 8.0017] },
  { name: "Federal College of Education, Yola", institutionType: "college_of_education", ownershipType: "federal", state: "Adamawa", city: "Yola", logo: "🌾", ranking: 329, tuition: "₦80,368/yr", acceptanceRate: 31, studentPopulation: 12392, tags: ['Federal', 'NCCE', 'College Of Education'], coordinates: [5.1168, 8.0488] },
  { name: "Federal College of Education (Technical), Potiskum", institutionType: "college_of_education", ownershipType: "federal", state: "Yobe", city: "Potiskum", logo: "⛰️", ranking: 330, tuition: "₦81,299/yr", acceptanceRate: 13, studentPopulation: 13131, tags: ['Federal', 'NCCE', 'College Of Education'], coordinates: [5.1699, 8.0959] },
  { name: "Federal College of Education (Technical), Gusau", institutionType: "college_of_education", ownershipType: "federal", state: "Zamfara", city: "Gusau", logo: "🏗️", ranking: 331, tuition: "₦82,230/yr", acceptanceRate: 20, studentPopulation: 13870, tags: ['Federal', 'NCCE', 'College Of Education'], coordinates: [5.223, 8.143] },
  { name: "Federal College of Education (Technical), Akoka", institutionType: "college_of_education", ownershipType: "federal", state: "Lagos", city: "Akoka", logo: "🏜️", ranking: 332, tuition: "₦83,161/yr", acceptanceRate: 27, studentPopulation: 14609, tags: ['Federal', 'NCCE', 'College Of Education'], coordinates: [5.2761, 8.1901] },
  { name: "Federal College of Education, Katsina", institutionType: "college_of_education", ownershipType: "federal", state: "Katsina", city: "Katsina", logo: "🍂", ranking: 333, tuition: "₦84,092/yr", acceptanceRate: 34, studentPopulation: 15348, tags: ['Federal', 'NCCE', 'College Of Education'], coordinates: [5.3292, 8.2372] },
  { name: "Federal College of Education (Technical), Bichi", institutionType: "college_of_education", ownershipType: "federal", state: "Kano", city: "Bichi", logo: "💧", ranking: 334, tuition: "₦85,023/yr", acceptanceRate: 16, studentPopulation: 16087, tags: ['Federal', 'NCCE', 'College Of Education'], coordinates: [5.3823, 8.2843] },
  { name: "Federal College of Education, Obudu", institutionType: "college_of_education", ownershipType: "federal", state: "Cross River", city: "Obudu", logo: "🌇", ranking: 335, tuition: "₦85,954/yr", acceptanceRate: 23, studentPopulation: 16826, tags: ['Federal', 'NCCE', 'College Of Education'], coordinates: [5.4354, 8.3314] },
  { name: "Federal College of Education (Technical), Umunze", institutionType: "college_of_education", ownershipType: "federal", state: "Anambra", city: "Umunze", logo: "⛪", ranking: 336, tuition: "₦86,885/yr", acceptanceRate: 30, studentPopulation: 17565, tags: ['Federal', 'NCCE', 'College Of Education'], coordinates: [5.4885, 8.3785] },
  { name: "Piaget College of Education.", institutionType: "college_of_education", ownershipType: "private", state: "Ogun", city: "Abeokuta", logo: "🚜", ranking: 337, tuition: "₦391,360/yr", acceptanceRate: 41, studentPopulation: 4584, tags: ['NCCE', 'College Of Education', 'Private'], coordinates: [5.5416, 8.4256] },
  { name: "St. Augustine College of Education", institutionType: "college_of_education", ownershipType: "private", state: "Lagos", city: "Akoka", logo: "🏥", ranking: 338, tuition: "₦402,495/yr", acceptanceRate: 52, studentPopulation: 4803, tags: ['NCCE', 'College Of Education', 'Private'], coordinates: [5.5947, 8.4727] },
  { name: "Our Saviour Institute of Science and Technology", institutionType: "college_of_education", ownershipType: "private", state: "Enugu", city: "Enugu", logo: "🏢", ranking: 339, tuition: "₦413,630/yr", acceptanceRate: 63, studentPopulation: 5022, tags: ['NCCE', 'College Of Education', 'Private'], coordinates: [5.6478, 8.5198] },
  { name: "Delar College of Education", institutionType: "college_of_education", ownershipType: "private", state: "Oyo", city: "Ibadan", logo: "🌊", ranking: 340, tuition: "₦424,765/yr", acceptanceRate: 34, studentPopulation: 5241, tags: ['NCCE', 'College Of Education', 'Private'], coordinates: [5.7009, 8.5669] },
  { name: "Yewa Central College of Education", institutionType: "college_of_education", ownershipType: "private", state: "Ogun", city: "Ayetoro", logo: "🎓", ranking: 341, tuition: "₦435,900/yr", acceptanceRate: 45, studentPopulation: 5460, tags: ['NCCE', 'College Of Education', 'Private'], coordinates: [5.754, 8.614] },
  { name: "Institute of Ecumenical Education", institutionType: "college_of_education", ownershipType: "private", state: "Enugu", city: "Enugu", logo: "🏛️", ranking: 342, tuition: "₦447,035/yr", acceptanceRate: 56, studentPopulation: 5679, tags: ['NCCE', 'College Of Education', 'Private'], coordinates: [5.8071, 8.6611] },
  { name: "Ansar-Ud-Deen College of Education", institutionType: "college_of_education", ownershipType: "private", state: "Lagos", city: "Isolo", logo: "⚙️", ranking: 343, tuition: "₦458,170/yr", acceptanceRate: 27, studentPopulation: 5898, tags: ['NCCE', 'College Of Education', 'Private'], coordinates: [5.8602, 8.7082] },
  { name: "African Thinkers Community of Inquiry College of Education.", institutionType: "college_of_education", ownershipType: "private", state: "Enugu", city: "Enugu", logo: "📚", ranking: 344, tuition: "₦469,305/yr", acceptanceRate: 38, studentPopulation: 6117, tags: ['NCCE', 'College Of Education', 'Private'], coordinates: [5.9133, 8.7553] },
  { name: "City College of Education, Mararaba", institutionType: "college_of_education", ownershipType: "private", state: "Nasarawa", city: "Mararaba Gurku", logo: "⚡", ranking: 345, tuition: "₦480,440/yr", acceptanceRate: 49, studentPopulation: 6336, tags: ['NCCE', 'College Of Education', 'Private'], coordinates: [5.9664, 8.8024] },
  { name: "Muftau Olanihun College of Education", institutionType: "college_of_education", ownershipType: "private", state: "Oyo", city: "Ibadan", logo: "🏫", ranking: 346, tuition: "₦491,575/yr", acceptanceRate: 60, studentPopulation: 6555, tags: ['NCCE', 'College Of Education', 'Private'], coordinates: [6.0195, 8.8495] },
  { name: "Havard Wilson College of Education", institutionType: "college_of_education", ownershipType: "private", state: "Abia", city: "Aba", logo: "🦅", ranking: 347, tuition: "₦502,710/yr", acceptanceRate: 31, studentPopulation: 6774, tags: ['NCCE', 'College Of Education', 'Private'], coordinates: [6.0726, 8.8966] },
  { name: "College of Education Ilemona.", institutionType: "college_of_education", ownershipType: "private", state: "Kwara", city: "Ilemona", logo: "💡", ranking: 348, tuition: "₦513,845/yr", acceptanceRate: 42, studentPopulation: 6993, tags: ['NCCE', 'College Of Education', 'Private'], coordinates: [6.1257, 8.9437] },
  { name: "Nigerian Army School of Education (NASE), Ilorin", institutionType: "college_of_education", ownershipType: "private", state: "Kwara", city: "Ilorin", logo: "🌾", ranking: 349, tuition: "₦524,980/yr", acceptanceRate: 53, studentPopulation: 7212, tags: ['NCCE', 'College Of Education', 'Private'], coordinates: [6.1788, 8.9908] },
  { name: "Nana Aishat Memorial College of Education.", institutionType: "college_of_education", ownershipType: "private", state: "Kwara", city: "Ilorin", logo: "⛰️", ranking: 350, tuition: "₦536,115/yr", acceptanceRate: 64, studentPopulation: 7431, tags: ['NCCE', 'College Of Education', 'Private'], coordinates: [6.2319, 9.0379] },
  { name: "AJETUNMOBI College of Education Irra.", institutionType: "college_of_education", ownershipType: "private", state: "Kwara", city: "IRAA", logo: "🏗️", ranking: 351, tuition: "₦547,250/yr", acceptanceRate: 35, studentPopulation: 7650, tags: ['NCCE', 'College Of Education', 'Private'], coordinates: [6.285, 9.085] },
  { name: "Abia State College of Education (Technical)", institutionType: "college_of_education", ownershipType: "state", state: "Abia", city: "Abia", logo: "🏜️", ranking: 352, tuition: "₦94,889/yr", acceptanceRate: 24, studentPopulation: 8063, tags: ['State', 'College Of Education', 'NCCE'], coordinates: [6.3381, 9.1321] },
  { name: "Adamawa State College of Education", institutionType: "college_of_education", ownershipType: "state", state: "Adamawa", city: "Adamawa", logo: "🍂", ranking: 353, tuition: "₦96,128/yr", acceptanceRate: 33, studentPopulation: 8576, tags: ['State', 'College Of Education', 'NCCE'], coordinates: [6.3912, 9.1792] },
  { name: "Adamu Augie College of Education", institutionType: "college_of_education", ownershipType: "state", state: "Kebbi", city: "Kebbi", logo: "💧", ranking: 354, tuition: "₦97,367/yr", acceptanceRate: 42, studentPopulation: 9089, tags: ['State', 'College Of Education', 'NCCE'], coordinates: [6.4443, 9.2263] },
  { name: "Adamu Tafawa Balewa College of Education", institutionType: "college_of_education", ownershipType: "state", state: "Kwara", city: "Kwara", logo: "🌇", ranking: 355, tuition: "₦98,606/yr", acceptanceRate: 21, studentPopulation: 9602, tags: ['State', 'College Of Education', 'NCCE'], coordinates: [6.4974, 9.2734] },
  { name: "Adeniran Ogunsanya College of Education", institutionType: "college_of_education", ownershipType: "state", state: "Lagos", city: "Lagos", logo: "⛪", ranking: 356, tuition: "₦99,845/yr", acceptanceRate: 30, studentPopulation: 10115, tags: ['State', 'College Of Education', 'NCCE'], coordinates: [6.5505, 9.3205] },
  { name: "A.D. Rufa'i College of Education, Legal and General Studies", institutionType: "college_of_education", ownershipType: "state", state: "Bauchi", city: "Bauchi", logo: "🚜", ranking: 357, tuition: "₦101,084/yr", acceptanceRate: 39, studentPopulation: 10628, tags: ['State', 'College Of Education', 'NCCE'], coordinates: [6.6036, 9.3676] },
  { name: "Akwa Ibom State College of Education", institutionType: "college_of_education", ownershipType: "state", state: "Akwa Ibom", city: "Akwa Ibom", logo: "🏥", ranking: 358, tuition: "₦102,323/yr", acceptanceRate: 18, studentPopulation: 11141, tags: ['State', 'College Of Education', 'NCCE'], coordinates: [6.6567, 9.4147] },
  { name: "Aminu Saleh College of Education", institutionType: "college_of_education", ownershipType: "state", state: "Bauchi", city: "Bauchi", logo: "🏢", ranking: 359, tuition: "₦103,562/yr", acceptanceRate: 27, studentPopulation: 11654, tags: ['State', 'College Of Education', 'NCCE'], coordinates: [6.7098, 9.4618] },
  { name: "Bilyaminu Othman College of Education", institutionType: "college_of_education", ownershipType: "state", state: "Jigawa", city: "Jigawa", logo: "🌊", ranking: 360, tuition: "₦104,801/yr", acceptanceRate: 36, studentPopulation: 12167, tags: ['State', 'College Of Education', 'NCCE'], coordinates: [6.7629, 9.5089] },
  { name: "College of Education and Legal Studies, Nguru", institutionType: "college_of_education", ownershipType: "state", state: "Kwara", city: "Kwara", logo: "🎓", ranking: 361, tuition: "₦106,040/yr", acceptanceRate: 15, studentPopulation: 12680, tags: ['State', 'College Of Education', 'NCCE'], coordinates: [6.816, 9.556] },
  { name: "College Of Education, Akamkpa", institutionType: "college_of_education", ownershipType: "state", state: "Kwara", city: "Kwara", logo: "🏛️", ranking: 362, tuition: "₦107,279/yr", acceptanceRate: 24, studentPopulation: 13193, tags: ['State', 'College Of Education', 'NCCE'], coordinates: [6.8691, 9.6031] },
  { name: "College of Education, Akwanga", institutionType: "college_of_education", ownershipType: "state", state: "Kwara", city: "Kwara", logo: "⚙️", ranking: 363, tuition: "₦108,518/yr", acceptanceRate: 33, studentPopulation: 13706, tags: ['State', 'College Of Education', 'NCCE'], coordinates: [6.9222, 9.6502] },
  { name: "College of Education, Billiri", institutionType: "college_of_education", ownershipType: "state", state: "Kwara", city: "Kwara", logo: "📚", ranking: 364, tuition: "₦109,757/yr", acceptanceRate: 42, studentPopulation: 14219, tags: ['State', 'College Of Education', 'NCCE'], coordinates: [6.9753, 9.6973] },
  { name: "College of Education, Ekiadolor", institutionType: "college_of_education", ownershipType: "state", state: "Kwara", city: "Kwara", logo: "⚡", ranking: 365, tuition: "₦60,996/yr", acceptanceRate: 21, studentPopulation: 14732, tags: ['State', 'College Of Education', 'NCCE'], coordinates: [7.0284, 9.7444] },
  { name: "College of Education, Gindiri", institutionType: "college_of_education", ownershipType: "state", state: "Kwara", city: "Kwara", logo: "🏫", ranking: 366, tuition: "₦62,235/yr", acceptanceRate: 30, studentPopulation: 15245, tags: ['State', 'College Of Education', 'NCCE'], coordinates: [7.0815, 9.7915] },
  { name: "College of Education, Katsina-Ala", institutionType: "college_of_education", ownershipType: "state", state: "Kwara", city: "Kwara", logo: "🦅", ranking: 367, tuition: "₦63,474/yr", acceptanceRate: 39, studentPopulation: 15758, tags: ['State', 'College Of Education', 'NCCE'], coordinates: [7.1346, 9.8386] },
  { name: "College Of Education, Lanlate", institutionType: "college_of_education", ownershipType: "state", state: "Kwara", city: "Kwara", logo: "💡", ranking: 368, tuition: "₦64,713/yr", acceptanceRate: 18, studentPopulation: 16271, tags: ['State', 'College Of Education', 'NCCE'], coordinates: [7.1877, 9.8857] },
  { name: "College of Education, Oju", institutionType: "college_of_education", ownershipType: "state", state: "Kwara", city: "Kwara", logo: "🌾", ranking: 369, tuition: "₦65,952/yr", acceptanceRate: 27, studentPopulation: 16784, tags: ['State', 'College Of Education', 'NCCE'], coordinates: [7.2408, 9.9328] },
  { name: "College of Education, Waka-Biu", institutionType: "college_of_education", ownershipType: "state", state: "Kwara", city: "Kwara", logo: "⛰️", ranking: 370, tuition: "₦67,191/yr", acceptanceRate: 36, studentPopulation: 17297, tags: ['State', 'College Of Education', 'NCCE'], coordinates: [7.2939, 9.9799] },
  { name: "College of Education, Warri", institutionType: "college_of_education", ownershipType: "state", state: "Kwara", city: "Kwara", logo: "🏗️", ranking: 371, tuition: "₦68,430/yr", acceptanceRate: 15, studentPopulation: 17810, tags: ['State', 'College Of Education', 'NCCE'], coordinates: [7.347, 10.027] },
  { name: "Ebonyi State College of Education", institutionType: "college_of_education", ownershipType: "state", state: "Ebonyi", city: "Ebonyi", logo: "🏜️", ranking: 372, tuition: "₦69,669/yr", acceptanceRate: 24, studentPopulation: 18323, tags: ['State', 'College Of Education', 'NCCE'], coordinates: [7.4001, 10.0741] },
  { name: "Enugu State College of Education (Technical)", institutionType: "college_of_education", ownershipType: "state", state: "Enugu", city: "Enugu", logo: "🍂", ranking: 373, tuition: "₦70,908/yr", acceptanceRate: 33, studentPopulation: 18836, tags: ['State', 'College Of Education', 'NCCE'], coordinates: [7.4532, 10.1212] },
  { name: "FCT College of Education", institutionType: "college_of_education", ownershipType: "state", state: "FCT", city: "FCT", logo: "💧", ranking: 374, tuition: "₦72,147/yr", acceptanceRate: 42, studentPopulation: 19349, tags: ['State', 'College Of Education', 'NCCE'], coordinates: [7.5063, 10.1683] },
  { name: "Imo State College of Education", institutionType: "college_of_education", ownershipType: "state", state: "Imo", city: "Imo", logo: "🌇", ranking: 375, tuition: "₦73,386/yr", acceptanceRate: 21, studentPopulation: 19862, tags: ['State', 'College Of Education', 'NCCE'], coordinates: [7.5594, 10.2154] },
  { name: "Isa Kaita College of Education", institutionType: "college_of_education", ownershipType: "state", state: "Katsina", city: "Katsina", logo: "⛪", ranking: 376, tuition: "₦74,625/yr", acceptanceRate: 30, studentPopulation: 20375, tags: ['State', 'College Of Education', 'NCCE'], coordinates: [7.6125, 10.2625] },
  { name: "Jigawa State College of Education", institutionType: "college_of_education", ownershipType: "state", state: "Jigawa", city: "Jigawa", logo: "🚜", ranking: 377, tuition: "₦75,864/yr", acceptanceRate: 39, studentPopulation: 20888, tags: ['State', 'College Of Education', 'NCCE'], coordinates: [7.6656, 10.3096] },
  { name: "Jigawa State College of Education and Legal Studies", institutionType: "college_of_education", ownershipType: "state", state: "Jigawa", city: "Jigawa", logo: "🏥", ranking: 378, tuition: "₦77,103/yr", acceptanceRate: 18, studentPopulation: 21401, tags: ['State', 'College Of Education', 'NCCE'], coordinates: [7.7187, 10.3567] },
  { name: "Kano State College of Education and Preliminary Studies", institutionType: "college_of_education", ownershipType: "state", state: "Kano", city: "Kano", logo: "🏢", ranking: 379, tuition: "₦78,342/yr", acceptanceRate: 27, studentPopulation: 21914, tags: ['State', 'College Of Education', 'NCCE'], coordinates: [7.7718, 10.4038] },
  { name: "Kaduna State College of Education", institutionType: "college_of_education", ownershipType: "state", state: "Kaduna", city: "Kaduna", logo: "🌊", ranking: 380, tuition: "₦79,581/yr", acceptanceRate: 36, studentPopulation: 22427, tags: ['State', 'College Of Education', 'NCCE'], coordinates: [7.8249, 10.4509] },
  { name: "Kashim Ibrahim College of Education", institutionType: "college_of_education", ownershipType: "state", state: "Borno", city: "Borno", logo: "🎓", ranking: 381, tuition: "₦80,820/yr", acceptanceRate: 15, studentPopulation: 22940, tags: ['State', 'College Of Education', 'NCCE'], coordinates: [7.878, 10.498] },
  { name: "Kogi State College of Education, Ankpa", institutionType: "college_of_education", ownershipType: "state", state: "Kogi", city: "Kogi", logo: "🏛️", ranking: 382, tuition: "₦82,059/yr", acceptanceRate: 24, studentPopulation: 23453, tags: ['State', 'College Of Education', 'NCCE'], coordinates: [7.9311, 10.5451] },
  { name: "Kogi State College of Education (Technical), Kabba", institutionType: "college_of_education", ownershipType: "state", state: "Kogi", city: "Kogi", logo: "⚙️", ranking: 383, tuition: "₦83,298/yr", acceptanceRate: 33, studentPopulation: 23966, tags: ['State', 'College Of Education', 'NCCE'], coordinates: [7.9842, 10.5922] },
  { name: "Kwara State College of Education, Ilorin", institutionType: "college_of_education", ownershipType: "state", state: "Kwara", city: "Kwara", logo: "📚", ranking: 384, tuition: "₦84,537/yr", acceptanceRate: 42, studentPopulation: 24479, tags: ['State', 'College Of Education', 'NCCE'], coordinates: [8.0373, 10.6393] },
  { name: "Kwara State College of Education (Technical), Lafiagi", institutionType: "college_of_education", ownershipType: "state", state: "Kwara", city: "Kwara", logo: "⚡", ranking: 385, tuition: "₦85,776/yr", acceptanceRate: 21, studentPopulation: 24992, tags: ['State', 'College Of Education', 'NCCE'], coordinates: [8.0904, 10.6864] },
  { name: "Kwara State College of Education, Oro", institutionType: "college_of_education", ownershipType: "state", state: "Kwara", city: "Kwara", logo: "🏫", ranking: 386, tuition: "₦87,015/yr", acceptanceRate: 30, studentPopulation: 25505, tags: ['State', 'College Of Education', 'NCCE'], coordinates: [8.1435, 10.7335] },
  { name: "Michael Otedola College of Primary Education", institutionType: "college_of_education", ownershipType: "state", state: "Lagos", city: "Lagos", logo: "🦅", ranking: 387, tuition: "₦88,254/yr", acceptanceRate: 39, studentPopulation: 26018, tags: ['State', 'College Of Education', 'NCCE'], coordinates: [8.1966, 10.7806] },
  { name: "Mohammed Goni College of Legal and Islamic Studies", institutionType: "college_of_education", ownershipType: "state", state: "Borno", city: "Borno", logo: "💡", ranking: 388, tuition: "₦89,493/yr", acceptanceRate: 18, studentPopulation: 26531, tags: ['State', 'College Of Education', 'NCCE'], coordinates: [8.2497, 10.8277] },
  { name: "Moje College Of Education", institutionType: "college_of_education", ownershipType: "state", state: "Kwara", city: "Kwara", logo: "🌾", ranking: 389, tuition: "₦90,732/yr", acceptanceRate: 27, studentPopulation: 27044, tags: ['State', 'College Of Education', 'NCCE'], coordinates: [8.3028, 10.8748] },
  { name: "Niger State College of Education", institutionType: "college_of_education", ownershipType: "state", state: "Niger", city: "Niger", logo: "⛰️", ranking: 390, tuition: "₦91,971/yr", acceptanceRate: 36, studentPopulation: 27557, tags: ['State', 'College Of Education', 'NCCE'], coordinates: [8.3559, 10.9219] },
  { name: "Nwafor Orizu College of Education", institutionType: "college_of_education", ownershipType: "state", state: "Anambra", city: "Anambra", logo: "🏗️", ranking: 391, tuition: "₦93,210/yr", acceptanceRate: 15, studentPopulation: 8070, tags: ['State', 'College Of Education', 'NCCE'], coordinates: [8.409, 10.969] },
  { name: "Osun State College of Education, Ilesa", institutionType: "college_of_education", ownershipType: "state", state: "Osun", city: "Osun", logo: "🏜️", ranking: 392, tuition: "₦94,449/yr", acceptanceRate: 24, studentPopulation: 8583, tags: ['State', 'College Of Education', 'NCCE'], coordinates: [8.4621, 11.0161] },
  { name: "Sa'adatu Rimi College of Education", institutionType: "college_of_education", ownershipType: "state", state: "Kano", city: "Kano", logo: "🍂", ranking: 393, tuition: "₦95,688/yr", acceptanceRate: 33, studentPopulation: 9096, tags: ['State', 'College Of Education', 'NCCE'], coordinates: [3.3152, 11.0632] },
  { name: "Shehu Shagari College of Education", institutionType: "college_of_education", ownershipType: "state", state: "Sokoto", city: "Sokoto", logo: "💧", ranking: 394, tuition: "₦96,927/yr", acceptanceRate: 42, studentPopulation: 9609, tags: ['State', 'College Of Education', 'NCCE'], coordinates: [3.3683, 11.1103] },
  { name: "Umar Suleiman College of Education", institutionType: "college_of_education", ownershipType: "state", state: "Yobe", city: "Yobe", logo: "🌇", ranking: 395, tuition: "₦98,166/yr", acceptanceRate: 21, studentPopulation: 10122, tags: ['State', 'College Of Education', 'NCCE'], coordinates: [3.4214, 11.1574] },
  { name: "Yusuf Bala Usman College of Legal and General Studies", institutionType: "college_of_education", ownershipType: "state", state: "Katsina", city: "Katsina", logo: "⛪", ranking: 396, tuition: "₦99,405/yr", acceptanceRate: 30, studentPopulation: 10635, tags: ['State', 'College Of Education', 'NCCE'], coordinates: [3.4745, 11.2045] },
  { name: "Zamfara State College Of Education", institutionType: "college_of_education", ownershipType: "state", state: "Zamfara", city: "Zamfara", logo: "🚜", ranking: 397, tuition: "₦100,644/yr", acceptanceRate: 39, studentPopulation: 11148, tags: ['State', 'College Of Education', 'NCCE'], coordinates: [3.5276, 11.2516] }
];

const programTemplates = [
  // Sciences
  { name: "Computer Science", faculty: "Sciences", duration: "4 years", cutoffMark: 240, tuition: "₦150,000/yr", requirements: ["Mathematics", "English", "Physics", "Chemistry"], careerPaths: ["Software Engineer", "Data Scientist", "System Administrator"], description: "Professional degree in software engineering, algorithms, database logic, and artificial intelligence." },
  { name: "Cybersecurity", faculty: "Sciences", duration: "4 years", cutoffMark: 230, tuition: "₦160,000/yr", requirements: ["Mathematics", "English", "Physics", "Chemistry"], careerPaths: ["Security Analyst", "Penetration Tester", "Cryptographer"], description: "Comprehensive training in network security, digital forensics, threat intelligence, and cyber defenses." },
  { name: "Software Engineering", faculty: "Sciences", duration: "4 years", cutoffMark: 235, tuition: "₦160,000/yr", requirements: ["Mathematics", "English", "Physics", "Chemistry"], careerPaths: ["Software Architect", "Fullstack Developer", "DevOps Engineer"], description: "Focuses on software design patterns, agile engineering, quality assurance, and enterprise scale apps." },
  { name: "Information Technology", faculty: "Sciences", duration: "4 years", cutoffMark: 210, tuition: "₦140,000/yr", requirements: ["Mathematics", "English", "Physics", "Chemistry"], careerPaths: ["IT Consultant", "Network Engineer", "Database Manager"], description: "Applied study of systems administration, network management, client-server databases, and IT services." },
  { name: "Data Science", faculty: "Sciences", duration: "4 years", cutoffMark: 230, tuition: "₦160,000/yr", requirements: ["Mathematics", "English", "Physics", "Economics"], careerPaths: ["Data Analyst", "AI Engineer", "Business Intelligence Specialist"], description: "Statistical machine learning, big data architectures, predictive modeling, and data visualization." },
  { name: "Physics with Electronics", faculty: "Sciences", duration: "4 years", cutoffMark: 200, tuition: "₦130,000/yr", requirements: ["Physics", "English", "Mathematics", "Chemistry"], careerPaths: ["Hardware Engineer", "Telecomm Specialist", "Lab Researcher"], description: "Applied physics focusing on electrical circuits, signal processing, and semiconductor systems." },
  { name: "Microbiology", faculty: "Sciences", duration: "4 years", cutoffMark: 220, tuition: "₦140,000/yr", requirements: ["Biology", "English", "Chemistry", "Physics"], careerPaths: ["Lab Scientist", "Pharmacologist", "Quality Inspector"], description: "In-depth study of microscopic life, bacteria, viruses, and their clinical/industrial applications." },
  { name: "Biochemistry", faculty: "Sciences", duration: "4 years", cutoffMark: 225, tuition: "₦140,000/yr", requirements: ["Biology", "English", "Chemistry", "Physics"], careerPaths: ["Research Biochemist", "Forensics Analyst", "Food Scientist"], description: "Chemical processes related to living organisms. Bridge between biology and chemical sciences." },
  { name: "Biotechnology", faculty: "Sciences", duration: "4 years", cutoffMark: 225, tuition: "₦145,000/yr", requirements: ["Biology", "English", "Chemistry", "Mathematics"], careerPaths: ["Biotech Researcher", "Geneticist", "Bioinformatics Specialist"], description: "Leverages biological systems and genetics to develop clinical therapies and agronomy breakthroughs." },
  { name: "Mathematics", faculty: "Sciences", duration: "4 years", cutoffMark: 200, tuition: "₦120,000/yr", requirements: ["Mathematics", "English", "Physics", "Chemistry"], careerPaths: ["Actuary", "Cryptographer", "Quantitative Analyst"], description: "Rigorous study of pure/applied mathematics, calculus systems, abstract algebra, and numeric analysis." },
  { name: "Statistics", faculty: "Sciences", duration: "4 years", cutoffMark: 200, tuition: "₦120,000/yr", requirements: ["Mathematics", "English", "Economics", "Physics"], careerPaths: ["Statistician", "Data Analyst", "Actuary Analyst"], description: "Probability frameworks, survey methodologies, statistical models, and quantitative planning structures." },
  { name: "Industrial Chemistry", faculty: "Sciences", duration: "4 years", cutoffMark: 210, tuition: "₦135,000/yr", requirements: ["Chemistry", "English", "Physics", "Mathematics"], careerPaths: ["Chemical Analyst", "Production Manager", "Quality Auditor"], description: "Applies chemical transformations to industrial scales, petroleum refining, and polymer manufacturing." },
  { name: "Geology", faculty: "Sciences", duration: "4 years", cutoffMark: 215, tuition: "₦140,000/yr", requirements: ["Physics", "English", "Chemistry", "Mathematics"], careerPaths: ["Geologist", "Seismologist", "Petroleum Geoscientist"], description: "Study of solid earth materials, mineral resources, tectonic activities, and reservoir exploration." },

  // Engineering & Technology
  { name: "Mechanical Engineering", faculty: "Engineering", duration: "5 years", cutoffMark: 250, tuition: "₦160,000/yr", requirements: ["Mathematics", "English", "Physics", "Chemistry"], careerPaths: ["Mechanical Engineer", "Aviation Technician", "Robotics Engineer"], description: "Comprehensive study of fluid mechanics, thermodynamics, robotics, and machine design layouts." },
  { name: "Electrical & Electronics Engineering", faculty: "Engineering", duration: "5 years", cutoffMark: 245, tuition: "₦160,000/yr", requirements: ["Mathematics", "English", "Physics", "Chemistry"], careerPaths: ["Power Grid Manager", "Hardware Architect", "Embedded Dev"], description: "Core electrical circuits, power grid distribution, hardware integrations, and microelectronics." },
  { name: "Civil Engineering", faculty: "Engineering", duration: "5 years", cutoffMark: 240, tuition: "₦155,000/yr", requirements: ["Mathematics", "English", "Physics", "Chemistry"], careerPaths: ["Structural Engineer", "Site Inspector", "Urban Planner"], description: "Designs and constructs public infrastructures, skyscrapers, highway networks, and water reservoirs." },
  { name: "Computer Engineering", faculty: "Engineering", duration: "5 years", cutoffMark: 240, tuition: "₦160,000/yr", requirements: ["Mathematics", "English", "Physics", "Chemistry"], careerPaths: ["Hardware Design Engineer", "Firmware Developer", "Network Architect"], description: "Integration of hardware architectures and software layers, microprocessor designs, and robotics." },
  { name: "Chemical Engineering", faculty: "Engineering", duration: "5 years", cutoffMark: 240, tuition: "₦160,000/yr", requirements: ["Mathematics", "English", "Physics", "Chemistry"], careerPaths: ["Process Engineer", "Refinery Manager", "Safety Engineer"], description: "Applies chemical transformations on process levels, refinery piping designs, and fluid heat transfers." },
  { name: "Petroleum Engineering", faculty: "Engineering", duration: "5 years", cutoffMark: 250, tuition: "₦170,000/yr", requirements: ["Mathematics", "English", "Physics", "Chemistry"], careerPaths: ["Drilling Engineer", "Reservoir Manager", "Petrophysicist"], description: "Hydrocarbon extraction, reservoir simulations, oil rig logistics, and dynamic well drilling models." },
  { name: "Mechatronics Engineering", faculty: "Engineering", duration: "5 years", cutoffMark: 245, tuition: "₦165,000/yr", requirements: ["Mathematics", "English", "Physics", "Chemistry"], careerPaths: ["Robotics Architect", "Automation Specialist", "Systems Control Dev"], description: "Fuses mechanical engineering, electrical circuits, control theories, and real-time coding systems." },
  { name: "Agricultural Engineering", faculty: "Engineering", duration: "5 years", cutoffMark: 200, tuition: "₦130,000/yr", requirements: ["Mathematics", "English", "Physics", "Agricultural Science"], careerPaths: ["Agro-Machinery Engineer", "Irrigation Expert", "Farm Automater"], description: "Designs agricultural machinery, soil conservation, large irrigation channels, and post-harvest equipment." },
  { name: "Metallurgical & Materials Engineering", faculty: "Engineering", duration: "5 years", cutoffMark: 210, tuition: "₦140,000/yr", requirements: ["Mathematics", "English", "Physics", "Chemistry"], careerPaths: ["Materials Auditor", "Metallurgist", "Corrosion Specialist"], description: "Explores structural properties of metals, advanced polymers, composite fabrications, and alloy moldings." },

  // Medical Sciences
  { name: "Medicine & Surgery", faculty: "Medical Sciences", duration: "6 years", cutoffMark: 280, tuition: "₦200,000/yr", requirements: ["Biology", "English", "Chemistry", "Physics"], careerPaths: ["General Surgeon", "Medical Doctor", "Pediatrician"], description: "Premium, highly competitive medical training qualifying candidates for clinical surgery and practice." },
  { name: "Nursing Science", faculty: "Medical Sciences", duration: "5 years", cutoffMark: 250, tuition: "₦180,000/yr", requirements: ["Biology", "English", "Chemistry", "Physics"], careerPaths: ["Clinical Nurse", "Public Health Officer", "Midwife Practitioner"], description: "Comprehensive clinical care training, patient rehabilitation, hospital operations, and pediatric support." },
  { name: "Pharmacy", faculty: "Medical Sciences", duration: "5 years", cutoffMark: 255, tuition: "₦180,000/yr", requirements: ["Biology", "English", "Chemistry", "Physics"], careerPaths: ["Pharmacist", "Medical Representative", "Research Scientist"], description: "In-depth training on drug compounding, chemical composition, clinical pharmacology, and dosage safety." },
  { name: "Medical Laboratory Science", faculty: "Medical Sciences", duration: "5 years", cutoffMark: 240, tuition: "₦160,000/yr", requirements: ["Biology", "English", "Chemistry", "Physics"], careerPaths: ["Clinical Lab Scientist", "Diagnostics Officer", "Pathologist Assistant"], description: "Equips candidates for blood testing, biological pathogen analysis, and laboratory disease screening." },
  { name: "Physiotherapy", faculty: "Medical Sciences", duration: "5 years", cutoffMark: 245, tuition: "₦170,000/yr", requirements: ["Biology", "English", "Chemistry", "Physics"], careerPaths: ["Physiotherapist", "Sports Therapist", "Rehabilitation Lead"], description: "Physical wellness, muscle therapy, neuromuscular treatment, sports medicine, and kinetic exercises." },
  { name: "Anatomy", faculty: "Medical Sciences", duration: "4 years", cutoffMark: 215, tuition: "₦130,000/yr", requirements: ["Biology", "English", "Chemistry", "Physics"], careerPaths: ["Anatomy Lecturer", "Biomedical Researcher", "Mortician Manager"], description: "Macro and microstructural configurations of human organs, tissues, and skeletal frameworks." },
  { name: "Physiology", faculty: "Medical Sciences", duration: "4 years", cutoffMark: 215, tuition: "₦130,000/yr", requirements: ["Biology", "English", "Chemistry", "Physics"], careerPaths: ["Physiologist", "Sports Science Adviser", "Lab Tech"], description: "Analysis of physical organ systems functions, hormonal cycles, neural triggers, and cellular reactions." },

  // Agricultural Sciences
  { name: "Agricultural Economics", faculty: "Agricultural Sciences", duration: "5 years", cutoffMark: 200, tuition: "₦120,000/yr", requirements: ["Agricultural Science", "English", "Economics", "Mathematics"], careerPaths: ["Agribusiness Manager", "Credit Analyst", "Agro Policy Consultant"], description: "Agribusiness operations, resource allocations, price behaviors, and micro-financing frameworks." },
  { name: "Animal Science & Production", faculty: "Agricultural Sciences", duration: "5 years", cutoffMark: 190, tuition: "₦115,000/yr", requirements: ["Biology", "English", "Agricultural Science", "Chemistry"], careerPaths: ["Livestock Manager", "Animal Breeder", "Feed Specialist"], description: "Scientific animal breeding, nutrition plans, poultry/cattle management, and animal pathology." },
  { name: "Crop Science", faculty: "Agricultural Sciences", duration: "5 years", cutoffMark: 190, tuition: "₦115,000/yr", requirements: ["Biology", "English", "Agricultural Science", "Chemistry"], careerPaths: ["Agronomist", "Plant Protectionist", "Farm Consultant"], description: "Mastery of plant breeding, crop genetics, soil cultivation models, weed controls, and harvest safety." },
  { name: "Soil Science", faculty: "Agricultural Sciences", duration: "5 years", cutoffMark: 190, tuition: "₦115,000/yr", requirements: ["Chemistry", "English", "Agricultural Science", "Mathematics"], careerPaths: ["Soil Conservator", "Fertilizer Consultant", "Land Surveyor"], description: "Soil fertility configurations, chemical compost analysis, degradation safety, and irrigation management." },
  { name: "Fisheries & Aquaculture", faculty: "Agricultural Sciences", duration: "5 years", cutoffMark: 180, tuition: "₦110,000/yr", requirements: ["Biology", "English", "Agricultural Science", "Chemistry"], careerPaths: ["Hatchery Operator", "Aquaculture Specialist", "Fish Farm Inspector"], description: "Aquaculture pond configurations, scientific fish breeding, feeds, and marine environmental controls." },
  { name: "Forestry & Wildlife Management", faculty: "Agricultural Sciences", duration: "5 years", cutoffMark: 180, tuition: "₦110,000/yr", requirements: ["Biology", "English", "Agricultural Science", "Chemistry"], careerPaths: ["Forest Ranger", "Wildlife Conservator", "Environmental Consultant"], description: "Ecological forest conservation, tree farming, wildlife protection, and wood processing systems." },

  // Management Sciences
  { name: "Accounting", faculty: "Management Sciences", duration: "4 years", cutoffMark: 230, tuition: "₦145,000/yr", requirements: ["Mathematics", "English", "Economics", "Government"], careerPaths: ["Chartered Accountant", "Auditor", "Tax Consultant"], description: "Enables mastery of financial analysis, ledger auditing, tax calculation systems, and corporate accounting." },
  { name: "Business Administration", faculty: "Management Sciences", duration: "4 years", cutoffMark: 220, tuition: "₦140,000/yr", requirements: ["Mathematics", "English", "Economics", "Government"], careerPaths: ["Business Consultant", "HR Manager", "Operations Lead"], description: "Corporate leadership tactics, enterprise management systems, entrepreneurship hubs, and marketing strategies." },
  { name: "Banking & Finance", faculty: "Management Sciences", duration: "4 years", cutoffMark: 220, tuition: "₦140,000/yr", requirements: ["Mathematics", "English", "Economics", "Government"], careerPaths: ["Investment Banker", "Credit Officer", "Portfolio Manager"], description: "Study of financial markets, investment portfolios, commercial banking, and capital asset pricing." },
  { name: "Marketing", faculty: "Management Sciences", duration: "4 years", cutoffMark: 200, tuition: "₦130,000/yr", requirements: ["Mathematics", "English", "Economics", "Commerce"], careerPaths: ["Brand Manager", "Sales Strategist", "Market Researcher"], description: "Digital brand growth strategies, customer behaviors, pricing theories, and supply chain logistics." },
  { name: "Public Administration", faculty: "Management Sciences", duration: "4 years", cutoffMark: 210, tuition: "₦130,000/yr", requirements: ["Government", "English", "Economics", "History"], careerPaths: ["Civil Administrator", "Policy Analyst", "HR Officer"], description: "Public bureau logistics, civil service structures, administrative laws, and municipal planning." },

  // Law, Arts & Social Sciences
  { name: "Law", faculty: "Law", duration: "5 years", cutoffMark: 260, tuition: "₦150,000/yr", requirements: ["Literature", "English", "Government", "History"], careerPaths: ["Defense Attorney", "Legal Consultant", "High Court Judge"], description: "Comprehensive study of jurisprudence, constitutional frameworks, criminal laws, and civil litigations." },
  { name: "Economics", faculty: "Social Sciences", duration: "4 years", cutoffMark: 225, tuition: "₦135,000/yr", requirements: ["Mathematics", "English", "Economics", "Government"], careerPaths: ["Financial Analyst", "Market Strategist", "Policy Adviser"], description: "Analysis of market frameworks, macro-economics, wealth distributions, and statistical public planning." },
  { name: "Political Science", faculty: "Social Sciences", duration: "4 years", cutoffMark: 210, tuition: "₦130,000/yr", requirements: ["History", "English", "Government", "Economics"], careerPaths: ["Diplomat", "Public Policy Manager", "Research Adviser"], description: "Analyzes governmental institutions, political ideologies, election systems, and public policy formulation." },
  { name: "Mass Communication", faculty: "Arts & Humanities", duration: "4 years", cutoffMark: 230, tuition: "₦130,000/yr", requirements: ["Literature", "English", "Government", "History"], careerPaths: ["Journalist", "Radio Presenter", "Public Relations Expert"], description: "Study of broadcast journalism, digital print medias, corporate communications, and advertising strategies." },
  { name: "History & International Studies", faculty: "Arts & Humanities", duration: "4 years", cutoffMark: 210, tuition: "₦120,000/yr", requirements: ["History", "English", "Government", "Literature"], careerPaths: ["Foreign Service Officer", "Archivist", "Intelligence Analyst"], description: "Explores historical patterns, international diplomacy, treaties, and global political systems." },
  { name: "English & Literary Studies", faculty: "Arts & Humanities", duration: "4 years", cutoffMark: 200, tuition: "₦120,000/yr", requirements: ["Literature", "English", "Government", "History"], careerPaths: ["Editor", "Content Writer", "PR Officer"], description: "Advanced syntax analysis, creative writing, classic world literature, and cultural linguistics." },

  // Education
  { name: "Primary Education Studies", faculty: "Education", duration: "4 years", cutoffMark: 180, tuition: "₦100,000/yr", requirements: ["Mathematics", "English", "Biology", "Government"], careerPaths: ["Primary School Teacher", "Child Care Specialist", "Curriculum Designer"], description: "Pedagogical methodologies for childhood growth, primary classroom setups, and foundational learning." },
  { name: "Early Childhood Care Education", faculty: "Education", duration: "4 years", cutoffMark: 180, tuition: "₦100,000/yr", requirements: ["Mathematics", "English", "Biology", "Government"], careerPaths: ["Pre-School Educator", "Child Counselor", "Daycare Manager"], description: "Nurturing early developmental capabilities, cognitive learning frameworks, and childhood safety." },
  { name: "Business Education", faculty: "Education", duration: "4 years", cutoffMark: 180, tuition: "₦105,000/yr", requirements: ["Mathematics", "English", "Economics", "Commerce"], careerPaths: ["Business Teacher", "Administrative Officer", "Vocational Coach"], description: "Combines pedagogical training with commercial concepts (accounting, office management, marketing)." },
  { name: "Technical Education", faculty: "Education", duration: "4 years", cutoffMark: 180, tuition: "₦110,000/yr", requirements: ["Mathematics", "English", "Physics", "Chemistry"], careerPaths: ["Technical Instructor", "Workshop Supervisor", "Industrial Educator"], description: "Equips candidates to teach technical trades like carpentry, metalwork, mechanics, and electronics." },
  { name: "Guidance & Counseling", faculty: "Education", duration: "4 years", cutoffMark: 180, tuition: "₦100,000/yr", requirements: ["Biology", "English", "Government", "Mathematics"], careerPaths: ["School Counselor", "Career Coach", "Rehabilitation Officer"], description: "Psychological testing, career pathing support, and student behavioral modification strategies." },
  { name: "Education & Mathematics", faculty: "Education", duration: "4 years", cutoffMark: 180, tuition: "₦100,000/yr", requirements: ["Mathematics", "English", "Physics", "Chemistry"], careerPaths: ["Mathematics Teacher", "Curriculum Specialist", "Academic Researcher"], description: "Prepares specialized mathematics instructors with thorough pedagogy and algebra configurations." },
  { name: "Education & English", faculty: "Education", duration: "4 years", cutoffMark: 190, tuition: "₦100,000/yr", requirements: ["Literature", "English", "Government", "History"], careerPaths: ["English Language Teacher", "Literary Critic", "Journalist"], description: "Prepares secondary school English language instructors, syntax training, and literary reviews." },
  { name: "Education & Physics", faculty: "Education", duration: "4 years", cutoffMark: 180, tuition: "₦100,000/yr", requirements: ["Physics", "English", "Mathematics", "Chemistry"], careerPaths: ["Physics Instructor", "Lab Supervisor", "Technical Consultant"], description: "Core mechanics and electromagnetism training coupled with secondary school teaching methodology." },

  // Polytechnic ND/HND Specialties
  { name: "Science Laboratory Technology", faculty: "Polytechnic ND/HND", duration: "2 years (ND/HND)", cutoffMark: 180, tuition: "₦70,000/yr", requirements: ["Biology", "English", "Chemistry", "Physics"], careerPaths: ["Lab Technologist", "Quality Analyst", "Research Assistant"], description: "Applied clinical diagnostics, biological micro-testing, laboratory safety, and chemical auditing." },
  { name: "Estate Management", faculty: "Polytechnic ND/HND", duration: "2 years (ND/HND)", cutoffMark: 170, tuition: "₦75,000/yr", requirements: ["Mathematics", "English", "Economics", "Geography"], careerPaths: ["Property Valuer", "Estate Agent", "Facilities Manager"], description: "Land property valuation, real estate investment calculations, building maintenance, and property laws." },
  { name: "Quantity Surveying", faculty: "Polytechnic ND/HND", duration: "2 years (ND/HND)", cutoffMark: 170, tuition: "₦75,000/yr", requirements: ["Mathematics", "English", "Physics", "Geography"], careerPaths: ["Quantity Surveyor", "Cost Estimator", "Project Manager"], description: "Construction cost assessments, contract bill of quantities, structural material estimates, and budgeting." },
  { name: "Architectural Technology", faculty: "Polytechnic ND/HND", duration: "2 years (ND/HND)", cutoffMark: 175, tuition: "₦80,000/yr", requirements: ["Mathematics", "English", "Physics", "Technical Drawing"], careerPaths: ["Architectural Tech", "CAD Drafter", "Construction Inspector"], description: "Visual building blueprint designs, computer-aided drafting (CAD), structural planning, and local regulations." },
  { name: "Urban & Regional Planning", faculty: "Polytechnic ND/HND", duration: "2 years (ND/HND)", cutoffMark: 160, tuition: "₦70,000/yr", requirements: ["Mathematics", "English", "Geography", "Economics"], careerPaths: ["Town Planner", "Zoning Officer", "Cartographer"], description: "Urban zoning layouts, cartographic land usage mapping, municipal drainage and transport planning." },
  { name: "Hospitality Management", faculty: "Polytechnic ND/HND", duration: "2 years (ND/HND)", cutoffMark: 150, tuition: "₦65,000/yr", requirements: ["English", "Mathematics", "Home Economics", "Biology"], careerPaths: ["Hotel Manager", "Catering Supervisor", "Tourism Planner"], description: "Hotel operations, high-end guest reception protocols, culinary operations, and event management." },
  { name: "Office Technology Management", faculty: "Polytechnic ND/HND", duration: "2 years (ND/HND)", cutoffMark: 150, tuition: "₦65,000/yr", requirements: ["English", "Mathematics", "Commerce", "Government"], careerPaths: ["Executive Assistant", "Office Manager", "Secretariat Lead"], description: "Digital office administration, typing speed mastery, database filing, and communication technologies." }
];

const seedData = async () => {
  try {
    // Force process-level public DNS resolvers to resolve MONGODB_URI SRV records successfully,
    // bypassing any querySrv ECONNREFUSED blocks from local ISP or network DNS limitations.
    try {
      dns.setServers(["1.1.1.1", "8.8.8.8"]);
    } catch (dnsErr) {
      console.warn("[DNS Resolution Warning] Failed to set public DNS servers:", dnsErr.message);
    }

    // 1. Establish Database Connection
    console.log("Establishing connection to database...");
    const connectionUri = process.env.MONGODB_URI || process.env.MONGO_URI || "mongodb://127.0.0.1:27017/ewebar";
    const maskedUri = connectionUri.replace(/\/\/([^:]+):([^@]+)@/, "//***:***@");
    console.log(`Connecting to: ${maskedUri}`);
    const conn = await mongoose.connect(connectionUri, { serverSelectionTimeoutMS: 5000 });
    console.log(`Connected successfully to: ${conn.connection.db.databaseName}`);

    // 2. Clear Existing Collections
    console.log("Wiping existing database records...");
    await User.deleteMany({});
    await Institution.deleteMany({});
    await Faculty.deleteMany({});
    await Department.deleteMany({});
    await Program.deleteMany({});
    await Scholarship.deleteMany({});
    await Application.deleteMany({});
    await Recommendation.deleteMany({});
    console.log("Collections wiped.");

    // 3. Seed Universities, Polytechnics, and Colleges via ETL Pipeline
    console.log("Starting ETL Ingestion pipeline for institutions...");
    const institutionMap = new Map();

    const normalizedInstitutions = [];
    const seenNames = new Set();
    const seenSlugs = new Set();

    for (const raw of rawInstitutions) {
      const normalized = ETLService.normalizeInstitution(raw);
      if (!seenNames.has(normalized.name) && !seenSlugs.has(normalized.slug)) {
        seenNames.add(normalized.name);
        seenSlugs.add(normalized.slug);
        normalizedInstitutions.push(normalized);
      }
    }

    const insertedInstitutions = await Institution.insertMany(normalizedInstitutions, { ordered: false });
    for (const inst of insertedInstitutions) {
      institutionMap.set(inst.name, inst);
    }
    console.log(`Successfully normalized & ingested ${institutionMap.size} institutions.`);

    // 4. Ingest Faculties, Departments, and Programs relationally for all institutions
    console.log("Relational ingestion pipeline mapping Faculties, Departments, and Programs...");
    let programCount = 0;

    const facultiesToInsert = [];
    const departmentsToInsert = [];
    const programsToInsert = [];

    const localFacultyCache = new Map();
    const localDeptCache = new Map();

    const makeSlug = (str) => {
      return str
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
    };

    for (const [instName, instDoc] of institutionMap.entries()) {
      const isUni = instDoc.institutionType === "university";
      const isPoly = instDoc.institutionType === "polytechnic";
      const isCollege = instDoc.institutionType === "college_of_education";
      const nameLower = instDoc.name.toLowerCase();

      // Smart selection of program templates based on institution specialization
      let matchedTemplates = [];

      if (isUni) {
        if (nameLower.includes("agriculture") || nameLower.includes("agric")) {
          // Seeding agricultural universities
          matchedTemplates = programTemplates.filter(t => 
            t.faculty === "Agricultural Sciences" || 
            t.faculty === "Sciences" || 
            t.name === "Agricultural Engineering" ||
            t.name === "Economics"
          );
        } else if (nameLower.includes("technology") || nameLower.includes("tech") || nameLower.includes("aviation") || nameLower.includes("aerospace")) {
          // Seeding tech universities
          matchedTemplates = programTemplates.filter(t => 
            t.faculty === "Engineering" || 
            t.faculty === "Sciences" || 
            t.faculty === "Management Sciences"
          );
        } else if (nameLower.includes("medical") || nameLower.includes("health")) {
          // Seeding medical universities
          matchedTemplates = programTemplates.filter(t => 
            t.faculty === "Medical Sciences" || 
            t.faculty === "Sciences"
          );
        } else if (nameLower.includes("education")) {
          // Seeding education universities
          matchedTemplates = programTemplates.filter(t => 
            t.faculty === "Education" || 
            t.faculty === "Arts & Humanities" || 
            t.faculty === "Social Sciences"
          );
        } else if (nameLower.includes("police") || nameLower.includes("defense") || nameLower.includes("defence") || nameLower.includes("army")) {
          // Seeding military/police academies
          matchedTemplates = programTemplates.filter(t => 
            t.faculty === "Law" || 
            t.faculty === "Social Sciences" || 
            t.faculty === "Sciences" || 
            t.faculty === "Engineering"
          );
        } else {
          // General comprehensive university (UNILAG, UI, OAU, ABU, private schools like Covenant, Babcock)
          // Universities get a massive cross-section of programs (regular schools get 32 templates)
          matchedTemplates = programTemplates.filter(t => t.faculty !== "Polytechnic ND/HND");
        }
        
        const limit = (!nameLower.includes("agriculture") && !nameLower.includes("technology") && !nameLower.includes("medical") && !nameLower.includes("education")) ? 32 : 18;
        matchedTemplates = matchedTemplates.slice(0, limit);

      } else if (isPoly) {
        // Polytechnics get technical ND/HND specialties plus sciences and engineering
        matchedTemplates = programTemplates.filter(t => 
          t.faculty === "Polytechnic ND/HND" || 
          t.faculty === "Sciences" || 
          t.faculty === "Engineering" || 
          t.faculty === "Management Sciences"
        );
        matchedTemplates = matchedTemplates.slice(0, 22);

      } else if (isCollege) {
        // Colleges of Education get pedagogy and NCE courses
        matchedTemplates = programTemplates.filter(t => 
          t.faculty === "Education" || 
          t.faculty === "Arts & Humanities" || 
          t.faculty === "Social Sciences"
        );
        matchedTemplates = matchedTemplates.slice(0, 18);
      }

      for (const tmpl of matchedTemplates) {
        // 1. Get or Create Faculty in memory
        const facKey = `${instDoc._id}_${tmpl.faculty.trim()}`;
        let faculty = localFacultyCache.get(facKey);
        if (!faculty) {
          faculty = {
            _id: new mongoose.Types.ObjectId(),
            institutionId: instDoc._id,
            name: tmpl.faculty.trim(),
            slug: makeSlug(tmpl.faculty.trim())
          };
          localFacultyCache.set(facKey, faculty);
          facultiesToInsert.push(faculty);
        }
        
        // 2. Get or Create Department in memory (derive department name from program)
        const deptName = `Department of ${tmpl.name.trim()}`;
        const deptKey = `${instDoc._id}_${faculty._id}_${deptName}`;
        let department = localDeptCache.get(deptKey);
        if (!department) {
          department = {
            _id: new mongoose.Types.ObjectId(),
            institutionId: instDoc._id,
            facultyId: faculty._id,
            name: deptName,
            slug: makeSlug(deptName)
          };
          localDeptCache.set(deptKey, department);
          departmentsToInsert.push(department);
        }
        
        // Adjust attributes according to Institution status
        const adjustedTuition = instDoc.ownershipType === "private" 
          ? `₦${(Number(tmpl.cutoffMark) * 3500).toLocaleString()}/yr`
          : tmpl.tuition;

        let adjustedCutoff = tmpl.cutoffMark;
        
        if (instDoc.institutionType === "university") {
          const isPanAtlantic = nameLower.includes("pan-atlantic");
          const isTopUni = nameLower.includes("lagos") || 
                           nameLower.includes("ibadan") || 
                           nameLower.includes("obafemi") || 
                           nameLower.includes("nsukka") || 
                           nameLower.includes("benin") || 
                           nameLower.includes("covenant") || 
                           nameLower.includes("air force");

          if (isPanAtlantic) {
            adjustedCutoff = Math.max(220, tmpl.cutoffMark);
          } else if (isTopUni) {
            adjustedCutoff = Math.max(200, tmpl.cutoffMark);
          } else {
            // General / other universities (Minimum 150)
            const baseCutoff = tmpl.cutoffMark - 30; // general schools have lower cutoffs
            if (tmpl.name.toLowerCase().includes("medicine")) {
              adjustedCutoff = Math.max(250, baseCutoff);
            } else if (tmpl.name.toLowerCase().includes("law")) {
              adjustedCutoff = Math.max(240, baseCutoff);
            } else if (tmpl.faculty === "Engineering") {
              adjustedCutoff = Math.max(220, baseCutoff);
            } else {
              adjustedCutoff = Math.max(150, baseCutoff);
            }
          }
        } else if (instDoc.institutionType === "polytechnic") {
          if (nameLower.includes("yaba") || nameLower.includes("yabatech")) {
            adjustedCutoff = Math.max(160, tmpl.cutoffMark - 80);
          } else if (nameLower.includes("lagos state university of science") || nameLower.includes("lasustech")) {
            adjustedCutoff = Math.max(195, tmpl.cutoffMark - 60);
          } else if (nameLower.includes("ilaro")) {
            adjustedCutoff = Math.max(150, tmpl.cutoffMark - 90);
          } else if (nameLower.includes("ibadan")) {
            adjustedCutoff = Math.max(150, tmpl.cutoffMark - 90);
          } else {
            adjustedCutoff = Math.max(100, tmpl.cutoffMark - 120);
          }
        } else if (instDoc.institutionType === "college_of_education") {
          adjustedCutoff = Math.max(100, tmpl.cutoffMark - 120);
        } else if (instDoc.institutionType === "school_of_nursing") {
          adjustedCutoff = Math.max(140, tmpl.cutoffMark - 100);
        }

        // 3. Create Program in memory
        const program = {
          _id: new mongoose.Types.ObjectId(),
          institutionId: instDoc._id,
          facultyId: faculty._id,
          departmentId: department._id,
          name: tmpl.name.trim(),
          slug: makeSlug(tmpl.name.trim()),
          duration: isPoly 
            ? "2 years (ND/HND)" 
            : (instDoc.institutionType === "college_of_education" ? "3 years (NCE)" : tmpl.duration),
          cutoffMark: adjustedCutoff,
          tuition: adjustedTuition,
          requirements: tmpl.requirements,
          careerPaths: tmpl.careerPaths,
          description: tmpl.description
        };
        programsToInsert.push(program);

        programCount++;
      }
    }

    console.log(`Prepared in memory: ${facultiesToInsert.length} faculties, ${departmentsToInsert.length} departments, ${programsToInsert.length} programs.`);

    console.log("Bulk inserting Faculties...");
    await Faculty.insertMany(facultiesToInsert, { ordered: false });
    console.log("Bulk inserting Departments...");
    await Department.insertMany(departmentsToInsert, { ordered: false });
    console.log("Bulk inserting Programs...");
    await Program.insertMany(programsToInsert, { ordered: false });

    console.log(`Relationally mapped and seeded ${programCount} programs.`);

    // 5. Seed Scholarships
    console.log("Seeding scholarships...");
    const scholarships = [
      { title: "MTN Foundation Scholarship", eligibility: "JAMB ≥ 250, Sciences", deadline: new Date("2026-08-15"), coverage: "₦600,000", category: "Merit" },
      { title: "Shell Nigeria Bursary", eligibility: "Engineering, GPA ≥ 4.0", deadline: new Date("2026-06-30"), coverage: "₦1,200,000", category: "STEM" },
      { title: "NNPC/Total National Merit", eligibility: "Nigerian, JAMB ≥ 260", deadline: new Date("2026-07-20"), coverage: "₦800,000", category: "Merit" },
      { title: "Agbami Medical Scholarship", eligibility: "Medicine, Year 2+", deadline: new Date("2026-09-01"), coverage: "₦500,000", category: "Need" },
      { title: "Google Africa Developer Scholarship", eligibility: "18+, Coding", deadline: new Date("2026-05-25"), coverage: "Free training", category: "Tech" },
    ];
    await Scholarship.insertMany(scholarships);
    console.log("Scholarships seeded.");

    // 6. Seed Demo Student (Ada Eze)
    console.log("Seeding student...");
    const demoStudent = await User.create({
      fullName: "Ada Eze",
      email: "ada.eze@example.com",
      password: "password123", // Automatic pre-save hashing
      role: "student",
      jambScore: 268,
      interests: ["AI", "Robotics", "Design", "Entrepreneurship"],
      preferredLocation: "Lagos",
    });
    console.log(`Demo Student registered: ${demoStudent.fullName}`);

    // 7. Seed Demo Administrator
    console.log("Seeding administrator...");
    const demoAdmin = await User.create({
      fullName: "Admin User",
      email: "admin@example.com",
      password: "admin123",
      role: "admin",
    });
    console.log(`Demo Admin registered: ${demoAdmin.fullName}`);

    const hennyAdmin = await User.create({
      fullName: "Henny Colour",
      email: "hennycolour@gmail.com",
      password: "Lasustech123@",
      role: "admin",
    });
    console.log(`Demo Admin registered: ${hennyAdmin.fullName}`);

    // 8. Seed Applications & Recommendations relationally
    console.log("Mapping and seeding transactional data (recommendations & applications)...");
    const unilag = institutionMap.get("University of Lagos");
    const covenant = institutionMap.get("Covenant University");
    
    // Find populated program IDs
    const findProgramId = async (instId, name) => {
      const p = await Program.findOne({ institutionId: instId, name });
      return p ? p._id : null;
    };

    const unilagCSId = await findProgramId(unilag._id, "Computer Science");
    const covenantCSId = await findProgramId(covenant._id, "Computer Science");

    if (unilagCSId && covenantCSId) {
      // Seed applications
      await Application.create([
        { studentId: demoStudent._id, universityId: unilag._id, courseId: unilagCSId, status: "reviewed", matchScore: 92 },
        { studentId: demoStudent._id, universityId: covenant._id, courseId: covenantCSId, status: "accepted", matchScore: 88 },
      ]);

      // Seed recommendations
      await Recommendation.create({
        userId: demoStudent._id,
        recommendedCourses: [
          { courseId: unilagCSId, matchPercentage: 94, explanation: "Excellent score alignment with UNILAG Computer Science cutoff requirements." },
          { courseId: covenantCSId, matchPercentage: 88, explanation: "Highly competitive profile matching Covenant University's modern tech program." }
        ],
        matchPercentage: 91
      });
      console.log("Transactional recommendations and application mappings completed.");
    }

    console.log("\x1b[32m[ETL Success] National Education Database Ingestion Completed Successfully!\x1b[0m");
    process.exit(0);
  } catch (error) {
    console.error(`\x1b[31m[ETL Failure] Ingestion failed: ${error.message}\x1b[0m`);
    process.exit(1);
  }
};

seedData();
