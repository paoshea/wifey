import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Seed WiFi Hotspots
  const wifiHotspots = [
    {
      name: 'Central Library',
      location: {
        type: 'Point',
        coordinates: [-73.935242, 40.730610], // Example coordinates
      },
      provider: 'Public Library',
      speed: '50 Mbps',
      isPublic: true,
    },
    {
      name: 'Community Center',
      location: {
        type: 'Point',
        coordinates: [-73.935242, 40.730610], // Example coordinates
      },
      provider: 'City WiFi',
      speed: '40 Mbps',
      isPublic: true,
    },
  ];

  for (const hotspot of wifiHotspots) {
    await prisma.wifiHotspot.create({
      data: hotspot,
    });
  }

  console.log('Seed data inserted successfully');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });