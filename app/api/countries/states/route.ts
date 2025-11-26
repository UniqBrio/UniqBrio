import { NextResponse } from 'next/server';

// Hardcoded states for major countries
const STATES_DATA: Record<string, string[]> = {
  'IN': [ // India
    'Andaman and Nicobar Islands', 'Andhra Pradesh', 'Arunachal Pradesh', 'Assam',
    'Bihar', 'Chandigarh', 'Chhattisgarh', 'Dadra and Nagar Haveli and Daman and Diu',
    'Delhi', 'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jammu and Kashmir',
    'Jharkhand', 'Karnataka', 'Kerala', 'Ladakh', 'Lakshadweep', 'Madhya Pradesh',
    'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha',
    'Puducherry', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana',
    'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal'
  ],
  'US': [ // United States
    'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado', 'Connecticut',
    'Delaware', 'Florida', 'Georgia', 'Hawaii', 'Idaho', 'Illinois', 'Indiana', 'Iowa',
    'Kansas', 'Kentucky', 'Louisiana', 'Maine', 'Maryland', 'Massachusetts', 'Michigan',
    'Minnesota', 'Mississippi', 'Missouri', 'Montana', 'Nebraska', 'Nevada', 'New Hampshire',
    'New Jersey', 'New Mexico', 'New York', 'North Carolina', 'North Dakota', 'Ohio',
    'Oklahoma', 'Oregon', 'Pennsylvania', 'Rhode Island', 'South Carolina', 'South Dakota',
    'Tennessee', 'Texas', 'Utah', 'Vermont', 'Virginia', 'Washington', 'West Virginia',
    'Wisconsin', 'Wyoming'
  ],
  'CA': [ // Canada
    'Alberta', 'British Columbia', 'Manitoba', 'New Brunswick', 'Newfoundland and Labrador',
    'Northwest Territories', 'Nova Scotia', 'Nunavut', 'Ontario', 'Prince Edward Island',
    'Quebec', 'Saskatchewan', 'Yukon'
  ],
  'GB': [ // United Kingdom
    'England', 'Scotland', 'Wales', 'Northern Ireland'
  ],
  'AU': [ // Australia
    'Australian Capital Territory', 'New South Wales', 'Northern Territory', 'Queensland',
    'South Australia', 'Tasmania', 'Victoria', 'Western Australia'
  ],
  'PK': [ // Pakistan
    'Azad Kashmir', 'Balochistan', 'Gilgit-Baltistan', 'Islamabad Capital Territory',
    'Khyber Pakhtunkhwa', 'Punjab', 'Sindh'
  ],
  'BD': [ // Bangladesh
    'Barisal', 'Chittagong', 'Dhaka', 'Khulna', 'Mymensingh', 'Rajshahi', 'Rangpur', 'Sylhet'
  ],
  'NP': [ // Nepal
    'Province 1', 'Province 2', 'Bagmati Province', 'Gandaki Province', 'Lumbini Province',
    'Karnali Province', 'Sudurpashchim Province'
  ],
  'LK': [ // Sri Lanka
    'Central Province', 'Eastern Province', 'North Central Province', 'Northern Province',
    'North Western Province', 'Sabaragamuwa Province', 'Southern Province', 'Uva Province',
    'Western Province'
  ],
  'MY': [ // Malaysia
    'Johor', 'Kedah', 'Kelantan', 'Kuala Lumpur', 'Labuan', 'Malacca', 'Negeri Sembilan',
    'Pahang', 'Penang', 'Perak', 'Perlis', 'Putrajaya', 'Sabah', 'Sarawak', 'Selangor', 'Terengganu'
  ],
  'SG': ['Singapore'], // Singapore
  'AE': [ // United Arab Emirates
    'Abu Dhabi', 'Ajman', 'Dubai', 'Fujairah', 'Ras Al Khaimah', 'Sharjah', 'Umm Al Quwain'
  ],
  'SA': [ // Saudi Arabia
    'Al Bahah', 'Al Jawf', 'Al Madinah', 'Al-Qassim', 'Eastern Province', "Ha'il",
    'Jazan', 'Makkah', 'Najran', 'Northern Borders', 'Riyadh', 'Tabuk', 'Asir'
  ],
  'DE': [ // Germany
    'Baden-Württemberg', 'Bavaria', 'Berlin', 'Brandenburg', 'Bremen', 'Hamburg', 'Hesse',
    'Lower Saxony', 'Mecklenburg-Vorpommern', 'North Rhine-Westphalia', 'Rhineland-Palatinate',
    'Saarland', 'Saxony', 'Saxony-Anhalt', 'Schleswig-Holstein', 'Thuringia'
  ],
  'FR': [ // France
    'Auvergne-Rhône-Alpes', 'Bourgogne-Franche-Comté', 'Brittany', 'Centre-Val de Loire',
    'Corsica', 'Grand Est', 'Hauts-de-France', 'Île-de-France', 'Normandy', 'Nouvelle-Aquitaine',
    'Occitanie', 'Pays de la Loire', "Provence-Alpes-Côte d'Azur"
  ],
  'IT': [ // Italy
    'Abruzzo', 'Aosta Valley', 'Apulia', 'Basilicata', 'Calabria', 'Campania', 'Emilia-Romagna',
    'Friuli-Venezia Giulia', 'Lazio', 'Liguria', 'Lombardy', 'Marche', 'Molise', 'Piedmont',
    'Sardinia', 'Sicily', 'Trentino-South Tyrol', 'Tuscany', 'Umbria', 'Veneto'
  ],
  'ES': [ // Spain
    'Andalusia', 'Aragon', 'Asturias', 'Balearic Islands', 'Basque Country', 'Canary Islands',
    'Cantabria', 'Castile and León', 'Castile-La Mancha', 'Catalonia', 'Ceuta', 'Extremadura',
    'Galicia', 'La Rioja', 'Madrid', 'Melilla', 'Murcia', 'Navarre', 'Valencian Community'
  ],
  'BR': [ // Brazil
    'Acre', 'Alagoas', 'Amapá', 'Amazonas', 'Bahia', 'Ceará', 'Distrito Federal', 'Espírito Santo',
    'Goiás', 'Maranhão', 'Mato Grosso', 'Mato Grosso do Sul', 'Minas Gerais', 'Pará', 'Paraíba',
    'Paraná', 'Pernambuco', 'Piauí', 'Rio de Janeiro', 'Rio Grande do Norte', 'Rio Grande do Sul',
    'Rondônia', 'Roraima', 'Santa Catarina', 'São Paulo', 'Sergipe', 'Tocantins'
  ],
  'MX': [ // Mexico
    'Aguascalientes', 'Baja California', 'Baja California Sur', 'Campeche', 'Chiapas', 'Chihuahua',
    'Coahuila', 'Colima', 'Durango', 'Guanajuato', 'Guerrero', 'Hidalgo', 'Jalisco', 'Mexico City',
    'México', 'Michoacán', 'Morelos', 'Nayarit', 'Nuevo León', 'Oaxaca', 'Puebla', 'Querétaro',
    'Quintana Roo', 'San Luis Potosí', 'Sinaloa', 'Sonora', 'Tabasco', 'Tamaulipas', 'Tlaxcala',
    'Veracruz', 'Yucatán', 'Zacatecas'
  ],
  'CN': [ // China
    'Anhui', 'Beijing', 'Chongqing', 'Fujian', 'Gansu', 'Guangdong', 'Guangxi', 'Guizhou',
    'Hainan', 'Hebei', 'Heilongjiang', 'Henan', 'Hong Kong', 'Hubei', 'Hunan', 'Inner Mongolia',
    'Jiangsu', 'Jiangxi', 'Jilin', 'Liaoning', 'Macau', 'Ningxia', 'Qinghai', 'Shaanxi',
    'Shandong', 'Shanghai', 'Shanxi', 'Sichuan', 'Tianjin', 'Tibet', 'Xinjiang', 'Yunnan', 'Zhejiang'
  ],
  'JP': [ // Japan
    'Aichi', 'Akita', 'Aomori', 'Chiba', 'Ehime', 'Fukui', 'Fukuoka', 'Fukushima', 'Gifu',
    'Gunma', 'Hiroshima', 'Hokkaido', 'Hyogo', 'Ibaraki', 'Ishikawa', 'Iwate', 'Kagawa',
    'Kagoshima', 'Kanagawa', 'Kochi', 'Kumamoto', 'Kyoto', 'Mie', 'Miyagi', 'Miyazaki',
    'Nagano', 'Nagasaki', 'Nara', 'Niigata', 'Oita', 'Okayama', 'Okinawa', 'Osaka', 'Saga',
    'Saitama', 'Shiga', 'Shimane', 'Shizuoka', 'Tochigi', 'Tokushima', 'Tokyo', 'Tottori',
    'Toyama', 'Wakayama', 'Yamagata', 'Yamaguchi', 'Yamanashi'
  ],
  'ZA': [ // South Africa
    'Eastern Cape', 'Free State', 'Gauteng', 'KwaZulu-Natal', 'Limpopo', 'Mpumalanga',
    'North West', 'Northern Cape', 'Western Cape'
  ],
  'NG': [ // Nigeria
    'Abia', 'Adamawa', 'Akwa Ibom', 'Anambra', 'Bauchi', 'Bayelsa', 'Benue', 'Borno',
    'Cross River', 'Delta', 'Ebonyi', 'Edo', 'Ekiti', 'Enugu', 'FCT', 'Gombe', 'Imo',
    'Jigawa', 'Kaduna', 'Kano', 'Katsina', 'Kebbi', 'Kogi', 'Kwara', 'Lagos', 'Nasarawa',
    'Niger', 'Ogun', 'Ondo', 'Osun', 'Oyo', 'Plateau', 'Rivers', 'Sokoto', 'Taraba', 'Yobe', 'Zamfara'
  ]
};

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const countryCode = searchParams.get('country');
    
    if (!countryCode) {
      return NextResponse.json(
        { success: false, error: 'Country code is required' },
        { status: 400 }
      );
    }
    
    const states = STATES_DATA[countryCode.toUpperCase()] || [];
    
    return NextResponse.json({
      success: true,
      data: states.map(state => ({ value: state, label: state }))
    });
  } catch (error) {
    console.error('Error fetching states:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch states' },
      { status: 500 }
    );
  }
}
