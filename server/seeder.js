// server/seeder.js
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/user');
const Service = require('./models/Service');

// Load env vars
dotenv.config();

// Connect to DB
mongoose.connect(process.env.MONGODB_URI);

// Sample data
const services = [
  {
    title: 'Import Services',
    titleFr: 'Services d\'Importation',
    description: 'We source and import commodities from around the world, with a focus on African markets including foodstuffs, minerals, hardwood, and more.',
    descriptionFr: 'Nous approvisionnons et importons des produits du monde entier, avec un accent sur les marchés africains, y compris des denrées alimentaires, des minéraux, du bois dur et plus encore.',
    category: 'import',
    icon: 'fa-ship',
    featured: true,
    order: 1
  },
  {
    title: 'Export Services',
    titleFr: 'Services d\'Exportation',
    description: 'We export Canadian goods worldwide, including used cars, heavy equipment, clothing, machinery, building materials, and more.',
    descriptionFr: 'Nous exportons des produits canadiens dans le monde entier, y compris des voitures d\'occasion, des équipements lourds, des vêtements, des machines, des matériaux de construction et plus encore.',
    category: 'export',
    icon: 'fa-plane',
    featured: true,
    order: 2
  },
  {
    title: 'Logistics and Shipping',
    titleFr: 'Logistique et Expédition',
    description: 'We offer container delivery services (FCL and LCL), booking and freight forwarding, and customs clearance assistance.',
    descriptionFr: 'Nous offrons des services de livraison de conteneurs (FCL et LCL), de réservation et de transport de fret, ainsi que d\'assistance au dédouanement.',
    category: 'logistics',
    icon: 'fa-truck',
    featured: true,
    order: 3
  },
  {
    title: 'Storage Solutions',
    titleFr: 'Solutions d\'Entreposage',
    description: 'Secure warehousing and storage facilities to keep your goods safe before distribution.',
    descriptionFr: 'Installations d\'entreposage sécurisées pour garder vos marchandises en sécurité avant la distribution.',
    category: 'storage',
    icon: 'fa-warehouse',
    featured: false,
    order: 4
  },
  {
    title: 'Mechanic and Garage Services',
    titleFr: 'Services Mécaniques et de Garage',
    description: 'Our service garage in La Prairie provides general repairs for both our fleet and clients\' vehicles.',
    descriptionFr: 'Notre garage de service à La Prairie offre des réparations générales pour notre flotte et les véhicules de nos clients.',
    category: 'mechanic',
    icon: 'fa-wrench',
    featured: false,
    order: 5
  }
];

// Import sample data
const importData = async () => {
  try {
    // Clear existing data
    await Service.deleteMany();
    
    // Create admin user if not exists
    const adminExists = await User.findOne({ email: 'admin@groupedan.com' });
    if (!adminExists) {
      await User.create({
        name: 'Admin User',
        email: 'admin@groupedan.com',
        password: process.env.ADMIN_PASSWORD || 'password123',
        role: 'admin'
      });
      console.log('Admin user created');
    }
    
    // Import services
    await Service.insertMany(services);
    
    console.log('Data imported successfully');
    process.exit();
  } catch (error) {
    console.error('Error importing data:', error);
    process.exit(1);
  }
};

// Delete all data
const deleteData = async () => {
  try {
    await Service.deleteMany();
    console.log('Data destroyed successfully');
    process.exit();
  } catch (error) {
    console.error('Error deleting data:', error);
    process.exit(1);
  }
};

// Command line args
if (process.argv[2] === '-d') {
  deleteData();
} else {
  importData();
}