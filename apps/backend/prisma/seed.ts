import { PrismaClient, UserRole, SubscriptionTier } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Create demo company
  const company = await prisma.company.upsert({
    where: { id: '00000000-0000-0000-0000-000000000001' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000001',
      name: 'Demo Carpentry Co.',
      subscriptionTier: SubscriptionTier.PROFESSIONAL,
      address: '123 Main St, Austin, TX 78701',
      phone: '(512) 555-0100',
      defaultMarkup: 15.0,
      defaultTaxRate: 0.0825,
    },
  });

  // Create demo admin user
  const hashedPassword = await bcrypt.hash('Demo@2024!', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@demo.com' },
    update: {},
    create: {
      email: 'admin@demo.com',
      passwordHash: hashedPassword,
      firstName: 'John',
      lastName: 'Carpenter',
      role: UserRole.OWNER,
      companyId: company.id,
    },
  });

  // Create demo estimator user
  const estimator = await prisma.user.upsert({
    where: { email: 'estimator@demo.com' },
    update: {},
    create: {
      email: 'estimator@demo.com',
      passwordHash: hashedPassword,
      firstName: 'Jane',
      lastName: 'Estimator',
      role: UserRole.ESTIMATOR,
      companyId: company.id,
    },
  });

  // Create demo project with hierarchy
  const project = await prisma.project.upsert({
    where: { id: '00000000-0000-0000-0000-000000000010' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000010',
      companyId: company.id,
      name: 'Sunset Ridge Apartments',
      address: '456 Oak Ave',
      city: 'Austin',
      state: 'TX',
      zipCode: '78702',
      status: 'BIDDING',
      generalContractor: 'ABC General Contractors',
      architect: 'Smith & Associates',
    },
  });

  const building = await prisma.building.create({
    data: {
      projectId: project.id,
      name: 'Building A',
      sortOrder: 1,
    },
  });

  const floor = await prisma.floor.create({
    data: {
      buildingId: building.id,
      name: 'Floor 1',
      sortOrder: 1,
    },
  });

  const unit = await prisma.unit.create({
    data: {
      floorId: floor.id,
      name: 'Unit 101',
      unitType: '2BR/2BA',
      sortOrder: 1,
    },
  });

  await prisma.room.createMany({
    data: [
      { unitId: unit.id, name: 'Living Room', roomType: 'living', sortOrder: 1 },
      { unitId: unit.id, name: 'Master Bedroom', roomType: 'bedroom', sortOrder: 2 },
      { unitId: unit.id, name: 'Bedroom 2', roomType: 'bedroom', sortOrder: 3 },
      { unitId: unit.id, name: 'Kitchen', roomType: 'kitchen', sortOrder: 4 },
      { unitId: unit.id, name: 'Master Bath', roomType: 'bathroom', sortOrder: 5 },
      { unitId: unit.id, name: 'Hall Bath', roomType: 'bathroom', sortOrder: 6 },
    ],
  });

  console.log('Seed complete.');
  console.log(`  Company: ${company.name}`);
  console.log(`  Admin:   ${admin.email} / Demo@2024!`);
  console.log(`  Project: ${project.name}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
