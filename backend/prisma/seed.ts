import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const password = await bcrypt.hash('password123', 10);

  const user = await prisma.user.upsert({
    where: { email: 'admin@realestate.com' },
    update: {},
    create: {
      email: 'admin@realestate.com',
      password,
      name: 'Admin RealEstate',
      phone: '+56 9 1234 5678',
      role: 'admin',
    },
  });

  const properties = [
    {
      title: 'Casa moderna en Vitacura',
      description: 'Espectacular casa moderna con piscina, jardín y vista a la cordillera. Cuenta con amplios espacios, cocina equipada, terraza y estacionamiento para 3 autos.',
      price: 450000,
      propertyType: 'house',
      listingType: 'sale',
      bedrooms: 5,
      bathrooms: 4,
      surface: 320,
      location: 'Vitacura, Santiago',
      status: 'available',
    },
    {
      title: 'Departamento en Providencia',
      description: 'Hermoso departamento en el corazón de Providencia. Cerca del metro, restaurants y centros comerciales. Edificio con conserjería, piscina y gimnasio.',
      price: 180000,
      propertyType: 'apartment',
      listingType: 'sale',
      bedrooms: 3,
      bathrooms: 2,
      surface: 120,
      location: 'Providencia, Santiago',
      status: 'available',
    },
    {
      title: 'Terreno en Chicureo',
      description: 'Terreno plano y bien ubicado en sector exclusivo de Chicureo. Ideal para construir casa soñada. Con acceso a agua, luz y caminos pavimentados.',
      price: 120000,
      propertyType: 'land',
      listingType: 'sale',
      bedrooms: null,
      bathrooms: null,
      surface: 5000,
      location: 'Chicureo, Colina',
      status: 'available',
    },
    {
      title: 'Local comercial en Las Condes',
      description: 'Local comercial en excelente ubicación, esquina de avenida principal. Alta afluencia de público, vitrinas amplias y bodega incluida.',
      price: 2500,
      propertyType: 'commercial',
      listingType: 'rent',
      bedrooms: null,
      bathrooms: 1,
      surface: 80,
      location: 'Las Condes, Santiago',
      status: 'reserved',
    },
    {
      title: 'Casa de campo en San José de Maipo',
      description: 'Encantadora casa de campo con terreno, ideal para fin de semana. Chimenea, piscina natural, árboles frutales y quincho. A 45 minutos de Santiago.',
      price: 180000,
      propertyType: 'house',
      listingType: 'sale',
      bedrooms: 4,
      bathrooms: 2,
      surface: 180,
      location: 'San José de Maipo',
      status: 'sold',
    },
    {
      title: 'Departamento amoblado en Ñuñoa',
      description: 'Departamento completamente amoblado, ideal para profesionales. Cerca de la Universidad de Chile y metro Ñuñoa. Wifi incluido, gastos comunes bajos.',
      price: 800,
      propertyType: 'apartment',
      listingType: 'rent',
      bedrooms: 2,
      bathrooms: 1,
      surface: 65,
      location: 'Ñuñoa, Santiago',
      status: 'available',
    },
    {
      title: 'Oficina en El Golf',
      description: 'Oficina en pleno barrio El Golf. Edificio corporativo con recepción, sala de reuniones y estacionamiento. Ideal para empresa de servicios.',
      price: 1500,
      propertyType: 'commercial',
      listingType: 'rent',
      bedrooms: null,
      bathrooms: 1,
      surface: 45,
      location: 'Las Condes, Santiago',
      status: 'rented',
    },
    {
      title: 'Terreno agrícola en Melipilla',
      description: 'Terreno agrícola productivo con permisos de riego. Plantación de paltos y cítricos. Camino interior, bodega y casa de trabajadores incluida.',
      price: 350000,
      propertyType: 'land',
      listingType: 'sale',
      bedrooms: null,
      bathrooms: null,
      surface: 15000,
      location: 'Melipilla',
      status: 'available',
    },
    {
      title: 'Penthouse en Barrio Bellavista',
      description: 'Espectacular penthouse con terraza de 100m2 y vista panorámica al cerro San Cristóbal. Piscina privada, cocina de diseño, walk-in closet.',
      price: 3500,
      propertyType: 'apartment',
      listingType: 'rent',
      bedrooms: 3,
      bathrooms: 3,
      surface: 200,
      location: 'Bellavista, Santiago',
      status: 'available',
    },
    {
      title: 'Casa en condominio en La Dehesa',
      description: 'Casa en condominio con seguridad 24/7. Area verde, piscina, cancha de tenis y juegos infantiles. Cocina abierta, loggia y pieza de servicio.',
      price: 650000,
      propertyType: 'house',
      listingType: 'sale',
      bedrooms: 4,
      bathrooms: 3,
      surface: 280,
      location: 'La Dehesa, Lo Barnechea',
      status: 'hidden',
    },
  ];

  await prisma.image.deleteMany();
  await prisma.property.deleteMany();

  for (let i = 0; i < properties.length; i++) {
    const prop = properties[i];
    const property = await prisma.property.create({
      data: {
        ...prop,
        currency: 'USD',
        surfaceUnit: 'm²',
        userId: user.id,
      },
    });

    const imageCount = 2 + (i % 3);
    for (let j = 0; j < imageCount; j++) {
      await prisma.image.create({
        data: {
          url: `https://picsum.photos/seed/${property.id}${j}/800/600`,
          filename: `property-${i + 1}-${j + 1}.jpg`,
          mimetype: 'image/jpeg',
          size: 0,
          isPrimary: j === 0,
          propertyId: property.id,
        },
      });
    }
  }

  console.log('Seed completed successfully!');
  console.log(`Created user: ${user.email} / password123`);
  console.log(`Created ${properties.length} properties with images`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
